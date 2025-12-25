import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
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
        escrow: false, // Add missing required property
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
        <SafeAreaView style={styles.safeArea}>
            <IMP.Payment
                userCode={userCode}
                data={data}
                callback={callback}
                loading={
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading Payment...</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        marginTop: 10,
        color: '#6b7280',
        fontSize: 16,
    },
});
