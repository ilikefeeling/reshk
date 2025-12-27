import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const navigation = useNavigation();
    const { isLoggedIn, logout } = useAuth();

    const handleLoginPress = () => {
        if (isLoggedIn) {
            // Change behavior to Logout if already logged in
            logout();
            alert('로그아웃 되었습니다.');
        } else {
            navigation.navigate('Login');
        }
    };

    return (
        <View style={styles.container}>
            {/* Left: Spacer (Search icon removed) */}
            <View style={{ width: 24 }} />

            {/* Center: Logo */}
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Looking</Text>
            </View>

            {/* Right: Notification and Login/Logout */}
            <View style={styles.rightSection}>
                <TouchableOpacity aria-label="Notifications" style={styles.notificationIcon}>
                    <Text style={styles.iconText}>🔔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: isLoggedIn ? '#ef4444' : '#3b82f6' }]}
                    onPress={handleLoginPress}
                >
                    <Text style={styles.loginButtonText}>
                        {isLoggedIn ? '로그아웃' : '로그인'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 56,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'between',
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 10,
    },
    iconText: {
        fontSize: 20,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#1f2937',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationIcon: {
        marginRight: 8,
    },
    loginButton: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    loginButtonText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 'medium',
    },
});
