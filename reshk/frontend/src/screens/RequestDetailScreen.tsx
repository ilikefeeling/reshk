import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image as RNImage, Alert, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { initialRequests } from '../context/PostContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useFocusEffect } from '@react-navigation/native';

export default function RequestDetailScreen({ route, navigation }: any) {
    const { id } = route.params;
    const { user, isLoggedIn } = useAuth();
    const currentUserId = user?.id;
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);

    const fetchDetail = React.useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            console.log(`[DEBUG] RequestDetail: Fetching ID ${id} with cache buster`);
            // Add timestamp to bypass any caching
            const response = await api.get(`/requests/${id}?t=${Date.now()}`);
            if (response.data) {
                setItem(response.data);
                if (response.data.userId === currentUserId) {
                    try {
                        const reportsRes = await api.get(`/reports/request/${id}?t=${Date.now()}`);
                        setReports(reportsRes.data);
                    } catch (err) {
                        console.log('Failed to fetch reports:', err);
                    }
                }
            }
        } catch (error: any) {
            console.log(`API Fetch failed for ID ${id}:`, error.message);
            const fallbackItem = initialRequests.find((r: any) => String(r.id) === String(id)) as any;
            if (fallbackItem) {
                setItem({
                    ...fallbackItem,
                    description: fallbackItem.description || `${fallbackItem.title}에 대한 상세 정보입니다.`,
                    location: fallbackItem.location || '위치 정보 없음',
                    rewardAmount: fallbackItem.reward ? parseInt(fallbackItem.reward.replace(/[^0-9]/g, '')) : 0,
                    createdAt: new Date().toISOString(),
                    category: fallbackItem.category || (fallbackItem.id % 2 === 0 ? 'FOUND' : 'LOST'),
                    images: fallbackItem.images || []
                });
            }
        } finally {
            setLoading(false);
        }
    }, [id, currentUserId]);

    useFocusEffect(
        React.useCallback(() => {
            fetchDetail();
        }, [fetchDetail])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                <Text style={styles.errorTitle}>데이터를 불러올 수 없습니다</Text>
                <Text style={styles.errorSubtitle}>
                    요청하신 정보를 찾을 수 없거나{"\n"}로그인이 필요할 수 있습니다.
                </Text>
                <TouchableOpacity
                    style={styles.backHomeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backHomeButtonText}>홈으로 돌아가기</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isFoundItem = item.category === 'FOUND';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.floatingHeader}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="share-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Image Carousel */}
                {item.images && item.images.length > 0 ? (
                    <ScrollView horizontal pagingEnabled style={styles.imageCarousel}>
                        {item.images.map((img: string, index: number) => (
                            <RNImage
                                key={index}
                                source={{ uri: img }}
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noImageContainer}>
                        <Ionicons name="image-outline" size={64} color="#9ca3af" />
                        <Text style={styles.noImageText}>No Image</Text>
                    </View>
                )}

                <View style={styles.contentContainer}>
                    <View style={styles.itemHeader}>
                        <View style={styles.headerMain}>
                            <View style={styles.badgeRow}>
                                <View style={[styles.categoryBadge, isFoundItem ? styles.foundBadge : styles.lostBadge]}>
                                    <Text style={styles.categoryBadgeText}>
                                        {isFoundItem ? '습득물' : '분실물'}
                                    </Text>
                                </View>
                                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.titleText}>{item.title}</Text>
                            <Text style={styles.locationText}>📍 {item.location}</Text>
                        </View>
                        {!isFoundItem && (
                            <View style={styles.rewardBadge}>
                                <Text style={styles.rewardText}>₩{Number(item.rewardAmount).toLocaleString()}</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserDetail', { userId: item.userId })}
                        style={styles.userCard}
                    >
                        <View style={styles.avatarWrapper}>
                            {item.user?.profileImage ? (
                                <RNImage source={{ uri: item.user.profileImage }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={24} color="#9ca3af" />
                            )}
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.userNameRow}>
                                <Text style={styles.userName}>{item.user?.name || 'Unknown User'}</Text>
                                {item.user?.identityStatus === 'VERIFIED' && (
                                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginLeft: 4 }} />
                                )}
                            </View>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text style={styles.ratingText}>
                                    Rating {item.user?.rating?.toFixed(1) || '0.0'} ({item.user?.reviewCount || 0} reviews)
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <Text style={styles.descriptionText}>
                        {item.description}
                    </Text>

                    <View style={styles.trustBanner}>
                        <Ionicons name="shield-checkmark" size={20} color="#1e40af" />
                        <Text style={styles.trustBannerText}>
                            투명한 보상 프로세스. lookingall이 제보자와 주인 사이의 가장 안전한 신뢰교량이 되겠습니다.
                        </Text>
                    </View>

                    {item.userId === currentUserId && reports.filter((r: any) => r.status === 'ACCEPTED').length > 0 && (
                        <View style={styles.reportsSection}>
                            <Text style={styles.sectionTitle}>도착한 제보 ({reports.filter((r: any) => r.status === 'ACCEPTED').length})</Text>
                            {reports.filter((r: any) => r.status === 'ACCEPTED').map((report) => (
                                <View key={report.id} style={styles.reportCard}>
                                    <View style={styles.reportHeader}>
                                        <View style={styles.reporterInfo}>
                                            <View style={styles.miniAvatar}>
                                                <Ionicons name="person" size={14} color="#94a3b8" />
                                            </View>
                                            <Text style={styles.reporterName}>{report.reporter?.name || 'Helper'}</Text>
                                        </View>
                                        <Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={styles.reportText} numberOfLines={2}>{report.description}</Text>
                                    <View style={styles.reportFooter}>
                                        <View style={[
                                            styles.trustBadge,
                                            report.verificationScore > 0.7 ? styles.trustHigh : styles.trustMid
                                        ]}>
                                            <Text style={styles.trustText}>신뢰도 {(report.verificationScore * 100).toFixed(0)}%</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {report.reporterId === currentUserId && (
                                                <TouchableOpacity
                                                    style={[styles.chatButton, { backgroundColor: '#3b82f6' }]}
                                                    onPress={() => navigation.navigate('CreateItemReport', {
                                                        requestId: item.id,
                                                        itemTitle: item.title,
                                                        editingReport: report
                                                    })}
                                                >
                                                    <Text style={styles.chatButtonText}>수정</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={styles.chatButton}
                                                onPress={() => navigation.navigate('Chat', { roomId: null, recipientId: report.reporterId })}
                                            >
                                                <Text style={styles.chatButtonText}>채팅하기</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.bottomActionArea, { zIndex: 999, elevation: 10 }]}>
                {isLoggedIn && item.userId === currentUserId ? (
                    // If current user is the owner
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton, { flex: 1 }]}
                            onPress={() => {
                                console.log('[DEBUG] Edit Request Clicked', {
                                    currentUserId,
                                    itemUserId: item.userId,
                                    category: item.category
                                });
                                Alert.alert('디버그', `수정하기 클릭됨 (카테고리: ${item.category})`);
                                if (item.category === 'FOUND') {
                                    navigation.navigate('CreateReport', { editingRequest: item });
                                } else {
                                    navigation.navigate('CreateRequest', { editingRequest: item });
                                }
                            }}
                        >
                            <Ionicons name="create-outline" size={20} color="white" />
                            <Text style={styles.actionButtonText}>수정하기</Text>
                        </TouchableOpacity>

                        {item.status === 'IN_PROGRESS' ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.completeButton, { flex: 1 }]}
                                onPress={async () => {
                                    Alert.alert(
                                        'Complete Request',
                                        'Did you successfully get your item back?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Yes, Completed',
                                                onPress: async () => {
                                                    try {
                                                        await api.post(`/requests/${item.id}/complete`);
                                                        Alert.alert('Success', 'Request marked as completed!');
                                                        navigation.navigate('Main');
                                                    } catch (error) {
                                                        Alert.alert('Error', 'Failed to complete request');
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <Text style={styles.actionButtonText}>거래 완료</Text>
                            </TouchableOpacity>
                        ) : item.status === 'COMPLETED' && !item.hasReview ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.reviewButton, { flex: 1 }]}
                                onPress={() => navigation.navigate('Review', {
                                    requestId: item.id,
                                    targetUserId: 0,
                                    targetUserName: 'Helper'
                                })}
                            >
                                <Text style={styles.actionButtonText}>후기 작성</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : (
                    // If current user is NOT the owner
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {isFoundItem ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.foundActionButton, { flex: 1 }]}
                                onPress={() => navigation.navigate('Chat', { roomId: null, recipientId: item.userId })}
                            >
                                <Text style={styles.actionButtonText}>주인과 채팅하기</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.reportButton, { flex: 1 }]}
                                    onPress={() => navigation.navigate('CreateItemReport', { requestId: item.id, itemTitle: item.title })}
                                >
                                    <Text style={styles.actionButtonText}>제보하기</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.lostActionButton, { flex: 1 }]}
                                    onPress={() => navigation.navigate('Payment', {
                                        amount: item.rewardAmount,
                                        title: item.title,
                                        type: 'REWARD',
                                        requestId: item.id
                                    })}
                                >
                                    <Text style={styles.actionButtonText}>사례금 지급</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
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
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
    },
    errorSubtitle: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
        lineHeight: 20,
    },
    backHomeButton: {
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 999,
    },
    backHomeButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    floatingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    iconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 8,
        borderRadius: 999,
    },
    scrollView: {
        flex: 1,
    },
    imageCarousel: {
        height: 288, // 72 * 4
        backgroundColor: '#000000',
    },
    carouselImage: {
        width: SCREEN_WIDTH,
        height: 288,
    },
    noImageContainer: {
        height: 288,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noImageText: {
        color: '#6b7280',
        marginTop: 8,
    },
    contentContainer: {
        padding: 24,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerMain: {
        flex: 1,
        marginRight: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    foundBadge: {
        backgroundColor: '#22c55e',
    },
    lostBadge: {
        backgroundColor: '#3b82f6',
    },
    categoryBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    dateText: {
        color: '#6b7280',
        fontSize: 12,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    locationText: {
        color: '#6b7280',
        marginTop: 4,
    },
    rewardBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
    },
    rewardText: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 18,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
    },
    avatarWrapper: {
        width: 48,
        height: 48,
        backgroundColor: '#e5e7eb',
        borderRadius: 24,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userInfo: {
        flex: 1,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontWeight: 'bold',
        color: '#111827',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: '#6b7280',
        fontSize: 14,
        marginLeft: 4,
    },
    descriptionText: {
        color: '#1f2937',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    bottomActionArea: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: '#ffffff',
    },
    actionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    completeButton: {
        backgroundColor: '#16a34a',
    },
    reviewButton: {
        backgroundColor: '#f59e0b',
    },
    foundActionButton: {
        backgroundColor: '#16a34a',
    },
    editButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    reportButton: {
        backgroundColor: '#f59e0b',
    },
    lostActionButton: {
        backgroundColor: '#2563eb',
    },
    disabledActionView: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledActionText: {
        color: '#9ca3af',
        fontWeight: 'bold',
    },
    reportsSection: {
        marginTop: 8,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    reportCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reporterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    reporterName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
    },
    reportDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    reportText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
        marginBottom: 12,
    },
    reportFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trustBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    trustHigh: {
        backgroundColor: '#dcfce7',
    },
    trustMid: {
        backgroundColor: '#fef3c7',
    },
    trustText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#166534',
    },
    chatButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    chatButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    trustBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    trustBannerText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: '#1e40af',
        fontWeight: '500',
        lineHeight: 18,
    },
});
