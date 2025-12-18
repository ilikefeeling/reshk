import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, TextInput, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

type AdminTab = 'Dashboard' | 'Registrations' | 'Payments' | 'Approvals' | 'CS_Support';

const AdminDashboardScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const isFocused = useIsFocused();

    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [stats, setStats] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [identityQueue, setIdentityQueue] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [
                statsRes,
                reqRes,
                txRes,
                identityRes,
                ticketRes
            ] = await Promise.all([
                api.get('/requests/admin/stats'),
                api.get('/admin-suite/requests'),
                api.get('/admin-suite/transactions'),
                api.get('/admin-suite/identities'),
                api.get('/admin-suite/tickets')
            ]);

            setStats(statsRes.data);
            setRequests(reqRes.data);
            setTransactions(txRes.data);
            setIdentityQueue(identityRes.data);
            setTickets(ticketRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '데이터를 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        if (newSelected.size === 0) setSelectionMode(false);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        Alert.alert(
            '항목 삭제',
            `선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.delete('/admin-suite/requests/bulk', {
                                data: { ids: Array.from(selectedIds) }
                            });
                            Alert.alert('성공', '선택한 항목들이 삭제되었습니다.');
                            setSelectedIds(new Set());
                            setSelectionMode(false);
                            fetchData();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const TabButton = ({ tab, icon, label }: { tab: AdminTab; icon: string; label: string }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(tab)}
            className={`flex-1 items-center py-3 ${activeTab === tab ? 'border-b-2 border-indigo-600' : ''}`}
        >
            <Ionicons name={icon as any} size={20} color={activeTab === tab ? '#4f46e5' : '#9ca3af'} />
            <Text className={`text-[10px] mt-1 font-bold ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ title, value, icon, color }: any) => (
        <View className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex-1 mx-1">
            <View className={`w-10 h-10 rounded-2xl items-center justify-center mb-2 ${color}`}>
                <Ionicons name={icon} size={20} color="white" />
            </View>
            <Text className="text-gray-400 text-[10px] mb-1">{title}</Text>
            <Text className="text-lg font-bold text-gray-800">{value}</Text>
        </View>
    );

    const renderDashboard = () => (
        <ScrollView
            className="flex-1 px-4"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View className="flex-row mt-4 mb-4">
                <StatCard title="오늘 신규" value={stats?.today || 0} icon="add-circle" color="bg-indigo-500" />
                <StatCard title="승인 대기" value={stats?.pending || 0} icon="time" color="bg-amber-500" />
            </View>
            <View className="flex-row mb-6">
                <StatCard title="총 거래량" value={`${((stats?.revenue || 0) / 10000).toFixed(1)}만`} icon="wallet" color="bg-emerald-500" />
                <StatCard title="CS 티켓" value={tickets.filter(t => t.status === 'OPEN').length} icon="chatbubbles" color="bg-rose-500" />
            </View>

            <Text className="text-lg font-bold text-gray-800 mb-4">긴급 조치 사항</Text>
            {tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').map(ticket => (
                <View key={ticket.id} className="bg-rose-50 p-4 rounded-2xl mb-3 border border-rose-100 flex-row items-center">
                    <Ionicons name="alert-circle" size={24} color="#e11d48" />
                    <View className="ml-3 flex-1">
                        <Text className="text-rose-900 font-bold text-sm">{ticket.subject}</Text>
                        <Text className="text-rose-700 text-xs">{ticket.user?.name} · {new Date(ticket.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('CS_Support')} className="bg-white px-3 py-1.5 rounded-xl">
                        <Text className="text-rose-600 text-xs font-bold">확인</Text>
                    </TouchableOpacity>
                </View>
            ))}

            {identityQueue.length > 0 && (
                <View className="bg-amber-50 p-4 rounded-2xl mb-3 border border-amber-100 flex-row items-center">
                    <Ionicons name="person-add" size={24} color="#d97706" />
                    <View className="ml-3 flex-1">
                        <Text className="text-amber-900 font-bold text-sm">신원 인증 대기 {identityQueue.length}건</Text>
                        <Text className="text-amber-700 text-xs">관리자의 서류 검토가 필요합니다.</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('Approvals')} className="bg-white px-3 py-1.5 rounded-xl">
                        <Text className="text-amber-600 text-xs font-bold">이동</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderRegistrations = () => (
        <FlatList
            data={requests}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
                <TouchableOpacity
                    onLongPress={() => {
                        setSelectionMode(true);
                        toggleSelection(item.id);
                    }}
                    onPress={() => {
                        if (selectionMode) {
                            toggleSelection(item.id);
                        }
                    }}
                    className={`bg-white mx-4 p-4 rounded-3xl mb-3 border ${selectedIds.has(item.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100'}`}
                >
                    <View className="flex-row justify-between mb-2">
                        <View className="flex-row items-center">
                            {selectionMode && (
                                <View className={`w-5 h-5 rounded-full mr-2 items-center justify-center border ${selectedIds.has(item.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                    {selectedIds.has(item.id) && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                            )}
                            <Text className="text-indigo-600 font-bold text-xs">{item.category}</Text>
                        </View>
                        <Text className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.status}
                        </Text>
                    </View>
                    <Text className="text-gray-800 font-bold text-base mb-1">{item.title}</Text>
                    <Text className="text-gray-400 text-xs mb-3" numberOfLines={1}>{item.description}</Text>
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={12} color="#9ca3af" />
                            <Text className="text-gray-500 text-xs ml-1">{item.user?.name}</Text>
                        </View>
                        <Text className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    );

    const renderPayments = () => (
        <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
                <View className="bg-white mx-4 p-4 rounded-3xl mb-3 border border-gray-100 flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${item.type === 'REFUND' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                        <Ionicons
                            name={item.type === 'REFUND' ? 'arrow-undo' : 'card-outline'}
                            size={18}
                            color={item.type === 'REFUND' ? '#e11d48' : '#059669'}
                        />
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="text-gray-800 font-bold text-sm">{item.request?.title || '일반 거래'}</Text>
                        <Text className="text-gray-400 text-[10px]">{item.user?.name} · {new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    <View className="items-end">
                        <Text className={`font-bold ${item.type === 'REFUND' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.type === 'REFUND' ? '-' : '+'}{Number(item.amount).toLocaleString()}원
                        </Text>
                        <Text className="text-gray-400 text-[10px]">{item.status}</Text>
                    </View>
                </View>
            )}
        />
    );

    const renderApprovals = () => (
        <FlatList
            data={identityQueue}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
                <View className="bg-white mx-4 p-4 rounded-3xl mb-3 border border-gray-100">
                    <Text className="text-gray-800 font-bold text-base">{item.name}</Text>
                    <Text className="text-gray-500 text-sm mb-4">{item.email} · {item.phone}</Text>
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={() => Alert.alert('승인', '사용자를 승인하시겠습니까?')}
                            className="bg-indigo-600 px-4 py-2 rounded-xl flex-1 mr-2 items-center"
                        >
                            <Text className="text-white font-bold text-xs">승인</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-gray-100 px-4 py-2 rounded-xl flex-1 items-center"
                        >
                            <Text className="text-gray-600 font-bold text-xs">거절</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
    );

    const renderCS = () => (
        <FlatList
            data={tickets}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
                <View className="bg-white mx-4 p-4 rounded-3xl mb-3 border border-gray-100">
                    <View className="flex-row justify-between mb-2">
                        <View className="flex-row items-center">
                            <View className={`w-2 h-2 rounded-full mr-2 ${item.priority === 'URGENT' ? 'bg-rose-500' : 'bg-indigo-400'}`} />
                            <Text className="text-gray-400 font-bold text-[10px]">{item.priority}</Text>
                        </View>
                        <Text className="text-indigo-600 font-bold text-[10px]">{item.status}</Text>
                    </View>
                    <Text className="text-gray-800 font-bold text-sm mb-1">{item.subject}</Text>
                    <Text className="text-gray-500 text-xs mb-3" numberOfLines={2}>{item.content}</Text>
                    <View className="flex-row justify-between items-center bg-gray-50 p-2 rounded-xl">
                        <Text className="text-gray-500 text-[10px]">의뢰: {item.request?.title || '없음'}</Text>
                        <TouchableOpacity>
                            <Text className="text-indigo-600 font-bold text-[10px]">응대하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
    );

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-4 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
                <View>
                    <Text className="text-2xl font-bold text-gray-800">LookingAll</Text>
                    <Text className="text-indigo-600 font-bold text-xs">Command Center 2.0</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                    <Ionicons name="close" size={24} color="#4b5563" />
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View className="flex-row bg-white px-2 border-b border-gray-100">
                <TabButton tab="Dashboard" icon="analytics" label="홈" />
                <TabButton tab="Registrations" icon="list" label="매물" />
                <TabButton tab="Payments" icon="wallet" label="결제" />
                <TabButton tab="Approvals" icon="shield-checkmark" label="인증" />
                <TabButton tab="CS_Support" icon="chatbubbles" label="CS" />
            </View>

            {/* Content Area */}
            <View className="flex-1 pt-4">
                {activeTab === 'Dashboard' && renderDashboard()}
                {activeTab === 'Registrations' && renderRegistrations()}
                {activeTab === 'Payments' && renderPayments()}
                {activeTab === 'Approvals' && renderApprovals()}
                {activeTab === 'CS_Support' && renderCS()}
            </View>

            {/* Bulk Action Button */}
            {selectionMode && activeTab === 'Registrations' && selectedIds.size > 0 && (
                <View className="absolute bottom-6 left-6 right-6">
                    <TouchableOpacity
                        onPress={handleBulkDelete}
                        className="bg-rose-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-200"
                    >
                        <Ionicons name="trash-outline" size={20} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">{selectedIds.size}개 일괄 삭제</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

export default AdminDashboardScreen;
