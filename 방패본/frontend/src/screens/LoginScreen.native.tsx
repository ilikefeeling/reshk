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
    // Dynamically determine origin from api.defaults.baseURL
    // Ensure we don't have trailing slashes or duplicate /api
    const apiURL = (api.defaults.baseURL || 'http://localhost:3002/api').replace(/\/+$/, '');
    const origin = apiURL.endsWith('/api') ? apiURL.slice(0, -4) : apiURL;
    const redirectUri = `${origin}/api/auth/kakao/callback`;

    // Add state to track the origin for the backend if needed
    const state = encodeURIComponent(origin);

    return `https://kauth.kakao.com/oauth/authorize?client_id=2bc4c5e9fef481cadb721dabddaf85b6&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
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

    const handleKakaoCode = async (code: string) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/kakao', { code });
            const { token, user } = response.data;

            if (token) {
                await login(token, user);
            } else {
                Alert.alert('오류', '로그인 응답이 올바르지 않습니다.');
            }
        } catch (error: any) {
            console.error('Kakao login fail:', error.response?.data || error.message);
            Alert.alert('로그인 실패', '카카오 로그인 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
            setShowKakao(false);
        }
    };

    const onNavigationStateChange = (navState: any) => {
        const { url } = navState;
        if (url.includes('code=')) {
            const code = url.split('code=')[1].split('&')[0];
            handleKakaoCode(code);
        } else if (url.includes('error=')) {
            setShowKakao(false);
            Alert.alert('로그인 취소', '카카오 로그인이 취소되었습니다.');
        }
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
