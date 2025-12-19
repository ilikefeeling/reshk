import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

// Replace with your backend URL
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

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
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-4">{title || 'Chat'}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => {
                    const isMyMessage = item.senderId === userId;
                    return (
                        <View className={`mb-4 flex-row ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            {!isMyMessage && (
                                <View className="w-8 h-8 bg-gray-300 rounded-full mr-2" />
                            )}
                            <View className={`p-3 rounded-2xl max-w-[70%] ${isMyMessage ? 'bg-blue-600' : 'bg-gray-100'}`}>
                                <Text className={isMyMessage ? 'text-white' : 'text-gray-800'}>
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
                <View className="flex-row items-center p-4 border-t border-gray-100 bg-white">
                    <TextInput
                        className="flex-1 bg-gray-100 p-3 rounded-full mr-2"
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <TouchableOpacity
                        className="bg-blue-600 p-3 rounded-full"
                        onPress={sendMessage}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
