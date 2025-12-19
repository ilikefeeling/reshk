import React from 'react';
import { View, Text, Alert } from 'react-native';
import IMP from 'iamport-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';

export default function PaymentScreen({ route, navigation }: any) {
    const { amount, title, type, requestId } = route.params;

    /* [Required] User Code from PortOne Admin Dashboard */
    const userCode = 'imp12345678'; // Replace with your actual user code

    const data = {
        pg: 'html5_inicis',
        pay_method: 'card',
        name: title || 'Looking App Payment',
        merchant_uid: `mid_${new Date().getTime()}`,
        amount: Number(amount),
        buyer_name: 'Hong Gildong',
        buyer_tel: '010-1234-5678',
        buyer_email: 'example@example.com',
        app_scheme: 'lookingapp',
    };

    const callback = async (response: any) => {
        const { imp_success, imp_uid, merchant_uid, error_msg } = response;

        if (imp_success) {
            try {
                // Verify payment on backend
                await api.post('/payments/verify', {
                    imp_uid,
                    merchant_uid,
                    requestId,
                    amount: Number(amount),
                    type, // 'DEPOSIT' or 'REWARD'
                });

                Alert.alert('Success', 'Payment successful!');
                navigation.goBack();
            } catch (error: any) {
                console.error(error);
                Alert.alert('Error', 'Payment verification failed: ' + error.response?.data?.message);
            }
        } else {
            Alert.alert('Payment Failed', error_msg);
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <IMP.Payment
                userCode={userCode}
                data={data}
                callback={callback}
                loading={<View className="flex-1 justify-center items-center"><Text>Loading Payment...</Text></View>}
            />
        </SafeAreaView>
    );
}
