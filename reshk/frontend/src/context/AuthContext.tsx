import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: any;
    login: (token: string, user: any) => Promise<void>;
    logout: () => Promise<void>;
    checkLoginStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    isLoading: true,
    user: null,
    login: async () => { },
    logout: async () => { },
    checkLoginStatus: async () => { },
});

export const useAuth = () => useContext(AuthContext);

import api from '../utils/api';
import { authEvents } from '../utils/authEvents';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkLoginStatus = async () => {
        try {
            // Priority 1: Check if we just redirected from social login (Web only)
            if (Platform.OS === 'web') {
                const params = new URLSearchParams(window.location.search);
                const queryToken = params.get('token');
                const queryUser = params.get('user');
                const queryError = params.get('error');
                const queryReason = params.get('reason');

                if (queryError) {
                    console.error('[DEBUG] [AuthContext] Social login error:', queryError, queryReason);
                    alert(`로그인 중 오류가 발생했습니다: ${queryReason || queryError}\n\nVercel 환경 변수(KAKAO_CLIENT_SECRET 등)를 다시 확인해 주세요.`);
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                if (queryToken && queryUser) {
                    console.log('[DEBUG] [AuthContext] Social login parameters found in URL');
                    console.log('[DEBUG] [AuthContext] Token length:', queryToken.length);

                    try {
                        const decodedUser = decodeURIComponent(queryUser);
                        const parsedUser = JSON.parse(decodedUser);
                        console.log('[DEBUG] [AuthContext] User data parsed successfully:', parsedUser.email);

                        // Clear params to prevent reuse but AFTER we have them
                        window.history.replaceState({}, document.title, window.location.pathname);

                        await login(queryToken, parsedUser);
                        setIsLoading(false);
                        return;
                    } catch (parseError) {
                        console.error('[DEBUG] [AuthContext] Failed to parse user data from URL:', parseError);
                        console.error('[DEBUG] [AuthContext] Raw queryUser:', queryUser);
                    }
                } else {
                    console.log('[DEBUG] [AuthContext] No social login parameters in URL');
                }
            }

            const token = await AsyncStorage.getItem('token');
            if (token && token !== 'null' && token !== 'undefined') {
                // Validate token with backend
                console.log('Validating token on startup...');
                try {
                    const response = await api.get('/auth/me');
                    console.log('Token validation successful');
                    setUser(response.data);
                    setIsLoggedIn(true);
                } catch (err) {
                    console.log('Token validation failed:', err);
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    setUser(null);
                    setIsLoggedIn(false);
                }
            } else {
                console.log('No token found on startup');
                setUser(null);
                setIsLoggedIn(false);
            }
        } catch (e) {
            console.error(e);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkLoginStatus();

        // Subscribe to 401 events
        const unsubscribe = authEvents.subscribe(async () => {
            await logout();
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const login = async (token: string, userData: any) => {
        try {
            if (!token || typeof token !== 'string') {
                console.error('Invalid token:', token);
                return;
            }
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsLoggedIn(true);
            console.log('User logged in successfully');
        } catch (e) {
            console.error(e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setIsLoggedIn(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, checkLoginStatus }}>
            {children}
        </AuthContext.Provider>
    );
};
