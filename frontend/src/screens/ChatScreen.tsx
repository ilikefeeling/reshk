import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

// Replace with your backend URL
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002';

export default function ChatScreen({ route, navigation }: any) {
    const { roomId, title } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const initChat = async () => {
            // Get User ID
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserId(user.id);
            }

            // Load previous messages
            try {
                const response = await api.get(`/chats/${roomId}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error(error);
            }

            // Connect Socket
            socketRef.current = io(SOCKET_URL);
            socketRef.current.emit('join_room', roomId.toString());

            socketRef.current.on('receive_message', (message: any) => {
                setMessages((prev) => [...prev, message]);
            });
        };

        initChat();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    const sendMessage = () => {
        if (inputText.trim() && socketRef.current && userId) {
            const messageData = {
                roomId: roomId.toString(),
                senderId: userId,
                content: inputText,
            };

            socketRef.current.emit('send_message', messageData);
            setInputText('');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Chat'}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isMyMessage = item.senderId === userId;
                    return (
                        <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
                            {!isMyMessage && (
                                <View style={styles.avatarPlaceholder} />
                            )}
                            <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
                                <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
                                    {item.content}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={sendMessage}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
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
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
        color: '#111827',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageWrapper: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        backgroundColor: '#e5e7eb',
        borderRadius: 16,
        marginRight: 8,
    },
    bubble: {
        padding: 12,
        borderRadius: 20,
        maxWidth: '75%',
    },
    myBubble: {
        backgroundColor: '#2563eb', // blue-600
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#f3f4f6', // gray-100
        borderBottomLeftRadius: 4,
    },
    myMessageText: {
        color: '#ffffff',
        fontSize: 15,
    },
    otherMessageText: {
        color: '#1f2937',
        fontSize: 15,
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: '#ffffff',
        paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        marginRight: 10,
        fontSize: 16,
        color: '#111827',
    },
    sendButton: {
        backgroundColor: '#2563eb',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
