import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function SignupScreen({ navigation }: any) {
    const { isLoggedIn, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        if (isLoggedIn) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        }
    }, [isLoggedIn, navigation]);

    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSignup = async () => {
        setErrorMsg('');
        if (!email || !password || !name) {
            setErrorMsg('성함, 이메일, 비밀번호는 필수 입력 항목입니다.');
            return;
        }

        try {
            setLoading(true);
            console.log('Sending Signup Request:', { email, name, phone });
            const response = await api.post('/auth/register', { email, password, name, phone });
            console.log('Signup API Success:', response.data);

            if (response.data.token) {
                const successMsg = `${name}님, 회원가입이 완료되었습니다.`;
                const handleSuccess = () => {
                    const { token, user } = response.data;
                    if (token && user) {
                        login(token, user);
                    } else {
                        navigation.navigate('Login');
                    }
                };

                if (Platform.OS === 'web') {
                    alert(successMsg);
                    handleSuccess();
                } else {
                    Alert.alert('환영합니다!', successMsg, [
                        { text: '확인', onPress: handleSuccess }
                    ]);
                }
            }
        } catch (error: any) {
            console.log('Signup Frontend Error Object:', error);
            if (error.response) {
                console.log('Signup Error Response Data:', error.response.data);
                console.log('Signup Error Response Status:', error.response.status);
            }
            const message = error.response?.data?.message || '회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white justify-center px-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-blue-600">Join Looking</Text>
                <Text className="text-gray-500 mt-2">Create an account to start.</Text>
            </View>

            <View className="space-y-4">
                {errorMsg ? (
                    <Text className="text-red-500 text-sm mb-2 text-center">{errorMsg}</Text>
                ) : null}
                <TextInput
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    className="w-full bg-gray-100 p-4 rounded-lg"
                />
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    className="w-full bg-gray-100 p-4 rounded-lg"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChangeText={setPhone}
                    className="w-full bg-gray-100 p-4 rounded-lg"
                    keyboardType="phone-pad"
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    className="w-full bg-gray-100 p-4 rounded-lg"
                />

                <TouchableOpacity
                    className={`w-full bg-blue-600 p-4 rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? '가입 중...' : '회원가입'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full p-4 items-center"
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text className="text-blue-600">Already have an account? Log In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
