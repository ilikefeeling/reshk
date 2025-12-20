import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
        if (isLoggedIn || (token && token !== 'null' && token !== 'undefined')) {
            const currentRoute = navigation.getState().routes[navigation.getState().index];
            if (currentRoute.name === 'Main') {
                navigation.navigate('Main', { screen });
            } else {
                navigation.navigate(screen);
            }
        } else {
            console.log(`[AUTH] BottomNav: Unauthorized access attempt to ${screen}.`);
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
        <View style={styles.container}>
            {/* Home */}
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => handleTabPress('Home')}
            >
                <Ionicons
                    name={state.index === 0 ? "home" : "home-outline"}
                    size={24}
                    color={state.index === 0 ? "#6366f1" : "#9ca3af"}
                />
                <Text style={[styles.tabText, state.index === 0 && styles.activeTabText]}>홈</Text>
            </TouchableOpacity>

            {/* Chat */}
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => handleProtectedAction('ChatList')}
            >
                <Ionicons
                    name={state.index === 1 ? "chatbubbles" : "chatbubbles-outline"}
                    size={24}
                    color={state.index === 1 ? "#6366f1" : "#9ca3af"}
                />
                <Text style={[styles.tabText, state.index === 1 && styles.activeTabText]}>채팅</Text>
            </TouchableOpacity>

            {/* Admin (Always visible for verification) / Report (Default) */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => navigation.navigate('AdminDashboard')}
            >
                <Ionicons name="shield-checkmark" size={24} color="white" />
            </TouchableOpacity>

            {/* Request */}
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => handleProtectedAction('CreateRequest')}
            >
                <Ionicons name="paper-plane-outline" size={24} color="#9ca3af" />
                <Text style={styles.tabText}>의뢰</Text>
            </TouchableOpacity>

            {/* My */}
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => handleProtectedAction('Profile')}
            >
                <Ionicons
                    name={state.index === 2 ? "person" : "person-outline"}
                    size={24}
                    color={state.index === 2 ? "#6366f1" : "#9ca3af"}
                />
                <Text style={[styles.tabText, state.index === 2 && styles.activeTabText]}>내정보</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 64,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        flexDirection: 'row',
        justifyContent: 'space-around', // Changed from 'around' to 'space-around' for valid flexbox property
        alignItems: 'center',
        paddingBottom: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: '100%',
    },
    tabText: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: 'bold',
        color: '#9ca3af',
    },
    activeTabText: {
        color: '#6366f1',
    },
    floatingButton: {
        width: 56,
        height: 56,
        backgroundColor: '#4f46e5', // Corresponds to indigo-600
        borderRadius: 20,
        marginTop: -32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#ffffff',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
});
