
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const iconMap = {
    아이폰: '📱',
    말티즈: '🐕',
    가구: '🛋️',
};

export default function HomePage() {
    const { requests, setRequests } = usePost();
    const navigation = useNavigation();
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = React.useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            console.log('[DEBUG] HomePage: Fetching requests from', api.defaults.baseURL);
            const response = await api.get('/requests');
            console.log('[DEBUG] HomePage: Received', response.data.length, 'requests');

            // API 데이터를 UI에서 기대하는 형식으로 매핑
            const mappedData = response.data.map(req => ({
                ...req,
                reward: `₩${Number(req.rewardAmount).toLocaleString()}`,
                date: new Date(req.createdAt).toLocaleDateString(),
                keyword: req.category === 'LOST' || req.category === 'FOUND' ? (req.title.includes('아이폰') ? '아이폰' : (req.title.includes('강아지') || req.title.includes('개') ? '말티즈' : '가구')) : '가구'
            }));

            console.log('[DEBUG] HomePage: Data mapped successfully. Item count:', mappedData.length);
            if (setRequests) setRequests(mappedData);
        } catch (error) {
            console.error('[DEBUG] HomePage: Fetch Error:', error.message);
            if (error.response) {
                console.error('  Status:', error.response.status);
                console.error('  Data:', error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRequests();
    }, []);

    // Refresh when screen comes into focus
    const { useFocusEffect } = require('@react-navigation/native');
    useFocusEffect(
        React.useCallback(() => {
            fetchRequests();
        }, [])
    );

    const handleProtectedAction = (screen) => {
        if (isLoggedIn) {
            navigation.navigate(screen);
        } else {
            navigation.navigate('Login', { redirect: screen });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Header />
            <ScrollView className="flex-1 mt-14 mb-16" contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Banner */}
                <View className="bg-blue-100 rounded-lg p-4 m-4 shadow-sm items-center relative">
                    <TouchableOpacity
                        className="absolute top-2 right-2 p-2 bg-white/40 rounded-full z-10"
                        onPress={() => navigation.navigate('Guide')}
                    >
                        <Ionicons name="information-circle-outline" size={20} color="#1e40af" />
                    </TouchableOpacity>

                    <Text className="text-lg font-bold mb-2 text-center text-gray-800 mt-2">
                        우리 서비스에 오신 것을 환영합니다
                    </Text>

                    <View className="flex-row justify-center space-x-4 mt-2">
                        <TouchableOpacity
                            className="bg-blue-500 rounded-lg px-4 py-2 mr-2"
                            onPress={() => handleProtectedAction('CreateRequest')}
                        >
                            <Text className="text-white font-bold">의뢰하기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-green-500 rounded-lg px-4 py-2"
                            onPress={() => handleProtectedAction('CreateReport')}
                        >
                            <Text className="text-white font-bold">제보하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Service Info */}
                <View className="flex-row justify-between mb-4 mx-4">
                    <TouchableOpacity
                        className="flex-1 items-center bg-white rounded-lg p-3 mx-1 shadow-sm"
                        onPress={() => navigation.navigate('ServiceInfo', { initialSection: 1 })}
                    >
                        <Text className="text-2xl mb-1">💰</Text>
                        <Text className="text-sm font-medium text-gray-700">사례금</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 items-center bg-white rounded-lg p-3 mx-1 shadow-sm"
                        onPress={() => navigation.navigate('ServiceInfo', { initialSection: 2 })}
                    >
                        <Text className="text-2xl mb-1">🛡️</Text>
                        <Text className="text-sm font-medium text-gray-700">보증금</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 items-center bg-white rounded-lg p-3 mx-1 shadow-sm"
                        onPress={() => navigation.navigate('ServiceInfo', { initialSection: 3 })}
                    >
                        <Text className="text-2xl mb-1">✅</Text>
                        <Text className="text-sm font-medium text-gray-700">100% 지급</Text>
                    </TouchableOpacity>
                </View>

                {/* Request List Header */}
                <View className="flex-row justify-between items-center mb-2 px-6">
                    <Text className="font-semibold text-lg text-gray-800">최근 의뢰</Text>
                    <TouchableOpacity onPress={() => console.log('Load more')}>
                        <Text className="text-blue-500 text-sm">더보기 &gt;</Text>
                    </TouchableOpacity>
                </View>

                {/* Request List */}
                <View className="px-4 space-y-3">
                    {requests.map((req) => (
                        <TouchableOpacity
                            key={req.id}
                            className="flex-row items-center bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100"
                            onPress={() => navigation.navigate('RequestDetail', { id: req.id })}
                        >
                            {/* Icon */}
                            <View className="w-12 h-12 items-center justify-center bg-gray-100 rounded-full mr-3">
                                <Text className="text-2xl">{iconMap[req.keyword] || '❓'}</Text>
                            </View>
                            {/* Info */}
                            <View className="flex-1">
                                <Text className="font-bold text-gray-800 text-base mb-1">{req.title}</Text>
                                <Text className="text-xs text-gray-500">
                                    {req.date} • 조회 0
                                </Text>
                            </View>
                            {/* Price */}
                            <View className="bg-blue-50 px-3 py-1 rounded-md">
                                <Text className="text-sm font-bold text-blue-600">
                                    {req.rewardAmount ? `₩${Number(req.rewardAmount).toLocaleString()}` : (req.reward || '₩0')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView >
        </SafeAreaView >
    );
}
