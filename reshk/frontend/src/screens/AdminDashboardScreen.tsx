import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    TextInput,
    FlatList,
    RefreshControl,
    Image,
    StyleSheet,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

type AdminTab = 'Dashboard' | 'Registrations' | 'Payments' | 'Approvals' | 'Reports' | 'CS_Support';

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
    const [pendingReports, setPendingReports] = useState<any[]>([]);
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
                ticketRes,
                reportsRes
            ] = await Promise.all([
                api.get('/requests/admin/stats'),
                api.get('/admin-suite/requests'),
                api.get('/admin-suite/transactions'),
                api.get('/admin-suite/identities'),
                api.get('/admin-suite/tickets'),
                api.get('/admin-suite/reports/pending')
            ]);

            setStats(statsRes.data);
            setRequests(reqRes.data);
            setTransactions(txRes.data);
            setIdentityQueue(identityRes.data);
            setTickets(ticketRes.data);
            setPendingReports(reportsRes.data);
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

    useEffect(() => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    }, [activeTab]);

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

    const handleApproveRequest = async (id: number) => {
        try {
            setLoading(true);
            await api.post(`/requests/admin/${id}/approve`);
            Alert.alert('성공', '의뢰가 승인되었습니다. 이제 사용자들에게 노출됩니다.');
            fetchData();
        } catch (error: any) {
            console.error(error);
            Alert.alert('오류', error.response?.data?.message || '승인 처리 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        console.log('Bulk delete triggered. Selected IDs:', Array.from(selectedIds));
        if (selectedIds.size === 0) return;

        const isReports = activeTab === 'Reports';
        const targetName = isReports ? '제보' : '의뢰';
        const endpoint = isReports ? '/admin-suite/reports/bulk' : '/admin-suite/requests/bulk';

        const performDelete = async () => {
            try {
                setLoading(true);
                console.log(`[BULK_DELETE] Calling DELETE ${endpoint} with IDs:`, Array.from(selectedIds));
                const response = await api.delete(endpoint, {
                    data: { ids: Array.from(selectedIds) }
                });
                console.log(`[BULK_DELETE] Success:`, response.data);

                Alert.alert('성공', `선택한 ${targetName}들이 성공적으로 삭제되었습니다.`);
                setSelectedIds(new Set());
                setSelectionMode(false);

                // Refresh data to reflect changes
                fetchData();
            } catch (error: any) {
                console.error('[BULK_DELETE] Error:', error);
                const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message || '삭제 중 문제가 발생했습니다.';
                Alert.alert('삭제 오류', errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`선택한 ${selectedIds.size}개의 ${targetName}를 삭제하시겠습니까?`)) {
                performDelete();
            }
        } else {
            Alert.alert(
                `${targetName} 삭제`,
                `선택한 ${selectedIds.size}개의 ${targetName}를 삭제하시겠습니까?`,
                [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;

        const isReports = activeTab === 'Reports';
        const targetName = isReports ? '제보' : '의뢰';
        const endpoint = isReports ? '/admin-suite/reports/bulk-approve' : '/admin-suite/requests/bulk-approve';

        const performApprove = async () => {
            try {
                setLoading(true);
                await api.post(endpoint, {
                    ids: Array.from(selectedIds)
                });
                Alert.alert('성공', `선택한 ${selectedIds.size}개의 ${targetName}가 승인되었습니다.`);
                setSelectedIds(new Set());
                setSelectionMode(false);
                fetchData();
            } catch (error: any) {
                console.error('Bulk approve error:', error);
                Alert.alert('오류', error.response?.data?.message || '승인 처리 중 문제가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`선택한 ${selectedIds.size}개의 ${targetName}를 승인하시겠습니까?`)) {
                performApprove();
            }
        } else {
            Alert.alert(
                `${targetName} 승인`,
                `선택한 ${selectedIds.size}개의 ${targetName}를 승인하시겠습니까?`,
                [
                    { text: '취소', style: 'cancel' },
                    { text: '승인', onPress: performApprove }
                ]
            );
        }
    };

    const TabButton = ({ tab, icon, label }: { tab: AdminTab; icon: string; label: string }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
        >
            <Ionicons name={icon as any} size={20} color={activeTab === tab ? '#4f46e5' : '#9ca3af'} />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ title, value, icon, color }: any) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: color }]}>
                <Ionicons name={icon} size={20} color="white" />
            </View>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );

    const renderDashboard = () => (
        <ScrollView
            style={styles.dashboardScroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.statRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveTab('Registrations')}>
                    <StatCard title="오늘 신규" value={stats?.today || 0} icon="add-circle" color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveTab('Registrations')}>
                    <StatCard title="승인 대기" value={stats?.pending || 0} icon="time" color="#f59e0b" />
                </TouchableOpacity>
            </View>
            <View style={styles.statRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveTab('Registrations')}>
                    <StatCard title="의뢰 승인대기" value={stats?.pending - (stats?.pendingReports || 0) || 0} icon="time" color="#f59e0b" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveTab('Reports')}>
                    <StatCard title="제보 승인대기" value={stats?.pendingReports || 0} icon="megaphone" color="#ec4899" />
                </TouchableOpacity>
            </View>
            <View style={styles.statRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveTab('Payments')}>
                    <StatCard title="총 거래량" value={`${((stats?.revenue || 0) / 10000).toFixed(1)}만`} icon="wallet" color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveTab('CS_Support')}>
                    <StatCard title="CS 티켓" value={tickets.filter(t => t.status === 'OPEN').length} icon="chatbubbles" color="#f43f5e" />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>긴급 조치 사항</Text>
            {tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').map(ticket => (
                <View key={ticket.id} style={styles.urgentCard}>
                    <Ionicons name="alert-circle" size={24} color="#e11d48" />
                    <View style={styles.urgentInfo}>
                        <Text style={styles.urgentSubject}>{ticket.subject}</Text>
                        <Text style={styles.urgentMeta}>{ticket.user?.name} · {new Date(ticket.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('CS_Support')} style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>확인</Text>
                    </TouchableOpacity>
                </View>
            ))}

            {stats?.pendingReports > 0 && (
                <View style={[styles.identityAlert, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
                    <Ionicons name="megaphone" size={24} color="#f59e0b" />
                    <View style={styles.identityInfo}>
                        <Text style={[styles.identityAlertTitle, { color: '#92400e' }]}>신규 제보 {stats.pendingReports}건 도착</Text>
                        <Text style={[styles.identityAlertSubtitle, { color: '#b45309' }]}>실시간 매칭을 위해 빠른 검토가 필요합니다.</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('Reports')} style={[styles.identityBadge, { backgroundColor: '#f59e0b' }]}>
                        <Text style={styles.identityBadgeText}>검토하기</Text>
                    </TouchableOpacity>
                </View>
            )}

            {identityQueue.length > 0 && (
                <View style={styles.identityAlert}>
                    <Ionicons name="person-add" size={24} color="#d97706" />
                    <View style={styles.identityInfo}>
                        <Text style={styles.identityAlertTitle}>신원 인증 대기 {identityQueue.length}건</Text>
                        <Text style={styles.identityAlertSubtitle}>관리자의 서류 검토가 필요합니다.</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('Approvals')} style={styles.identityBadge}>
                        <Text style={styles.identityBadgeText}>이동</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderRegistrations = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>의뢰 관리 목록</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateRequest')}
                    style={styles.headerActionButton}
                >
                    <Ionicons name="add-circle" size={24} color="#4f46e5" />
                    <Text style={styles.headerActionText}>신규 등록</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={requests}
                keyExtractor={(item) => item.id.toString()}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    return (
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
                            style={[
                                styles.registrationCard,
                                selectedIds.has(item.id) && styles.registrationCardSelected
                            ]}
                        >
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.cardHeaderLeft}>
                                    {selectionMode && (
                                        <View style={[
                                            styles.checkbox,
                                            selectedIds.has(item.id) && styles.checkboxActive
                                        ]}>
                                            {selectedIds.has(item.id) && <Ionicons name="checkmark" size={12} color="white" />}
                                        </View>
                                    )}
                                    <Text style={styles.categoryLabel}>{item.category}</Text>
                                </View>
                                <View style={[
                                    styles.statusLabelWrapper,
                                    item.status === 'OPEN' ? styles.statusOpen : styles.statusClosed
                                ]}>
                                    <Text style={[
                                        styles.statusLabelText,
                                        item.status === 'OPEN' ? styles.statusOpenText : styles.statusClosedText
                                    ]}>{item.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text>
                            <View style={styles.cardFooter}>
                                <View style={styles.userRow}>
                                    <Ionicons name="person-outline" size={12} color="#9ca3af" />
                                    <Text style={styles.userNameText}>{item.user?.name}</Text>
                                </View>
                                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>

                            {(item.status === 'PENDING_DEPOSIT' || item.status === 'PENDING') && (
                                <TouchableOpacity
                                    onPress={() => handleApproveRequest(item.id)}
                                    style={styles.approveInlineButton}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                                    <Text style={styles.approveInlineButtonText}>
                                        {item.status === 'PENDING_DEPOSIT' ? '입금 확인 및 승인' : '제보 검토 및 승인'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );

    const renderPayments = () => (
        <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <View style={styles.transactionCard}>
                    <View style={[
                        styles.transactionIconWrapper,
                        item.type === 'REFUND' ? styles.iconRefund : styles.iconDeposit
                    ]}>
                        <Ionicons
                            name={item.type === 'REFUND' ? 'arrow-undo' : 'card-outline'}
                            size={18}
                            color={item.type === 'REFUND' ? '#e11d48' : '#059669'}
                        />
                    </View>
                    <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle}>{item.request?.title || '일반 거래'}</Text>
                        <Text style={styles.transactionMeta}>{item.user?.name} · {new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    <View style={styles.transactionAmountWrapper}>
                        <Text style={[
                            styles.amountText,
                            item.type === 'REFUND' ? styles.refundAmount : styles.depositAmount
                        ]}>
                            {item.type === 'REFUND' ? '-' : '+'}{Number(item.amount).toLocaleString()}원
                        </Text>
                        <Text style={styles.transactionStatusText}>{item.status}</Text>
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
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <View style={styles.approvalCard}>
                    <Text style={styles.approvalName}>{item.name}</Text>
                    <Text style={styles.approvalMeta}>{item.email} · {item.phone}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            onPress={() => Alert.alert('승인', '사용자를 승인하시겠습니까?')}
                            style={styles.approveButton}
                        >
                            <Text style={styles.approveButtonText}>승인</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.rejectButton}
                        >
                            <Text style={styles.rejectButtonText}>거절</Text>
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
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <View style={styles.ticketCard}>
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.priorityRow}>
                            <View style={[
                                styles.priorityDot,
                                { backgroundColor: item.priority === 'URGENT' ? '#f43f5e' : '#818cf8' }
                            ]} />
                            <Text style={styles.priorityText}>{item.priority}</Text>
                        </View>
                        <Text style={styles.ticketStatusText}>{item.status}</Text>
                    </View>
                    <Text style={styles.ticketSubject}>{item.subject}</Text>
                    <Text style={styles.ticketContent} numberOfLines={2}>{item.content}</Text>
                    <View style={styles.ticketFooter}>
                        <Text style={styles.ticketRequestMeta}>의뢰: {item.request?.title || '없음'}</Text>
                        <TouchableOpacity>
                            <Text style={styles.respondButtonText}>응대하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
    );

    const handleApproveReport = async (id: number) => {
        try {
            setLoading(true);
            await api.post(`/admin-suite/reports/${id}/approve`);
            Alert.alert('성공', '제보가 승인되었습니다.');
            fetchData();
        } catch (error) {
            Alert.alert('오류', '승인 처리 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectReport = async (id: number) => {
        Alert.prompt('거절 사유', '거절 사유를 입력해주세요.', [
            { text: '취소', style: 'cancel' },
            {
                text: '거절',
                onPress: async (reason: any) => {
                    try {
                        setLoading(true);
                        await api.post(`/admin-suite/reports/${id}/reject`, { reason });
                        Alert.alert('성공', '제보가 거절되었습니다.');
                        fetchData();
                    } catch (error) {
                        Alert.alert('오류', '거절 처리 중 문제가 발생했습니다.');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const renderReports = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>제보 관리 목록</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateReport')}
                    style={styles.headerActionButton}
                >
                    <Ionicons name="add-circle" size={24} color="#ec4899" />
                    <Text style={styles.headerActionText}>제보 하기</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={pendingReports}
                keyExtractor={(item) => item.id.toString()}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={styles.listContent}
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
                        style={[
                            styles.reportCard,
                            selectedIds.has(item.id) && styles.registrationCardSelected
                        ]}
                    >
                        <View style={styles.reportTopRow}>
                            <View style={styles.reportMainInfo}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {selectionMode && (
                                            <View style={[
                                                styles.checkbox,
                                                selectedIds.has(item.id) && styles.checkboxActive
                                            ]}>
                                                {selectedIds.has(item.id) && <Ionicons name="checkmark" size={12} color="white" />}
                                            </View>
                                        )}
                                        <Text style={styles.reportRequestTitle}>의뢰: {item.request?.title}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusLabelWrapper,
                                        item.status === 'ACCEPTED' ? styles.statusOpen : styles.statusClosed
                                    ]}>
                                        <Text style={[
                                            styles.statusLabelText,
                                            item.status === 'ACCEPTED' ? styles.statusOpenText : styles.statusClosedText
                                        ]}>{item.status}</Text>
                                    </View>
                                </View>
                                <Text style={styles.reportDescription}>{item.description}</Text>
                                <View style={styles.scoreRow}>
                                    <View style={[
                                        styles.scoreBadge,
                                        item.verificationScore > 0.7 ? styles.scoreHigh : styles.scoreMid
                                    ]}>
                                        <Text style={[
                                            styles.scoreText,
                                            item.verificationScore > 0.7 ? styles.scoreTextHigh : styles.scoreTextMid
                                        ]}>
                                            종합 신뢰도: {(item.verificationScore * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                    {item.aiScore !== undefined && item.aiScore !== null && (
                                        <View style={styles.aiBadge}>
                                            <Text style={styles.aiBadgeText}>
                                                AI 유사도: {(item.aiScore * 100).toFixed(0)}%
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            {item.images?.[0] && (
                                <Image source={{ uri: item.images[0] }} style={styles.reportThumbnail} />
                            )}
                        </View>

                        <View style={styles.exifBox}>
                            <Text style={styles.exifText}>📍 위치: {item.latitude && item.longitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : '정보 없음'}</Text>
                            <Text style={styles.exifText}>⏰ 촬영: {item.capturedAt ? new Date(item.capturedAt).toLocaleString() : '정보 없음'}</Text>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                onPress={() => handleApproveReport(item.id)}
                                style={styles.approveReportButton}
                            >
                                <Ionicons name="checkmark-circle" size={16} color="white" />
                                <Text style={styles.approveReportButtonText}>제보 승인</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleRejectReport(item.id)}
                                style={styles.rejectReportButton}
                            >
                                <Ionicons name="close-circle" size={16} color="#4b5563" />
                                <Text style={styles.rejectReportButtonText}>허위 제보 거절</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>검토 대기 중인 제보가 없습니다.</Text>
                    </View>
                )}
            />
        </View >
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerBrand}>LookingAll</Text>
                    <Text style={styles.headerSubtitle}>Command Center 2.0</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeHeaderButton}>
                    <Ionicons name="close" size={24} color="#4b5563" />
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TabButton tab="Dashboard" icon="analytics" label="홈" />
                <TabButton tab="Registrations" icon="list" label="매물" />
                <TabButton tab="Payments" icon="wallet" label="결제" />
                <TabButton tab="Reports" icon="search" label="제보" />
                <TabButton tab="Approvals" icon="shield-checkmark" label="인증" />
                <TabButton tab="CS_Support" icon="chatbubbles" label="CS" />
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {activeTab === 'Dashboard' && renderDashboard()}
                {activeTab === 'Registrations' && renderRegistrations()}
                {activeTab === 'Payments' && renderPayments()}
                {activeTab === 'Reports' && renderReports()}
                {activeTab === 'Approvals' && renderApprovals()}
                {activeTab === 'CS_Support' && renderCS()}
            </View>

            {/* Bulk Action Button */}
            {selectionMode && (activeTab === 'Registrations' || activeTab === 'Reports') && selectedIds.size > 0 && (
                <View style={styles.bulkActionWrapper}>
                    <TouchableOpacity
                        onPress={handleBulkApprove}
                        style={[styles.bulkButton, styles.bulkApproveButton]}
                    >
                        <Ionicons name="checkmark-done" size={20} color="white" />
                        <Text style={styles.bulkButtonText}>{selectedIds.size}개 일괄 승인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleBulkDelete}
                        style={[styles.bulkButton, styles.bulkDeleteButton]}
                    >
                        <Ionicons name="trash-outline" size={20} color="white" />
                        <Text style={styles.bulkButtonText}>일괄 삭제</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    tabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 8,
    },
    tabHeaderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerActionText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerBrand: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    closeHeaderButton: {
        width: 40,
        height: 40,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#4f46e5',
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: 'bold',
        color: '#9ca3af',
    },
    tabLabelActive: {
        color: '#4f46e5',
    },
    contentArea: {
        flex: 1,
        paddingTop: 16,
    },
    dashboardScroll: {
        flex: 1,
        paddingHorizontal: 16,
    },
    statRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statTitle: {
        color: '#94a3b8',
        fontSize: 10,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    urgentCard: {
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        flexDirection: 'row',
        alignItems: 'center',
    },
    urgentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    urgentSubject: {
        color: '#991b1b',
        fontWeight: 'bold',
        fontSize: 14,
    },
    urgentMeta: {
        color: '#b91c1c',
        fontSize: 12,
    },
    urgentBadge: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    urgentBadgeText: {
        color: '#e11d48',
        fontSize: 12,
        fontWeight: 'bold',
    },
    identityAlert: {
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
        flexDirection: 'row',
        alignItems: 'center',
    },
    identityInfo: {
        marginLeft: 12,
        flex: 1,
    },
    identityAlertTitle: {
        color: '#92400e',
        fontWeight: 'bold',
        fontSize: 14,
    },
    identityAlertSubtitle: {
        color: '#b45309',
        fontSize: 12,
    },
    identityBadge: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    identityBadgeText: {
        color: '#d97706',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 100,
    },
    registrationCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    registrationCardSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#f5f7ff',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    categoryLabel: {
        color: '#4f46e5',
        fontWeight: 'bold',
        fontSize: 12,
    },
    statusLabelWrapper: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusOpen: { backgroundColor: '#dcfce7' },
    statusClosed: { backgroundColor: '#f3f4f6' },
    statusLabelText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusOpenText: { color: '#15803d' },
    statusClosedText: { color: '#6b7280' },
    itemTitle: {
        color: '#1f2937',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    itemDescription: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userNameText: {
        color: '#6b7280',
        fontSize: 12,
        marginLeft: 4,
    },
    dateText: {
        color: '#9ca3af',
        fontSize: 10,
    },
    transactionCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconDeposit: { backgroundColor: '#dcfce7' },
    iconRefund: { backgroundColor: '#fef2f2' },
    transactionDetails: {
        marginLeft: 12,
        flex: 1,
    },
    transactionTitle: {
        color: '#1f2937',
        fontWeight: 'bold',
        fontSize: 14,
    },
    transactionMeta: {
        color: '#94a3b8',
        fontSize: 10,
    },
    transactionAmountWrapper: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontWeight: 'bold',
    },
    depositAmount: { color: '#059669' },
    refundAmount: { color: '#e11d48' },
    transactionStatusText: {
        color: '#9ca3af',
        fontSize: 10,
    },
    approvalCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    approvalName: {
        color: '#1f2937',
        fontWeight: 'bold',
        fontSize: 16,
    },
    approvalMeta: {
        color: '#6b7280',
        fontSize: 14,
        marginBottom: 16,
    },
    approveButton: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    approveButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    rejectButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#4b5563',
        fontWeight: 'bold',
        fontSize: 12,
    },
    ticketCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    priorityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    priorityText: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 10,
    },
    ticketStatusText: {
        color: '#4f46e5',
        fontWeight: 'bold',
        fontSize: 10,
    },
    ticketSubject: {
        color: '#1f2937',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    ticketContent: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 12,
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 8,
        borderRadius: 12,
    },
    ticketRequestMeta: {
        color: '#6b7280',
        fontSize: 10,
    },
    respondButtonText: {
        color: '#4f46e5',
        fontWeight: 'bold',
        fontSize: 10,
    },
    reportCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reportTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reportMainInfo: {
        flex: 1,
        marginRight: 16,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    reportRequestTitle: {
        color: '#94a3b8',
        fontSize: 10,
        marginBottom: 4,
    },
    reportDescription: {
        color: '#1f2937',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    scoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 4,
    },
    scoreHigh: { backgroundColor: '#d1fae5' },
    scoreMid: { backgroundColor: '#fef3c7' },
    scoreText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    scoreTextHigh: { color: '#065f46' },
    scoreTextMid: { color: '#92400e' },
    aiBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 4,
    },
    aiBadgeText: {
        color: '#3730a3',
        fontSize: 10,
        fontWeight: 'bold',
    },
    reportDate: {
        color: '#9ca3af',
        fontSize: 10,
        marginBottom: 4,
    },
    reportThumbnail: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    exifBox: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
    },
    exifText: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 2,
    },
    approveReportButton: {
        backgroundColor: '#059669',
        paddingVertical: 12,
        borderRadius: 16,
        flex: 1,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveReportButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    },
    rejectReportButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 12,
        borderRadius: 16,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectReportButtonText: {
        color: '#4b5563',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyText: {
        color: '#94a3b8',
        marginTop: 16,
        textAlign: 'center',
        fontSize: 16,
    },
    bulkActionWrapper: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        zIndex: 1000,
        elevation: 10,
        flexDirection: 'row',
        gap: 12,
    },
    bulkButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    bulkApproveButton: {
        backgroundColor: '#4f46e5',
        shadowColor: '#4f46e5',
    },
    bulkDeleteButton: {
        backgroundColor: '#f43f5e',
        shadowColor: '#f43f5e',
    },
    bulkButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    approveInlineButton: {
        backgroundColor: '#4f46e5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 12,
    },
    approveInlineButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 6,
    },
});

export default AdminDashboardScreen;
