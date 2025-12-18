import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

export const Marker = (props: any) => null;
export const Callout = (props: any) => null;

const MapView = (props: any) => {
    return (
        <View style={[styles.container, props.style]}>
            <View style={styles.webPlaceholder}>
                <Text style={styles.icon}>📍</Text>
                <Text style={styles.title}>지도 기능 (Web)</Text>
                <Text style={styles.description}>
                    웹 브라우저에서는 현재{"\n"}
                    <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>텍스트로 직접 입력</Text> 방식을 권장합니다.
                </Text>
                <Text style={styles.hint}>* 모바일 앱에서는 전체 지도 기능이 지원됩니다.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    webPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f1f5f9',
    },
    icon: {
        fontSize: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    hint: {
        fontSize: 12,
        color: '#94a3b8',
    }
});

export default MapView;
