import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image as RNImage, Alert, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { initialRequests } from '../context/PostContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RequestDetailScreen({ route, navigation }: any) {
    const { id } = route.params;
    const { user } = useAuth();
    const currentUserId = user?.id;
    const [item, setItem] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/requests/${id}`);
                if (response.data) {
                    setItem(response.data);
                } else {
                    throw new Error('No data');
                }
            } catch (error) {
                console.log(`API Fetch failed for ID ${id}, checking mock data...`);
                // Fallback to mock data ONLY if the ID matches mock patterns
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
                } else {
                    setItem(null);
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchDetail();
            // Fetch reports if request owner
            api.get(`/reports/request/${id}`).then(res => setReports(res.data)).catch(() => { });
        }
    }, [id]);

    const handleVerifyDelivery = async (reportId: number) => {
        // Simplified: In real app, this would open QR Scanner. 
        // For this demo, we'll simulate scanning with the correct token if available.
        Alert.prompt(
            'QR 코드 스캔',
            '습득자가 제시한 QR 코드의 인증 토큰을 입력하세요.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '인증하기',
                    onPress: async (token: any) => {
                        try {
                            setVerifying(true);
                            await api.post('/reports/delivery/verify', { reportId, token });
                            Alert.alert('성공', '물건 인도가 확인되었습니다. 보상금이 지급됩니다.');
                            navigation.navigate('Main');
                        } catch (error: any) {
                            Alert.alert('실패', error.response?.data?.message || '인증에 실패했습니다.');
                        } finally {
                            setVerifying(false);
                        }
                    }
                }
            ]
        );
    };

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

                    {/* V-Matching (Reports Section) */}
                    {item.userId === currentUserId && reports.length > 0 && (
                        <View style={styles.reportsSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles" size={20} color="#2563eb" />
                                <Text style={styles.sectionTitle}>V-Matching 제보 리스트</Text>
                            </View>
                            <Text style={styles.sectionSubtitle}>AI가 분석한 이미지 유사도 기반 신뢰도 점수입니다.</Text>

                            {reports.map((report: any) => (
                                <View key={report.id} style={styles.reportCard}>
                                    <View style={styles.reportTop}>
                                        <RNImage source={{ uri: report.images[0] }} style={styles.reportThumb} />
                                        <View style={styles.reportInfo}>
                                            <View style={styles.aiBadgeRow}>
                                                <View style={[styles.aiScoreBadge, { backgroundColor: report.aiScore > 0.8 ? '#dcfce7' : '#fef9c3' }]}>
                                                    <Text style={[styles.aiScoreText, { color: report.aiScore > 0.8 ? '#16a34a' : '#a16207' }]}>
                                                        신뢰도 {Math.round(report.aiScore * 100)}%
                                                    </Text>
                                                </View>
                                                <Text style={styles.reportTime}>{new Date(report.createdAt).toLocaleTimeString()}</Text>
                                            </View>
                                            <Text style={styles.reportDesc} numberOfLines={2}>{report.description}</Text>
                                        </View>
                                    </View>

                                    {report.status === 'ACCEPTED' && (
                                        <TouchableOpacity
                                            style={styles.verifyButton}
                                            onPress={() => handleVerifyDelivery(report.id)}
                                        >
                                            <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
                                            <Text style={styles.verifyButtonText}>물건 인도 확인 (QR 스캔)</Text>
                                        </TouchableOpacity>
                                    )}
                                    {report.status === 'DELIVERED' && (
                                        <View style={styles.deliveredBadge}>
                                            <Ionicons name="checkmark-done" size={18} color="#16a34a" />
                                            <Text style={styles.deliveredText}>인도 완료 및 정산됨</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomActionArea}>
                {item.userId === currentUserId ? (
                    // If current user is the owner
                    item.status === 'IN_PROGRESS' ? (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.completeButton]}
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
                                                    await api.put(`/requests/${item.id}/complete`);
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
                            <Text style={styles.actionButtonText}>거래 완료하기</Text>
                        </TouchableOpacity>
                    ) : item.status === 'COMPLETED' && !item.hasReview ? (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.reviewButton]}
                            onPress={() => navigation.navigate('Review', {
                                requestId: item.id,
                                targetUserId: 0,
                                targetUserName: 'Helper'
                            })}
                        >
                            <Text style={styles.actionButtonText}>후기 작성하기</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.disabledActionView}>
                            <Text style={styles.disabledActionText}>진행 중인 거래가 없습니다</Text>
                        </View>
                    )
                ) : (
                    // If current user is NOT the owner
                    isFoundItem ? (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.foundActionButton]}
                            onPress={() => navigation.navigate('Chat', { roomId: null, recipientId: item.userId })}
                        >
                            <Text style={styles.actionButtonText}>제보자와 채팅하기</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.lostActionButton]}
                            onPress={() => navigation.navigate('Payment', {
                                amount: item.rewardAmount,
                                title: item.title,
                                type: 'REWARD',
                                requestId: item.id
                            })}
                        >
                            <Text style={styles.actionButtonText}>사례금 지급하기 (₩{Number(item.rewardAmount).toLocaleString()})</Text>
                        </TouchableOpacity>
                    )
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
    // Advanced UI Styles
    reportsSection: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginLeft: 8,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 16,
    },
    reportCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reportTop: {
        flexDirection: 'row',
    },
    reportThumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
    },
    reportInfo: {
        flex: 1,
        marginLeft: 12,
    },
    aiBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    aiScoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    aiScoreText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    reportTime: {
        fontSize: 11,
        color: '#9ca3af',
    },
    reportDesc: {
        fontSize: 13,
        color: '#475569',
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
    },
    verifyButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    deliveredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dcfce7',
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
    },
    deliveredText: {
        color: '#16a34a',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
});
