import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function TransactionHistoryScreen({ navigation }: any) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const response = await api.get('/payments/my-transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTransactions();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return 'arrow-up-circle';
            case 'REWARD': return 'gift';
            case 'REFUND': return 'arrow-down-circle';
            default: return 'cash';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return '#ef4444';
            case 'REWARD': return '#10b981';
            case 'REFUND': return '#6b7280';
            default: return '#2563eb';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return styles.statusCompleted;
            case 'PENDING': return styles.statusPending;
            case 'FAILED': return styles.statusFailed;
            case 'REFUNDED': return styles.statusRefunded;
            default: return styles.statusDefault;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return '보증금';
            case 'REWARD': return '리워드';
            case 'REFUND': return '환불';
            default: return '거래';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return '완료';
            case 'PENDING': return '대기중';
            case 'FAILED': return '실패';
            case 'REFUNDED': return '환불됨';
            default: return status;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>거래 내역</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>거래 내역</Text>
                <View style={{ width: 32 }} />
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.transactionCard}>
                        <View style={styles.cardLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type) + '10' }]}>
                                <Ionicons
                                    name={getTypeIcon(item.type)}
                                    size={24}
                                    color={getTypeColor(item.type)}
                                />
                            </View>
                            <View style={styles.detailsContainer}>
                                <Text style={styles.typeLabel}>{getTypeLabel(item.type)}</Text>
                                <Text style={styles.requestTitle} numberOfLines={1}>
                                    {item.request?.title || '거래'}
                                </Text>
                                <Text style={styles.dateText}>
                                    {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.amountText}>
                                {Number(item.amount).toLocaleString()}원
                            </Text>
                            <Text style={[styles.statusLabel, getStatusStyle(item.status)]}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#ffffff',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    transactionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
        backgroundColor: '#ffffff',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsContainer: {
        marginLeft: 16,
        flex: 1,
    },
    typeLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    requestTitle: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    cardRight: {
        alignItems: 'end',
        justifyContent: 'center',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusCompleted: { color: '#059669' },
    statusPending: { color: '#d97706' },
    statusFailed: { color: '#dc2626' },
    statusRefunded: { color: '#6b7280' },
    statusDefault: { color: '#6b7280' },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: 40,
    },
    emptyText: {
        marginTop: 16,
        color: '#9ca3af',
        fontSize: 16,
        textAlign: 'center',
    },
});
