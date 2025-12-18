import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-600';
            case 'PENDING': return 'text-yellow-600';
            case 'FAILED': return 'text-red-600';
            case 'REFUNDED': return 'text-gray-600';
            default: return 'text-gray-600';
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
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row items-center p-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold ml-4">거래 내역</Text>
                </View>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-4">거래 내역</Text>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }) => (
                    <View className="p-4 border-b border-gray-100">
                        <View className="flex-row justify-between items-start">
                            <View className="flex-row items-center flex-1">
                                <Ionicons
                                    name={getTypeIcon(item.type)}
                                    size={24}
                                    color={getTypeColor(item.type)}
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="font-semibold">{getTypeLabel(item.type)}</Text>
                                    <Text className="text-gray-500 text-sm">
                                        {item.request?.title || '거래'}
                                    </Text>
                                    <Text className="text-gray-400 text-xs mt-1">
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
                            <View className="items-end">
                                <Text className="font-bold text-lg">
                                    {Number(item.amount).toLocaleString()}원
                                </Text>
                                <Text className={`text-sm ${getStatusColor(item.status)}`}>
                                    {getStatusLabel(item.status)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center p-8 mt-20">
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text className="text-gray-400 mt-4 text-center">거래 내역이 없습니다</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
