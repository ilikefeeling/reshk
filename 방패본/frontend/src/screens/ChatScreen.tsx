import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
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
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [reportId, setReportId] = useState<number | null>(null);
    const [requestStatus, setRequestStatus] = useState<string | null>(null);
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

            // Fetch request status if possible
            if (roomId) {
                try {
                    const roomRes = await api.get(`/chats/${roomId}`);
                    if (roomRes.data.request) {
                        setRequestStatus(roomRes.data.request.status);
                    }
                } catch (e) { }
            }
        };

        initChat();

        // Guessing reportId from route params or context if possible
        // For demo, we assume reportId is passed or fetched
        if (route.params.reportId) setReportId(route.params.reportId);

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

    const handleGenerateQR = async () => {
        if (!reportId) {
            Alert.alert('알림', '제보 정보가 없어 QR을 생성할 수 없습니다.');
            return;
        }
        try {
            const response = await api.post('/reports/delivery/qr', { reportId });
            setQrToken(response.data.token);
            setShowQRModal(true);
        } catch (error: any) {
            Alert.alert('오류', error.response?.data?.message || 'QR 생성에 실패했습니다.');
        }
    };

    const shareSafeSpot = (spotName: string) => {
        const messageData = {
            roomId: roomId.toString(),
            senderId: userId,
            content: `📍 [안전 거점 추천] ${spotName}에서 만나면 어떨까요?`,
        };
        socketRef.current.emit('send_message', messageData);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Chat'}</Text>
            </View>

            {/* Escrow Status Banner */}
            {requestStatus === 'PENDING_DEPOSIT' ? (
                <View style={[styles.escrowBanner, styles.escrowPending]}>
                    <Ionicons name="time-outline" size={16} color="#9a3412" />
                    <Text style={styles.escrowText}>사례금이 아직 입금되지 않았습니다. 관리자의 확인을 기다려주세요.</Text>
                </View>
            ) : requestStatus && (
                <View style={[styles.escrowBanner, styles.escrowVerified]}>
                    <Ionicons name="shield-checkmark" size={16} color="#166534" />
                    <Text style={[styles.escrowText, { color: '#166534' }]}>사례금이 플랫폼에 안전하게 보관 중입니다. 안심하고 물건을 전달하세요.</Text>
                </View>
            )}

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
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Alert.alert(
                                '세이프 액션',
                                '원하시는 작업을 선택하세요.',
                                [
                                    { text: '안전 거점 추천 (편의점/파출소)', onPress: () => shareSafeSpot('가까운 CU 편의점') },
                                    { text: '인도 확인용 QR 생성 (습득자용)', onPress: handleGenerateQR },
                                    { text: '취소', style: 'cancel' }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={28} color="#2563eb" />
                    </TouchableOpacity>
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

            {/* QR Code Modal for Finder */}
            <Modal visible={showQRModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <Text style={styles.qrTitle}>인도 확인용 QR 코드</Text>
                        <Text style={styles.qrSubtitle}>의뢰인에게 이 코드를 보여주세요.</Text>
                        <View style={styles.qrPlaceholder}>
                            {qrToken ? (
                                <View style={styles.qrCodeBox}>
                                    <Ionicons name="qr-code" size={160} color="#000" />
                                    <Text style={styles.tokenText}>{qrToken.substring(0, 10)}...</Text>
                                </View>
                            ) : (
                                <ActivityIndicator size="large" color="#2563eb" />
                            )}
                        </View>
                        <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowQRModal(false)}>
                            <Text style={styles.closeModalText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    actionButton: {
        marginRight: 10,
    },
    // QR Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrModalContent: {
        width: '80%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    qrTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    qrSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
        textAlign: 'center',
    },
    qrPlaceholder: {
        width: 200,
        height: 200,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    qrCodeBox: {
        alignItems: 'center',
    },
    tokenText: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 8,
    },
    closeModalButton: {
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 999,
    },
    closeModalText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    // Escrow Banner
    escrowBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff7ed',
        borderBottomWidth: 1,
        borderBottomColor: '#ffedd5',
    },
    escrowPending: {
        backgroundColor: '#fff7ed',
    },
    escrowVerified: {
        backgroundColor: '#f0fdf4',
        borderBottomColor: '#dcfce7',
    },
    escrowText: {
        fontSize: 12,
        color: '#9a3412',
        marginLeft: 8,
        flex: 1,
    },
});
