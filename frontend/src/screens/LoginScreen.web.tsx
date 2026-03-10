import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';


export default function LoginScreen({ navigation, route }: any) {
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const redirectTarget = route.params?.redirect;

    useEffect(() => {
        if (isLoggedIn) {
            handleConfirm();
        }
    }, [isLoggedIn]);

    const handleConfirm = () => {
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
    };

    const getKakaoAuthUrl = () => {
        const frontendOrigin = window.location.origin;

        // redirectUri MUST be the backend callback endpoint
        // api.defaults.baseURL is usually '.../api'
        const apiBase = (api.defaults.baseURL || 'http://localhost:3002/api').replace(/\/+$/, '');
        const redirectUri = `${apiBase}/auth/kakao/callback`;

        // Use state to tell the backend where to redirect back after processing
        const state = encodeURIComponent(frontendOrigin);

        return `https://kauth.kakao.com/oauth/authorize?client_id=2bc4c5e9fef481cadb721dabddaf85b6&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&prompt=login`;
    };

    const handleKakaoLogin = () => {
        setLoading(true);
        window.location.href = getKakaoAuthUrl();
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
                    <Text style={styles.kakaoButtonText}>
                        {loading ? '로그인 중...' : '카카오톡으로 로그인'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    로그인 시 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
                </Text>
            </View>

            {/* Success Modal Overlay */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Text style={styles.modalIcon}>✅</Text>
                        </View>
                        <Text style={styles.modalTitle}>로그인 성공</Text>
                        <Text style={styles.modalMessage}>성공적으로 로그인되었습니다.</Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.modalButtonText}>확인하고 계속하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIcon: {
        fontSize: 30,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        width: '100%',
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
