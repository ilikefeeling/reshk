import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual backend IP address (e.g., 192.168.x.x) for physical device testing
// For Android Emulator, use 'http://10.0.2.2:3000'
// For iOS Simulator, use 'http://localhost:3000'
import { Platform } from 'react-native';
const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        // 웹 환경: 로컬이면 3002 포트, 아니면 상위 경로(/api) 사용
        return window.location.hostname === 'localhost'
            ? 'http://localhost:3002/api'
            : '/api';
    }
    // 모바일 환경: 환경 변수가 있으면 사용, 없으면 로컬 에뮬레이터 주소 사용
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
