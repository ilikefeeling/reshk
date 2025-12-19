import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation, route }: any) {
    const { login, isLoggedIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async () => {
        setErrorMsg('');
        if (!email || !password) {
            setErrorMsg('이메일과 비밀번호를 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            if (token) {
                await login(token, user);
            } else {
                setErrorMsg('서버로부터 올바르지 않은 응답을 받았습니다.');
            }
        } catch (error: any) {
            console.error('Login Error:', error);
            const message = error.response?.data?.message || '로그인에 실패했습니다. 연결 상태를 확인해주세요.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <SafeAreaView className="flex-1 bg-white justify-center px-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-blue-600">LookingAll</Text>
                <Text className="text-gray-500 mt-2">Find what you need, help others.</Text>
            </View>

            <View className="space-y-4">
                {errorMsg ? (
                    <Text className="text-red-500 text-sm mb-2 text-center">{errorMsg}</Text>
                ) : null}
                <TextInput
                    placeholder="Email"
                    className="w-full bg-gray-100 p-4 rounded-lg"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    className="w-full bg-gray-100 p-4 rounded-lg"
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    className={`w-full bg-blue-600 p-4 rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">{loading ? '로그인 중...' : '로그인'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full p-4 items-center"
                    onPress={() => navigation.navigate('Signup')}
                >
                    <Text className="text-blue-600">계정이 없으신가요? 회원가입</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
