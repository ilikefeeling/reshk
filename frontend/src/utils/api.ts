import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual backend IP address (e.g., 192.168.x.x) for physical device testing
// For Android Emulator, use 'http://10.0.2.2:3000'
// For iOS Simulator, use 'http://localhost:3000'
import { Platform } from 'react-native';
const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';

        // If localhost, stick to 3002 for backend
        if (hostname === 'localhost') {
            return 'http://localhost:3002/api';
        }

        // If not localhost (e.g., browsing via IP), use the same IP but point to backend port 3002
        // Unless it's a Vercel/Production deployment where /api is routed by proxy
        if (hostname.includes('vercel.app') || hostname.includes('github.io') || hostname.includes('lookingall.com')) {
            return `${protocol}//${hostname}${port}/api`;
        }

        // Browsing via Local IP (e.g. 192.168.x.x)
        return `${protocol}//${hostname}:3002/api`;
    }

    // Native: Preference order: Env Var > PC Lan IP (placeholder) > Emulator Default
    return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3002/api';
};

const BASE_URL = getBaseUrl();

console.log('Current API BASE_URL:', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor to handle 401s
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status}`);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`API Error: ${error.config.method?.toUpperCase()} ${error.config.url} ${error.response.status}`);
            console.error('Error Data:', error.response.data);
            if (error.response.status === 401) {
                import('./authEvents').then(({ authEvents }) => {
                    authEvents.emitResponse401();
                });
            }
        } else {
            console.error('API Error (No Response):', error.message);
        }
        return Promise.reject(error);
    }
);

// Add a request interceptor to inject the token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        console.log(`[API Request] [${config.method?.toUpperCase()}] ${config.url} | BASE_URL: ${BASE_URL} | Token Present: ${!!token}`);
        if (token && token !== 'null' && token !== 'undefined') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
