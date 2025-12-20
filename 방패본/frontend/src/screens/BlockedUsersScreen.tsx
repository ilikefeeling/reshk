import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function BlockedUsersScreen({ navigation }: any) {
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlocked = async () => {
        try {
            const res = await api.get('/safety/blocks');
            setBlockedUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocked();
    }, []);

    const handleUnblock = async (userId: number, name: string) => {
        Alert.alert(
            'Unblock User',
            `Do you want to unblock ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    onPress: async () => {
                        try {
                            await api.post('/safety/unblock', { targetUserId: userId });
                            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unblock user');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.userCard}>
            <View style={styles.avatarWrapper}>
                {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
                ) : (
                    <Ionicons name="person" size={24} color="#9ca3af" />
                )}
            </View>
            <Text style={styles.userName}>{item.name}</Text>
            <TouchableOpacity
                onPress={() => handleUnblock(item.id, item.name)}
                style={styles.unblockButton}
            >
                <Text style={styles.unblockButtonText}>Unblock</Text>
            </TouchableOpacity>
        </View>
    );

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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blocked Users</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {blockedUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="shield-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>You haven't blocked anyone yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
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
    headerRightPlaceholder: {
        width: 32,
    },
    listContent: {
        paddingBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
        backgroundColor: '#ffffff',
    },
    avatarWrapper: {
        width: 48,
        height: 48,
        backgroundColor: '#f1f5f9',
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
    userName: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'semibold',
        color: '#1f2937',
    },
    unblockButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    unblockButtonText: {
        color: '#4b5563',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#94a3b8',
        marginTop: 16,
        textAlign: 'center',
        fontSize: 16,
    },
});
