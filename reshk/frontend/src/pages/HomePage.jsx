import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const iconMap = {
    아이폰: '📱',
    말티즈: '🐕',
    가구: '🛋️',
};

export default function HomePage() {
    const { requests, setRequests } = usePost();
    const navigation = useNavigation();
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = React.useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/requests');
            const mappedData = response.data.map(req => ({
                ...req,
                reward: `₩${Number(req.rewardAmount).toLocaleString()}`,
                date: new Date(req.createdAt).toLocaleDateString(),
                keyword: req.category === 'LOST' || req.category === 'FOUND' ? (req.title.includes('아이폰') ? '아이폰' : (req.title.includes('강아지') || req.title.includes('개') ? '말티즈' : '가구')) : '가구'
            }));
            if (setRequests) setRequests(mappedData);
        } catch (error) {
            console.error('[DEBUG] HomePage: Fetch Error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRequests();
    }, []);

    const { useFocusEffect } = require('@react-navigation/native');
    useFocusEffect(
        React.useCallback(() => {
            fetchRequests();
        }, [])
    );

    const handleProtectedAction = async (screen) => {
        // If already recognized as logged in, proceed
        if (isLoggedIn) {
            navigation.navigate(screen);
            return;
        }

        // Check AsyncStorage directly to handle race condition where isLoggedIn state hasn't updated yet
        const token = await AsyncStorage.getItem('token');
        if (token && token !== 'null' && token !== 'undefined') {
            navigation.navigate(screen);
        } else {
            console.log(`[AUTH] Unauthorized access attempt to ${screen}. Redirecting to Login.`);
            navigation.navigate('Login', { redirect: screen });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Banner */}
                    <View style={styles.banner}>
                        <TouchableOpacity
                            style={styles.infoIcon}
                            onPress={() => navigation.navigate('Guide')}
                        >
                            <Ionicons name="information-circle-outline" size={20} color="#1e40af" />
                        </TouchableOpacity>

                        <Text style={styles.bannerTitle}>
                            우리 서비스에 오신 것을 환영합니다
                        </Text>

                        <View style={styles.bannerButtons}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#3b82f6' }]}
                                onPress={() => handleProtectedAction('CreateRequest')}
                            >
                                <Text style={styles.buttonText}>의뢰하기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#22c55e' }]}
                                onPress={() => handleProtectedAction('CreateReport')}
                            >
                                <Text style={styles.buttonText}>제보하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Service Info */}
                    <View style={styles.serviceInfoRow}>
                        <TouchableOpacity
                            style={styles.serviceCard}
                            onPress={() => navigation.navigate('ServiceInfo', { initialSection: 1 })}
                        >
                            <Text style={styles.cardEmoji}>💰</Text>
                            <Text style={styles.cardText}>사례금</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.serviceCard}
                            onPress={() => navigation.navigate('ServiceInfo', { initialSection: 2 })}
                        >
                            <Text style={styles.cardEmoji}>🛡️</Text>
                            <Text style={styles.cardText}>보증금</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.serviceCard}
                            onPress={() => navigation.navigate('ServiceInfo', { initialSection: 3 })}
                        >
                            <Text style={styles.cardEmoji}>✅</Text>
                            <Text style={styles.cardText}>100% 지급</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Request List Header */}
                    <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>최근 의뢰</Text>
                        <TouchableOpacity onPress={() => console.log('Load more')}>
                            <Text style={styles.moreText}>더보기 &gt;</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Request List */}
                    <View style={styles.listContainer}>
                        {requests.map((req) => (
                            <TouchableOpacity
                                key={req.id}
                                style={styles.requestItem}
                                onPress={() => navigation.navigate('RequestDetail', { id: req.id })}
                            >
                                <View style={styles.itemIconContainer}>
                                    <Text style={styles.itemEmoji}>{iconMap[req.keyword] || '❓'}</Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle}>{req.title}</Text>
                                    <Text style={styles.itemDate}>
                                        {req.date} • 조회 0
                                    </Text>
                                </View>
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>
                                        {req.rewardAmount ? `₩${Number(req.rewardAmount).toLocaleString()}` : (req.reward || '₩0')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    banner: {
        backgroundColor: '#dbeafe',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        alignItems: 'center',
        position: 'relative',
    },
    infoIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 20,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1f2937',
        marginTop: 8,
    },
    bannerButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    button: {
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    serviceInfoRow: {
        flexDirection: 'row',
        justifyContent: 'between',
        marginBottom: 16,
        marginHorizontal: 16,
    },
    serviceCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    cardText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 24,
    },
    listHeaderText: {
        fontWeight: '600',
        fontSize: 18,
        color: '#1f2937',
    },
    moreText: {
        color: '#3b82f6',
        fontSize: 14,
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    itemIconContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 24,
        marginRight: 12,
    },
    itemEmoji: {
        fontSize: 24,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontWeight: 'bold',
        color: '#1f2937',
        fontSize: 16,
        marginBottom: 4,
    },
    itemDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    priceTag: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563eb',
    },
});
