import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
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
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4 border-b border-gray-100">
                <Text className="text-2xl font-bold">Messages</Text>
            </View>

            <FlatList
                data={chatRooms}
                keyExtractor={(item: any) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }: any) => (
                    <TouchableOpacity
                        className="flex-row items-center p-4 border-b border-gray-50"
                        onPress={() => navigation.navigate('Chat', { roomId: item.id, title: 'Chat Room' })}
                    >
                        <View className="w-14 h-14 bg-gray-200 rounded-full mr-4" />
                        <View className="flex-1">
                            <Text className="font-bold text-lg text-gray-900">
                                {item.users.map((u: any) => u.name).join(', ')}
                            </Text>
                            <Text className="text-gray-500 mt-1" numberOfLines={1}>
                                {item.messages[0]?.content || 'No messages yet'}
                            </Text>
                        </View>
                        <Text className="text-gray-400 text-xs">
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center mt-20">
                        <Text className="text-gray-500">No messages yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
