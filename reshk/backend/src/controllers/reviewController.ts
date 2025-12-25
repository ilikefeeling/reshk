import { Response } from 'express';
import prisma from '../utils/prisma';

// Create a review
export const createReview = async (req: any, res: Response) => {
    try {
        const authorId = req.user?.userId;
        const { requestId, targetUserId, rating, content } = req.body;

        if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

        // Verify request exists and is completed (optional but recommended)
        const request = await prisma.request.findUnique({
            where: { id: requestId }
        });

        if (!request) return res.status(404).json({ message: 'Request not found' });
        // if (request.status !== 'COMPLETED') return res.status(400).json({ message: 'Request must be completed to leave a review' });

        // Create review and update user rating in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const review = await tx.review.create({
                data: {
                    requestId,
                    authorId,
                    targetUserId,
                    rating,
                    content
                }
            });

            // Update target user's aggregate rating
            const userReviews = await tx.review.findMany({
                where: { targetUserId }
            });

            const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
            const reviewCount = userReviews.length;
            const averageRating = totalRating / reviewCount;

            await tx.user.update({
                where: { id: targetUserId },
                data: {
                    rating: averageRating,
                    reviewCount: reviewCount
                }
            });

            return review;
        });

        res.status(201).json({ success: true, review: result });
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return res.status(400).json({ message: 'Review already exists for this request' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reviews for a user
export const getUserReviews = async (req: Request | any, res: Response) => {
    try {
        const userId = parseInt(req.params.userId || req.user?.userId);
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const reviews = await prisma.review.findMany({
            where: { targetUserId: userId },
            include: {
                author: {
                    select: { id: true, name: true, profileImage: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
