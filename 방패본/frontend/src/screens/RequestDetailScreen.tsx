import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image as RNImage, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { initialRequests } from '../context/PostContext';

export default function RequestDetailScreen({ route, navigation }: any) {
    const { id } = route.params;
    const { user } = useAuth();
    const currentUserId = user?.id;
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/requests/${id}`);
                if (response.data) {
                    setItem(response.data);
                } else {
                    throw new Error('No data');
                }
            } catch (error) {
                console.log(`API Fetch failed for ID ${id}, checking mock data...`);
                // Fallback to mock data ONLY if the ID matches mock patterns
                const fallbackItem = initialRequests.find((r: any) => String(r.id) === String(id)) as any;
                if (fallbackItem) {
                    setItem({
                        ...fallbackItem,
                        description: fallbackItem.description || `${fallbackItem.title}에 대한 상세 정보입니다.`,
                        location: fallbackItem.location || '위치 정보 없음',
                        rewardAmount: fallbackItem.reward ? parseInt(fallbackItem.reward.replace(/[^0-9]/g, '')) : 0,
                        createdAt: new Date().toISOString(),
                        category: fallbackItem.category || (fallbackItem.id % 2 === 0 ? 'FOUND' : 'LOST'),
                        images: fallbackItem.images || []
                    });
                } else {
                    setItem(null);
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
                <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                <Text className="text-xl font-bold text-gray-900 mt-4">데이터를 불러올 수 없습니다</Text>
                <Text className="text-gray-500 text-center mt-2 mb-8">
                    요청하신 정보를 찾을 수 없거나{'\n'}로그인이 필요할 수 있습니다.
                </Text>
                <TouchableOpacity
                    className="bg-gray-900 px-8 py-3 rounded-full"
                    onPress={() => navigation.goBack()}
                >
                    <Text className="text-white font-bold">홈으로 돌아가기</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isFoundItem = item.category === 'FOUND';

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
                <TouchableOpacity
                    className="bg-white/80 p-2 rounded-full"
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/80 p-2 rounded-full">
                    <Ionicons name="share-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView>
                {/* Image Carousel */}
                {item.images && item.images.length > 0 ? (
                    <ScrollView horizontal pagingEnabled className="h-72 bg-black">
                        {item.images.map((img: string, index: number) => (
                            <RNImage
                                key={index}
                                source={{ uri: img }}
                                className="w-screen h-72"
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View className="h-72 bg-gray-200 items-center justify-center">
                        <Ionicons name="image-outline" size={64} color="gray" />
                        <Text className="text-gray-500 mt-2">No Image</Text>
                    </View>
                )}

                <View className="p-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center mb-1">
                                <Text className={`px-2 py-0.5 rounded text-xs text-white mr-2 ${isFoundItem ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    {isFoundItem ? '습득물' : '분실물'}
                                </Text>
                                <Text className="text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">{item.title}</Text>
                            <Text className="text-gray-500 mt-1">📍 {item.location}</Text>
                        </View>
                        {!isFoundItem && (
                            <View className="bg-blue-100 px-4 py-2 rounded-full">
                                <Text className="text-blue-600 font-bold text-lg">₩{Number(item.rewardAmount).toLocaleString()}</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserDetail', { userId: item.userId })}
                        className="flex-row items-center mb-6 p-4 bg-gray-50 rounded-xl"
                    >
                        <View className="w-12 h-12 bg-gray-300 rounded-full mr-4 items-center justify-center overflow-hidden">
                            {item.user?.profileImage ? (
                                <RNImage source={{ uri: item.user.profileImage }} className="w-full h-full" />
                            ) : (
                                <Ionicons name="person" size={24} color="gray" />
                            )}
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center">
                                <Text className="font-bold text-gray-900">{item.user?.name || 'Unknown User'}</Text>
                                {item.user?.identityStatus === 'VERIFIED' && (
                                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginLeft: 4 }} />
                                )}
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text className="text-gray-500 text-sm ml-1">
                                    Rating {item.user?.rating?.toFixed(1) || '0.0'} ({item.user?.reviewCount || 0} reviews)
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>

                    <Text className="text-gray-800 text-lg leading-relaxed mb-8">
                        {item.description}
                    </Text>
                </View>
            </ScrollView>

            <View className="p-4 border-t border-gray-100 bg-white">
                {item.userId === currentUserId ? (
                    // If current user is the owner
                    item.status === 'IN_PROGRESS' ? (
                        <TouchableOpacity
                            className="bg-green-600 p-4 rounded-xl items-center shadow-lg"
                            onPress={async () => {
                                Alert.alert(
                                    'Complete Request',
                                    'Did you successfully get your item back?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Yes, Completed',
                                            onPress: async () => {
                                                try {
                                                    const res = await api.put(`/requests/${item.id}/complete`);
                                                    // In a real app, we need to know WHO helped. 
                                                    // For now, let's assume there's a chat partner or helperId.
                                                    // I'll just navigate to home or show alert.
                                                    Alert.alert('Success', 'Request marked as completed!');
                                                    navigation.navigate('Main');
                                                } catch (error) {
                                                    Alert.alert('Error', 'Failed to complete request');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Text className="text-white font-bold text-lg">거래 완료하기</Text>
                        </TouchableOpacity>
                    ) : item.status === 'COMPLETED' && !item.hasReview ? (
                        <TouchableOpacity
                            className="bg-amber-500 p-4 rounded-xl items-center shadow-lg"
                            onPress={() => navigation.navigate('Review', {
                                requestId: item.id,
                                targetUserId: 0, // Need to identify the helper
                                targetUserName: 'Helper'
                            })}
                        >
                            <Text className="text-white font-bold text-lg">후기 작성하기</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-gray-100 p-4 rounded-xl items-center">
                            <Text className="text-gray-500 font-bold">진행 중인 거래가 없습니다</Text>
                        </View>
                    )
                ) : (
                    // If current user is NOT the owner
                    isFoundItem ? (
                        <TouchableOpacity
                            className="bg-green-600 p-4 rounded-xl items-center shadow-lg"
                            onPress={() => navigation.navigate('Chat', { roomId: null, recipientId: item.userId })}
                        >
                            <Text className="text-white font-bold text-lg">제보자와 채팅하기</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            className="bg-blue-600 p-4 rounded-xl items-center shadow-lg"
                            onPress={() => navigation.navigate('Payment', {
                                amount: item.rewardAmount,
                                title: item.title,
                                type: 'REWARD',
                                requestId: item.id
                            })}
                        >
                            <Text className="text-white font-bold text-lg">사례금 지급하기 (₩{Number(item.rewardAmount).toLocaleString()})</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>
        </SafeAreaView>
    );
}
