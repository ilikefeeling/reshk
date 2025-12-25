import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Platform, StyleSheet } from 'react-native';
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
            const response = await api.post('/auth/register', { email, password, name, phone });

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
            const message = error.response?.data?.message || '회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Join Looking</Text>
                <Text style={styles.subtitle}>Create an account to start.</Text>
            </View>

            <View style={styles.form}>
                {errorMsg ? (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}
                <TextInput
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                />
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#9ca3af"
                />
                <TextInput
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                />

                <TouchableOpacity
                    style={[styles.signupButton, loading && styles.disabledButton]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.signupButtonText}>
                        {loading ? '가입 중...' : '회원가입'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginLinkText}>Already have an account? Log In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 30, // 3xl
        fontWeight: 'bold',
        color: '#2563eb', // blue-600
    },
    subtitle: {
        color: '#6b7280', // gray-500
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    errorText: {
        color: '#ef4444', // red-500
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f3f4f6', // gray-100
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    signupButton: {
        backgroundColor: '#2563eb', // blue-600
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    signupButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    disabledButton: {
        opacity: 0.5,
    },
    loginLink: {
        padding: 16,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#2563eb', // blue-600
        fontSize: 16,
    },
});
