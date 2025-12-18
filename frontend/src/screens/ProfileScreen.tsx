import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

export default function ProfileScreen({ navigation }: any) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error(error);
            // If unauthorized, maybe redirect to login
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchProfile();
        }
    }, [isFocused]);

    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
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
            <ScrollView>
                {/* Header Profile Section */}
                <View className="bg-white p-6 items-center border-b border-gray-100">
                    <View className="w-24 h-24 bg-gray-200 rounded-full mb-4 items-center justify-center overflow-hidden">
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} className="w-full h-full" />
                        ) : (
                            <Ionicons name="person" size={48} color="gray" />
                        )}
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
                            <Ionicons name="camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</Text>
                    <Text className="text-gray-500">{user?.email}</Text>
                </View>

                {/* Stats Section */}
                <View className="flex-row bg-white mt-4 py-4 justify-around border-y border-gray-100">
                    <View className="items-center">
                        <Text className="text-xl font-bold text-blue-600">{user?.stats?.requests || 0}</Text>
                        <Text className="text-gray-500 text-sm">Requests</Text>
                    </View>
                    <View className="w-[1px] bg-gray-200" />
                    <View className="items-center">
                        <Text className="text-xl font-bold text-blue-600">{user?.stats?.reports || 0}</Text>
                        <Text className="text-gray-500 text-sm">Tasks Done</Text>
                    </View>
                    <View className="w-[1px] bg-gray-200" />
                    <View className="items-center">
                        <Text className="text-xl font-bold text-blue-600">{user?.stats?.rating || '5.0'}</Text>
                        <Text className="text-gray-500 text-sm">Rating</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="mt-6 bg-white border-y border-gray-100">
                    <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50">
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-4">
                            <Ionicons name="person-outline" size={20} color="#2563eb" />
                        </View>
                        <Text className="flex-1 text-lg text-gray-800">Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50">
                        <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-4">
                            <Ionicons name="card-outline" size={20} color="#16a34a" />
                        </View>
                        <Text className="flex-1 text-lg text-gray-800">Payment History</Text>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>

                    {user?.role === 'ADMIN' && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AdminDashboard')}
                            className="flex-row items-center p-4 border-b border-gray-50"
                        >
                            <View className="w-10 h-10 bg-amber-50 rounded-full items-center justify-center mr-4">
                                <Ionicons name="shield-checkmark-outline" size={20} color="#d97706" />
                            </View>
                            <Text className="flex-1 text-lg text-gray-800 font-bold">Manager Dashboard</Text>
                            <Ionicons name="chevron-forward" size={20} color="gray" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50">
                        <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-4">
                            <Ionicons name="settings-outline" size={20} color="#9333ea" />
                        </View>
                        <Text className="flex-1 text-lg text-gray-800">Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>
                </View>

                <View className="mt-6 bg-white border-y border-gray-100 mb-10">
                    <TouchableOpacity
                        className="flex-row items-center p-4"
                        onPress={handleLogout}
                    >
                        <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-4">
                            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                        </View>
                        <Text className="flex-1 text-lg text-red-600">Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
