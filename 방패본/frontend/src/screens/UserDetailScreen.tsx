import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function UserDetailScreen({ route, navigation }: any) {
    const { userId } = route.params;
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);

    const fetchUserData = async () => {
        try {
            const [userRes, reviewsRes] = await Promise.all([
                api.get(`/auth/public/${userId}`),
                api.get(`/reviews/user/${userId}`)
            ]);
            setUser(userRes.data);
            setReviews(reviewsRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const handleBlock = async () => {
        Alert.alert(
            'Block User',
            `Are you sure you want to block ${user.name}? You will no longer see their posts or messages.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post('/safety/block', { targetUserId: userId });
                            Alert.alert('Success', 'User has been blocked.');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to block user.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-row items-center p-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold">User Profile</Text>
                <TouchableOpacity onPress={handleBlock}>
                    <Ionicons name="ellipsis-vertical" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView>
                <View className="bg-white p-6 items-center border-b border-gray-100">
                    <View className="w-24 h-24 bg-gray-200 rounded-full mb-4 items-center justify-center overflow-hidden">
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} className="w-full h-full" />
                        ) : (
                            <Ionicons name="person" size={48} color="gray" />
                        )}
                    </View>
                    <View className="flex-row items-center">
                        <Text className="text-2xl font-bold text-gray-900">{user?.name}</Text>
                        {user?.identityStatus === 'VERIFIED' && (
                            <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ marginLeft: 6 }} />
                        )}
                    </View>
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text className="text-gray-600 ml-1">{user?.rating?.toFixed(1) || '0.0'} ({user?.reviewCount || 0} reviews)</Text>
                    </View>
                </View>

                <View className="flex-row bg-white py-4 justify-around border-b border-gray-100">
                    <View className="items-center">
                        <Text className="text-lg font-bold text-gray-900">{user?._count?.requests || 0}</Text>
                        <Text className="text-gray-500 text-xs">Requests</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-lg font-bold text-gray-900">{user?._count?.reports || 0}</Text>
                        <Text className="text-gray-500 text-xs">Tasks Done</Text>
                    </View>
                </View>

                <View className="p-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Reviews</Text>
                    {reviews.length === 0 ? (
                        <View className="bg-white p-8 rounded-2xl items-center justify-center border border-gray-100">
                            <Ionicons name="chatbox-ellipses-outline" size={48} color="#d1d5db" />
                            <Text className="text-gray-400 mt-2">No reviews yet</Text>
                        </View>
                    ) : (
                        reviews.map((review) => (
                            <View key={review.id} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100">
                                <View className="flex-row justify-between items-center mb-2">
                                    <View className="flex-row items-center">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Ionicons key={s} name="star" size={12} color={s <= review.rating ? "#f59e0b" : "#d1d5db"} />
                                        ))}
                                    </View>
                                    <Text className="text-gray-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text className="text-gray-800">{review.content || 'Great experience!'}</Text>
                                <Text className="text-gray-500 text-xs mt-2">by {review.author.name}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View className="p-6">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ReportUser', { targetUserId: userId, targetUserName: user.name })}
                        className="flex-row items-center justify-center p-4 bg-white border border-red-100 rounded-xl"
                    >
                        <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                        <Text className="text-red-600 font-semibold ml-2">Report this user</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
