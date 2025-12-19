import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function BlockedUsersScreen({ navigation }: any) {
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlocked = async () => {
        try {
            const res = await api.get('/safety/blocks');
            setBlockedUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocked();
    }, []);

    const handleUnblock = async (userId: number, name: string) => {
        Alert.alert(
            'Unblock User',
            `Do you want to unblock ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    onPress: async () => {
                        try {
                            await api.post('/safety/unblock', { targetUserId: userId });
                            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unblock user');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: any) => (
        <View className="flex-row items-center p-4 bg-white border-b border-gray-50">
            <View className="w-12 h-12 bg-gray-200 rounded-full mr-4 items-center justify-center overflow-hidden">
                {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} className="w-full h-full" />
                ) : (
                    <Ionicons name="person" size={24} color="gray" />
                )}
            </View>
            <Text className="flex-1 text-lg font-semibold text-gray-800">{item.name}</Text>
            <TouchableOpacity
                onPress={() => handleUnblock(item.id, item.name)}
                className="bg-gray-100 px-4 py-2 rounded-full"
            >
                <Text className="text-gray-600 font-bold">Unblock</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold">Blocked Users</Text>
                <View className="w-6" />
            </View>

            {blockedUsers.length === 0 ? (
                <View className="flex-1 justify-center items-center p-10">
                    <Ionicons name="shield-outline" size={64} color="#d1d5db" />
                    <Text className="text-gray-400 mt-4 text-center">You haven't blocked anyone yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                />
            )}
        </SafeAreaView>
    );
}
