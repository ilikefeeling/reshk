import React, { createContext, useContext, useState } from 'react';

// Sample request data
export const initialRequests = [];

import api from '../utils/api';

type PostContextType = {
    requests: any[];
    setRequests: (requests: any[]) => void;
    refreshRequests: () => Promise<void>;
};

export const PostContext = createContext<PostContextType>({
    requests: initialRequests,
    setRequests: () => { },
    refreshRequests: async () => { },
});

export const PostProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<any[]>(initialRequests);

    const refreshRequests = React.useCallback(async () => {
        try {
            console.log('[DEBUG] PostContext: Global Refreshing...');
            const response = await api.get(`/requests?t=${Date.now()}`);
            if (response.data && Array.isArray(response.data)) {

                const fixImageUrl = (url: string) => {
                    if (!url) return '';
                    if (url.startsWith('http')) {
                        // 만약 배포 환경(lookingall.com 등)인데 URL이 localhost인 경우 현재 도메인으로 치환
                        const isProduction = typeof window !== 'undefined' &&
                            (window.location.hostname.includes('lookingall.com') ||
                                window.location.hostname.includes('vercel.app'));

                        if (isProduction) {
                            return url.replace(/https?:\/\/localhost:3002/, window.location.origin)
                                .replace(/https?:\/\/10\.0\.2\.2:3002/, window.location.origin);
                        }
                        return url;
                    }
                    // 상대 경로인 경우 현재 origin을 붙여줌
                    if (url.startsWith('/')) {
                        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002';
                        return `${origin}${url}`;
                    }
                    return url;
                };

                const mappedData = response.data.map((req: any) => ({
                    ...req,
                    images: (req.images || []).map(fixImageUrl),
                    reward: `₩${Number(req.rewardAmount).toLocaleString()}`,
                    date: new Date(req.createdAt).toLocaleDateString(),
                    keyword: req.category === 'LOST' || req.category === 'FOUND'
                        ? (req.title.includes('아이폰') ? '아이폰'
                            : (req.title.includes('강아지') || req.title.includes('개') ? '강아지'
                                : (req.title.includes('고양이') ? '고양이'
                                    : (req.title.includes('지갑') ? '지갑' : '가구'))))
                        : '가구'
                }));
                setRequests(mappedData);
            }
        } catch (error: any) {
            console.error('[DEBUG] PostContext: Refresh Error:', error.message);
        }
    }, [setRequests]);

    return (
        <PostContext.Provider value={{ requests, setRequests, refreshRequests }}>
            {children}
        </PostContext.Provider>
    );
};

export const usePost = () => useContext(PostContext);
