import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const navigation = useNavigation();
    const { isLoggedIn } = useAuth();

    const handleLoginPress = () => {
        if (isLoggedIn) {
            navigation.navigate('Main', { screen: 'Profile' });
        } else {
            navigation.navigate('Login');
        }
    };

    return (
        <View className="absolute top-0 left-0 right-0 h-14 bg-white shadow-md flex-row items-center justify-between px-4 z-10 pt-4">
            {/* Left: Search Icon */}
            <TouchableOpacity aria-label="Search">
                <Text className="text-xl">🔍</Text>
            </TouchableOpacity>

            {/* Center: Logo */}
            <View className="items-center">
                <Text className="font-bold text-lg">Looking</Text>
            </View>

            {/* Right: Notification and Login */}
            <View className="flex-row items-center space-x-2">
                <TouchableOpacity aria-label="Notifications" className="mr-2">
                    <Text className="text-xl">🔔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`${isLoggedIn ? 'bg-gray-200' : 'bg-blue-500'} rounded px-2 py-1`}
                    onPress={handleLoginPress}
                >
                    <Text className={`text-sm ${isLoggedIn ? 'text-black' : 'text-white'}`}>
                        {isLoggedIn ? '마이' : '로그인'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
