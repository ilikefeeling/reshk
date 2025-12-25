import React, { createContext, useContext, useState } from 'react';

// Sample request data
export const initialRequests = [];

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
