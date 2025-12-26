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
                const mappedData = response.data.map((req: any) => ({
                    ...req,
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
