import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// WebView should only be imported on non-web platforms
let WebView: any;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
}

const getKakaoAuthUrl = () => {
    // redirectUri MUST be the backend callback endpoint
    const apiBase = (api.defaults.baseURL || 'http://localhost:3002/api').replace(/\/+$/, '');
    const redirectUri = `${apiBase}/auth/kakao/callback`;

    // Add state to track the origin for the backend
    // For Native, we use the base of apiBase (usually stripping /api)
    const origin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    const state = encodeURIComponent(origin);

    return `https://kauth.kakao.com/oauth/authorize?client_id=2bc4c5e9fef481cadb721dabddaf85b6&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&prompt=login`;
};

export default function LoginScreen({ navigation, route }: any) {
    const { login, isLoggedIn } = useAuth();
    const [showKakao, setShowKakao] = useState(false);
    const [loading, setLoading] = useState(false);

    const redirectTarget = route.params?.redirect;

    useEffect(() => {
        if (isLoggedIn) {
            const target = redirectTarget || 'Home';
            const tabScreens = ['Home', 'ChatList', 'Profile'];

            if (tabScreens.includes(target)) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main', params: { screen: target } }],
                });
            } else {
                navigation.reset({
                    index: 0,
                    routes: [
                        { name: 'Main' },
                        { name: target as any }
                    ],
                });
            }
        }
    }, [isLoggedIn, navigation, redirectTarget]);

    const handleKakaoLogin = () => {
        if (Platform.OS === 'web') {
            // For Web, direct redirect
            window.location.href = getKakaoAuthUrl();
        } else {
            // For Native, show WebView Modal
            setShowKakao(true);
        }
    };


    const onNavigationStateChange = (navState: any) => {
        const { url } = navState;
        console.log('[DEBUG] WebView Navigation:', url);

        // 1. Check if the URL contains the token (Backend has finished processing)
        if (url.includes('token=') && url.includes('user=')) {
            try {
                // Parse params manually if URL object is finicky in some environments
                const tokenMatch = url.match(/token=([^&]+)/);
                const userMatch = url.match(/user=([^&]+)/);

                if (tokenMatch && userMatch) {
                    console.log('[DEBUG] Token captured from final redirect, logging in...');
                    const token = tokenMatch[1];
                    const user = JSON.parse(decodeURIComponent(userMatch[1]));
                    login(token, user);
                    setShowKakao(false);
                }
            } catch (error) {
                console.error('Error parsing token from URL:', error);
            }
            return;
        }

        // 2. Handle Errors
        if (url.includes('error=')) {
            setShowKakao(false);
            Alert.alert('로그인 취소', '카카오 로그인이 취소되었습니다.');
        }

        // NOTE: We intentionally do NOT handle 'code=' here anymore.
        // The WebView will naturally redirect to the Backend callback,
        // which will then redirect back to our app with the 'token='.
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>LookingAll</Text>
                <Text style={styles.subtitle}>Find what you need, help others.</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.kakaoButton}
                    onPress={handleKakaoLogin}
                    disabled={loading}
                >
                    <Text style={styles.kakaoButtonText}>카카오톡으로 로그인</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    로그인 시 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
                </Text>
            </View>

            {Platform.OS !== 'web' && (
                <Modal visible={showKakao} animationType="slide">
                    <SafeAreaView style={{ flex: 1 }}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowKakao(false)}
                        >
                            <Text style={styles.closeButtonText}>닫기</Text>
                        </TouchableOpacity>
                        <WebView
                            source={{ uri: getKakaoAuthUrl() }}
                            onNavigationStateChange={onNavigationStateChange}
                            javaScriptEnabled={true}
                        />
                    </SafeAreaView>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 8,
    },
    buttonContainer: {
        marginTop: 20,
    },
    kakaoButton: {
        backgroundColor: '#FEE500',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    kakaoButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 24,
    },
    closeButton: {
        padding: 16,
        alignItems: 'flex-end',
        backgroundColor: '#f3f4f6',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: 'bold',
    },
});
