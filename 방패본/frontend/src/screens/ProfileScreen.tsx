import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

export default function ProfileScreen({ navigation }: any) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchProfile();
        }
    }, [isFocused]);

    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: '#f9fafb' }]}>
            <ScrollView style={styles.scrollView}>
                {/* Header Profile Section */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person" size={48} color="#9ca3af" />
                        )}
                        <TouchableOpacity style={styles.cameraButton}>
                            <Ionicons name="camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.stats?.requests || 0}</Text>
                        <Text style={styles.statLabel}>Requests</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.stats?.reports || 0}</Text>
                        <Text style={styles.statLabel}>Tasks Done</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={16} color="#f59e0b" style={{ marginRight: 4 }} />
                            <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
                        </View>
                        <Text style={styles.statLabel}>({user?.reviewCount || 0} reviews)</Text>
                    </View>
                </View>

                {/* Verification Section */}
                {user?.identityStatus !== 'VERIFIED' && (
                    <View style={styles.verifyBanner}>
                        <View style={styles.verifyHeader}>
                            <Ionicons name="shield-outline" size={24} color="#2563eb" />
                            <Text style={styles.verifyTitle}>Verify Your Identity</Text>
                        </View>
                        <Text style={styles.verifyText}>
                            Verified users get more trust and higher priority in the community.
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Verification')}
                            style={styles.verifyButton}
                        >
                            <Text style={styles.verifyButtonText}>Start Verification</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconWrapper, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="person-outline" size={20} color="#2563eb" />
                        </View>
                        <View style={styles.menuTextWrapper}>
                            <Text style={styles.menuItemText}>Edit Profile</Text>
                            <View style={styles.statusRow}>
                                <Text style={[styles.menuSubText, user?.identityStatus === 'VERIFIED' ? styles.statusVerified : styles.statusUnverified]}>
                                    {user?.identityStatus === 'VERIFIED' ? 'Identity Verified' : 'Unverified Account'}
                                </Text>
                                {user?.identityStatus === 'VERIFIED' && <Ionicons name="checkmark-circle" size={12} color="#16a34a" style={{ marginLeft: 4 }} />}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconWrapper, { backgroundColor: '#f0fdf4' }]}>
                            <Ionicons name="card-outline" size={20} color="#16a34a" />
                        </View>
                        <Text style={styles.menuItemTextFull}>Payment History</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {user?.role === 'ADMIN' && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AdminDashboard')}
                            style={styles.menuItem}
                        >
                            <View style={[styles.menuIconWrapper, { backgroundColor: '#fffbeb' }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#d97706" />
                            </View>
                            <Text style={[styles.menuItemTextFull, { fontWeight: 'bold' }]}>Manager Dashboard</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => navigation.navigate('BlockedUsers')}
                        style={styles.menuItem}
                    >
                        <View style={[styles.menuIconWrapper, { backgroundColor: '#f9fafb' }]}>
                            <Ionicons name="shield-outline" size={20} color="#4b5563" />
                        </View>
                        <Text style={styles.menuItemTextFull}>Blocked Users</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconWrapper, { backgroundColor: '#faf5ff' }]}>
                            <Ionicons name="settings-outline" size={20} color="#9333ea" />
                        </View>
                        <Text style={styles.menuItemTextFull}>Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.menuSection, { marginBottom: 40 }]}>
                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomWidth: 0 }]}
                        onPress={handleLogout}
                    >
                        <View style={[styles.menuIconWrapper, { backgroundColor: '#fef2f2' }]}>
                            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                        </View>
                        <Text style={[styles.menuItemTextFull, { color: '#dc2626' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    profileHeader: {
        backgroundColor: '#ffffff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    avatarContainer: {
        width: 96,
        height: 96,
        backgroundColor: '#f3f4f6',
        borderRadius: 48,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563eb',
        padding: 8,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileEmail: {
        color: '#6b7280',
        marginTop: 4,
    },
    statsSection: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        marginTop: 16,
        paddingVertical: 16,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: '#f3f4f6',
        borderBottomColor: '#f3f4f6',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifyBanner: {
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#dbeafe',
        alignItems: 'center',
    },
    verifyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    verifyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e40af',
        marginLeft: 8,
    },
    verifyText: {
        color: '#3b82f6',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    verifyButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 999,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    verifyButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    menuSection: {
        marginTop: 24,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: '#f3f4f6',
        borderBottomColor: '#f3f4f6',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
    },
    menuIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuTextWrapper: {
        flex: 1,
    },
    menuItemText: {
        fontSize: 18,
        color: '#1f2937',
    },
    menuItemTextFull: {
        flex: 1,
        fontSize: 18,
        color: '#1f2937',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    menuSubText: {
        fontSize: 12,
    },
    statusVerified: {
        color: '#16a34a',
    },
    statusUnverified: {
        color: '#d97706',
    },
});
