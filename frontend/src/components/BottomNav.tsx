import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BottomNav({ state, descriptors, navigation: tabNavigation }: BottomTabBarProps) {
    const { isLoggedIn, user } = useAuth();
    const navigation = useNavigation<any>();

    console.log('BottomNav: User Role =', user?.role, 'isLoggedIn =', isLoggedIn);

    const handleProtectedAction = async (screen: string) => {
        const token = await AsyncStorage.getItem('token');
        if (isLoggedIn || token) {
            // Check if the screen is part of the tab state
            const tabIndex = state.routes.findIndex((r: any) => r.name === screen);
            if (tabIndex !== -1) {
                tabNavigation.navigate(screen);
            } else {
                navigation.navigate(screen);
            }
        } else {
            navigation.navigate('Login', { redirect: screen });
        }
    };

    const handleTabPress = (routeName: string) => {
        const index = state.routes.findIndex((r: any) => r.name === routeName);
        if (index !== -1) {
            tabNavigation.navigate(routeName);
        } else {
            navigation.navigate(routeName);
        }
    };

    return (
        <View className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex-row justify-around items-center z-50 pb-2 shadow-lg">
            {/* Home */}
            <TouchableOpacity
                className="items-center justify-center w-16 h-full"
                onPress={() => handleTabPress('Home')}
            >
                <Ionicons
                    name={state.index === 0 ? "home" : "home-outline"}
                    size={24}
                    color={state.index === 0 ? "#6366f1" : "#9ca3af"}
                />
                <Text className={`text-[10px] mt-1 font-bold ${state.index === 0 ? 'text-indigo-600' : 'text-gray-400'}`}>홈</Text>
            </TouchableOpacity>

            {/* Chat */}
            <TouchableOpacity
                className="items-center justify-center w-16 h-full"
                onPress={() => handleProtectedAction('ChatList')}
            >
                <Ionicons
                    name={state.index === 1 ? "chatbubbles" : "chatbubbles-outline"}
                    size={24}
                    color={state.index === 1 ? "#6366f1" : "#9ca3af"}
                />
                <Text className={`text-[10px] mt-1 font-bold ${state.index === 1 ? 'text-indigo-600' : 'text-gray-400'}`}>채팅</Text>
            </TouchableOpacity>

            {/* Admin (Center if Admin) / Report (Default) */}
            {user?.role === 'ADMIN' ? (
                <TouchableOpacity
                    className="items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl -mt-8 border-4 border-white shadow-xl"
                    onPress={() => navigation.navigate('AdminDashboard')}
                >
                    <Ionicons name="shield-checkmark" size={24} color="white" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    className="items-center justify-center w-16 h-full"
                    onPress={() => handleProtectedAction('CreateReport')}
                >
                    <Ionicons name="camera-outline" size={26} color="#9ca3af" />
                    <Text className="text-[10px] mt-1 font-bold text-gray-400">제보</Text>
                </TouchableOpacity>
            )}

            {/* Request */}
            <TouchableOpacity
                className="items-center justify-center w-16 h-full"
                onPress={() => handleProtectedAction('CreateRequest')}
            >
                <Ionicons name="paper-plane-outline" size={24} color="#9ca3af" />
                <Text className="text-[10px] mt-1 font-bold text-gray-400">의뢰</Text>
            </TouchableOpacity>

            {/* My */}
            <TouchableOpacity
                className="items-center justify-center w-16 h-full"
                onPress={() => handleProtectedAction('Profile')}
            >
                <Ionicons
                    name={state.index === 2 ? "person" : "person-outline"}
                    size={24}
                    color={state.index === 2 ? "#6366f1" : "#9ca3af"}
                />
                <Text className={`text-[10px] mt-1 font-bold ${state.index === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>내정보</Text>
            </TouchableOpacity>
        </View>
    );
}
