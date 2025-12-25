import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import { useIsFocused } from '@react-navigation/native';

export default function ChatListScreen({ navigation }: any) {
    const [chatRooms, setChatRooms] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const isFocused = useIsFocused();

    const fetchChatRooms = async () => {
        try {
            const response = await api.get('/chats');
            setChatRooms(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchChatRooms();
        setRefreshing(false);
    };

    useEffect(() => {
        if (isFocused) {
            fetchChatRooms();
        }
    }, [isFocused]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            <FlatList
                data={chatRooms}
                keyExtractor={(item: any) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
                renderItem={({ item }: any) => (
                    <TouchableOpacity
                        style={styles.chatCard}
                        onPress={() => navigation.navigate('Chat', { roomId: item.id, title: 'Chat Room' })}
                    >
                        <View style={styles.avatarPlaceholder} />
                        <View style={styles.chatInfo}>
                            <Text style={styles.chatName} numberOfLines={1}>
                                {item.users.map((u: any) => u.name).join(', ')}
                            </Text>
                            <Text style={styles.lastMessage} numberOfLines={1}>
                                {item.messages[0]?.content || 'No messages yet'}
                            </Text>
                        </View>
                        <Text style={styles.timeText}>
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No messages yet.</Text>
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#ffffff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContent: {
        flexGrow: 1,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        backgroundColor: '#e5e7eb',
        borderRadius: 28,
        marginRight: 16,
    },
    chatInfo: {
        flex: 1,
    },
    chatName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    lastMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
    },
});
