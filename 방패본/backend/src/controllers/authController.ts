import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                phone,
            },
        });

        // Generate token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const kakaoLogin = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Code is required' });

        // Change code for a token
        const hostname = req.get('host') || '';
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const origin = `${protocol}://${hostname}`;

        // redirectUri MUST match whatever was sent during the authorization code request
        // We prioritize the incoming request origin to ensure they match perfectly (fixing KOE006/invalid_client)
        const redirectUri = `${origin}/api/auth/kakao/callback`;

        console.log(`[DEBUG] Kakao Login POST: origin=${origin}, redirectUri=${redirectUri}`);

        const tokenParams: any = {
            grant_type: 'authorization_code',
            client_id: '2bc4c5e9fef481cadb721dabddaf85b6',
            redirect_uri: redirectUri,
            code,
        };

        // Add client_secret ONLY if provided in env (fixes invalid_client if secret is enabled on Kakao)
        if (process.env.KAKAO_CLIENT_SECRET) {
            tokenParams.client_secret = process.env.KAKAO_CLIENT_SECRET;
        }

        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: tokenParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });

        const accessToken = tokenResponse.data.access_token;

        // Get user info from Kakao
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });

        const kakaoUser = userResponse.data;
        const email = kakaoUser.kakao_account?.email || `kakao_${kakaoUser.id}@kakao.user`;
        const name = kakaoUser.properties?.nickname || 'Kakao User';
        const profileImage = kakaoUser.properties?.profile_image;

        // Upsert user in our database
        // We use email as the unique identifier for simplicity, or we could add a kakaoId field
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    profileImage,
                    passwordHash: 'SOCIAL_LOGIN', // Placeholder
                },
            });
        }

        // Generate our own JWT
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, profileImage: user.profileImage } });
    } catch (error: any) {
        if (error.response) {
            console.error('[DEBUG] Kakao Token Exchange Fail:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Kakao Login Error:', error.message);
        }
        res.status(500).json({ message: 'Social login failed', error: error.response?.data?.error_description || error.message });
    }
};

export const kakaoCallback = async (req: Request, res: Response) => {
    try {
        // Reuse the logic from kakaoLogin but for a GET request/redirect
        const { code, state } = req.query;
        if (!code) return res.redirect('https://www.lookingall.com/login?error=no_code');

        const hostname = req.get('host') || '';
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const origin = `${protocol}://${hostname}`;

        // Use state to determine where to redirect back after login
        let frontendOrigin = state ? decodeURIComponent(state as string) : 'https://www.lookingall.com';

        // redirectUri MUST match what was sent during the code request
        const redirectUri = `${origin}/api/auth/kakao/callback`;

        console.log(`[DEBUG] Kakao Callback: protocol=${req.protocol}, host=${req.get('host')}, redirectUri=${redirectUri}`);

        console.log('[DEBUG] Step 1: Requesting Kakao Token...');
        const tokenParams: any = {
            grant_type: 'authorization_code',
            client_id: '2bc4c5e9fef481cadb721dabddaf85b6',
            redirect_uri: redirectUri,
            code,
        };

        if (process.env.KAKAO_CLIENT_SECRET) {
            tokenParams.client_secret = process.env.KAKAO_CLIENT_SECRET;
        }

        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: tokenParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });
        console.log('[DEBUG] Step 1 Success: Token received');

        const accessToken = tokenResponse.data.access_token;
        console.log('[DEBUG] Step 2: Requesting User Info...');
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });
        console.log('[DEBUG] Step 2 Success: User info received', userResponse.data.id);

        const kakaoUser = userResponse.data;
        const email = kakaoUser.kakao_account?.email || `kakao_${kakaoUser.id}@kakao.user`;
        const name = kakaoUser.properties?.nickname || 'Kakao User';
        const profileImage = kakaoUser.properties?.profile_image;

        console.log('[DEBUG] Step 3: DB Lookup/Create for email:', email);
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('[DEBUG] Step 3: User not found, creating...');
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    profileImage,
                    passwordHash: 'SOCIAL_LOGIN',
                },
            });
            console.log('[DEBUG] Step 3: User created');
        } else {
            console.log('[DEBUG] Step 3: User found', user.id);
        }

        console.log('[DEBUG] Step 4: Generating JWT...');
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        console.log('[DEBUG] Step 4 Success: JWT generated');

        // Redirect back to frontend with token
        const frontendUser = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, profileImage: user.profileImage }));
        const finalRedirectUrl = `${frontendOrigin.replace(/\/+$/, '')}/?token=${token}&user=${frontendUser}`;
        console.log('[DEBUG] Redirecting to:', finalRedirectUrl);
        res.redirect(finalRedirectUrl);
    } catch (error: any) {
        console.error('Kakao Callback Error:', error.response?.data || error.message);
        res.redirect('https://www.lookingall.com/login?error=callback_failed');
    }
};

export const getProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: { requests: true, reports: true }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            profileImage: user.profileImage,
            role: user.role,
            stats: {
                requests: user._count.requests,
                reports: user._count.reports,
                rating: 5.0 // Placeholder for now
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Push Token
export const updatePushToken = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { pushToken } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });

        res.status(200).json({ message: 'Push token updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Profile
export const updateProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, phone, profileImage } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(profileImage && { profileImage }),
            },
        });

        res.status(200).json({
            id: updated.id,
            email: updated.email,
            name: updated.name,
            phone: updated.phone,
            profileImage: updated.profileImage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Requests
export const getMyRequests = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const requests = await prisma.request.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Reports
export const getMyReports = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const reports = await prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                request: { select: { title: true, status: true } },
            },
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get Public Profile
export const getUserPublicProfile = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                profileImage: true,
                identityStatus: true,
                rating: true,
                reviewCount: true,
                _count: {
                    select: { requests: true, reports: true }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
