import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import IMP from 'iamport-react-native';
import api from '../utils/api';

/* 가맹점 식별코드 */
const userCode = 'imp12345678'; // 실제 가맹점 식별코드로 변경 필요

export default function VerificationScreen({ navigation }: any) {
    const data = {
        merchant_uid: `mid_${new Date().getTime()}`,
        company: '아이고(IGO)',
        carrier: '', // KT, SKT, LGT, OTHERS 중 선택 가능
        name: '',
        phone: '',
    };

    const callback = async (response: any) => {
        const { success, imp_uid, error_msg } = response;

        if (success) {
            try {
                // 백엔드에 본인인증 결과 저장 및 상태 업데이트
                await api.put('/auth/profile', { identityStatus: 'VERIFIED' });
                navigation.replace('Main', { screen: 'Profile' });
            } catch (error) {
                console.error('Update profile error:', error);
                navigation.goBack();
            }
        } else {
            console.log('Certification failed:', error_msg);
            navigation.goBack();
        }
    };

    return (
        <IMP.Certification
            userCode={userCode}
            loading={<LoadingView />}
            data={data}
            callback={callback}
        />
    );
}

function LoadingView() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2563eb" />
        </View>
    );
}
