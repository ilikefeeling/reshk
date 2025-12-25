import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function UserDetailScreen({ route, navigation }: any) {
    const { userId } = route.params;
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);

    const fetchUserData = async () => {
        try {
            const [userRes, reviewsRes] = await Promise.all([
                api.get(`/auth/public/${userId}`),
                api.get(`/reviews/user/${userId}`)
            ]);
            setUser(userRes.data);
            setReviews(reviewsRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const handleBlock = async () => {
        Alert.alert(
            'Block User',
            `Are you sure you want to block ${user.name}? You will no longer see their posts or messages.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post('/safety/block', { targetUserId: userId });
                            Alert.alert('Success', 'User has been blocked.');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to block user.');
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Profile</Text>
                <TouchableOpacity onPress={handleBlock} style={styles.iconButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.profileHero}>
                    <View style={styles.avatarWrapper}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={48} color="#9ca3af" />
                        )}
                    </View>
                    <View style={styles.userNameRow}>
                        <Text style={styles.userNameText}>{user?.name}</Text>
                        {user?.identityStatus === 'VERIFIED' && (
                            <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ marginLeft: 6 }} />
                        )}
                    </View>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text style={styles.ratingText}>
                            {user?.rating?.toFixed(1) || '0.0'} ({user?.reviewCount || 0} reviews)
                        </Text>
                    </View>
                </View>

                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?._count?.requests || 0}</Text>
                        <Text style={styles.statLabel}>Requests</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?._count?.reports || 0}</Text>
                        <Text style={styles.statLabel}>Tasks Done</Text>
                    </View>
                </View>

                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviews.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbox-ellipses-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>No reviews yet</Text>
                        </View>
                    ) : (
                        reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Ionicons key={s} name="star" size={12} color={s <= review.rating ? "#f59e0b" : "#d1d5db"} />
                                        ))}
                                    </View>
                                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.reviewContent}>{review.content || 'Great experience!'}</Text>
                                <Text style={styles.reviewAuthor}>by {review.author.name}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.reportSection}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ReportUser', { targetUserId: userId, targetUserName: user.name })}
                        style={styles.reportButton}
                    >
                        <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                        <Text style={styles.reportButtonText}>Report this user</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    iconButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    profileHero: {
        backgroundColor: '#ffffff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    avatarWrapper: {
        width: 96,
        height: 96,
        backgroundColor: '#f1f5f9',
        borderRadius: 48,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userNameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    ratingText: {
        color: '#6b7280',
        marginLeft: 6,
        fontSize: 14,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#e2e8f0',
    },
    reviewsSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    emptyContainer: {
        backgroundColor: '#ffffff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyText: {
        color: '#94a3b8',
        marginTop: 12,
        fontSize: 15,
    },
    reviewCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    starsRow: {
        flexDirection: 'row',
    },
    reviewDate: {
        color: '#94a3b8',
        fontSize: 12,
    },
    reviewContent: {
        color: '#334155',
        fontSize: 15,
        lineHeight: 22,
    },
    reviewAuthor: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 8,
    },
    reportSection: {
        padding: 20,
        paddingBottom: 40,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    reportButtonText: {
        color: '#dc2626',
        fontWeight: '600',
        marginLeft: 8,
    },
});
