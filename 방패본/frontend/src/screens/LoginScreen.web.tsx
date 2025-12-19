import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=50fabbcf9a9d8375b8655c807a3d3f0f&redirect_uri=https://www.lookingall.com/api/auth/kakao/callback&response_type=code`;

export default function LoginScreen({ navigation, route }: any) {
    const { isLoggedIn } = useAuth();
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
        setLoading(true);
        // Direct redirect for Web
        window.location.href = KAKAO_AUTH_URL;
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
});
