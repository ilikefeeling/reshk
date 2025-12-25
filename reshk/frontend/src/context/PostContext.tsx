import React, { createContext, useContext, useState } from 'react';

// Sample request data
export const initialRequests = [
    { id: 1, title: '아이폰 분실', date: '2025-12-01', reward: '₩50,000', keyword: '아이폰' },
    { id: 2, title: '말티즈 분양', date: '2025-12-05', reward: '₩30,000', keyword: '말티즈' },
    { id: 3, title: '가구 운반', date: '2025-12-10', reward: '₩70,000', keyword: '가구' },
];

type PostContextType = {
    requests: any[];
    setRequests: (requests: any[]) => void;
};

export const PostContext = createContext<PostContextType>({
    requests: initialRequests,
    setRequests: () => { },
});

export const PostProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<any[]>(initialRequests);

    return (
        <PostContext.Provider value={{ requests, setRequests }}>
            {children}
        </PostContext.Provider>
    );
};

export const usePost = () => useContext(PostContext);
