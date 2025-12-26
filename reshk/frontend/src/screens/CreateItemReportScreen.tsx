import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Modal } from 'react-native';
import api from '../utils/api';
import { usePost } from '../context/PostContext';

export default function CreateItemReportScreen({ route, navigation }: any) {
    const { requestId, itemTitle, editingReport } = route.params;

    const { refreshRequests } = usePost();
    const [description, setDescription] = useState(editingReport?.description || '');
    const [selectedImages, setSelectedImages] = useState<any[]>(editingReport?.images?.map((url: string) => ({ uri: url, fromServer: true })) || []);
    const [loading, setLoading] = useState(false);
    const [showApprovalWaitModal, setShowApprovalWaitModal] = useState(false);
    const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5 - selectedImages.length,
            quality: 0.8,
            exif: true
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets]);
        }
    };

    const uploadImages = async (assets: any[]) => {
        try {
            const formData = new FormData();
            const newAssets = assets.filter(a => !a.fromServer);
            const alreadyUploaded = assets.filter(a => a.fromServer).map(a => ({ url: a.uri, metadata: null }));

            if (newAssets.length === 0) return alreadyUploaded;

            for (let i = 0; i < newAssets.length; i++) {
                const asset = newAssets[i];
                const uri = asset.uri;
                const filename = uri.split('/').pop() || `image_${i}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                if (Platform.OS === 'web') {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    formData.append('images', blob, filename);
                } else {
                    formData.append('images', { uri, name: filename, type } as any);
                }
            }

            const token = await AsyncStorage.getItem('token');
            const baseURL = api.defaults.baseURL || (Platform.OS === 'web' ? 'http://localhost:3002/api' : 'http://10.0.2.2:3002/api');

            const response = await fetch(`${baseURL}/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `이미지 업로드 실패 (${response.status})`);
            }

            const data = await response.json();
            return [...alreadyUploaded, ...data.data];
        } catch (error) {
            console.error('[UPLOAD_ERROR]', error);
            throw error;
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            let imageUrls: string[] = [];
            let metadataList: any[] = [];

            if (selectedImages.length > 0) {
                const uploadedData = await uploadImages(selectedImages);
                imageUrls = uploadedData.map((d: any) => d.url);
                metadataList = uploadedData.map((d: any) => d.metadata).filter((m: any) => m !== null);
            }

            if (editingReport) {
                await api.put(`/reports/${editingReport.id}`, {
                    description,
                    images: imageUrls,
                    metadata: metadataList
                });
                await refreshRequests();
                setShowEditSuccessModal(true);
            } else {
                await api.post('/reports', {
                    requestId,
                    description,
                    images: imageUrls,
                    metadata: metadataList,
                    location: 'Unknown (Detail Page)'
                });
                setShowApprovalWaitModal(true);
            }
        } catch (error: any) {
            console.error('[ERROR] CreateItemReport:', error);
            const detail = error.response?.data?.message || error.message;
            Alert.alert('제보 처리 오류', `에러 내용: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeHeaderButton}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>발견 제보하기</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>"{itemTitle}"</Text>
                    <Text style={styles.heroSubtitle}>분실물을 보셨나요? 상세 정보를 남겨주시면 큰 도움이 됩니다.</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>제보 내용</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="물건을 발견한 장소, 현재 보관 상태 등을 적어주세요."
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>사진 첨부 ({selectedImages.length}/5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                                <Ionicons name="camera" size={32} color="#94a3b8" />
                                <Text style={styles.imagePickerText}>사진 추가</Text>
                            </TouchableOpacity>
                            {selectedImages.map((img, idx) => (
                                <View key={idx} style={styles.imagePreviewWrapper}>
                                    <Ionicons name="image" size={40} color="#cbd5e1" />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#f43f5e" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>{editingReport ? '제보 수정하기' : '제보 제출하기'}</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Approval Wait Modal */}
            <Modal visible={showApprovalWaitModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.statusModalContent}>
                        <View style={styles.statusIconWrapper}>
                            <Ionicons name="shield-checkmark" size={60} color="#f59e0b" />
                        </View>
                        <Text style={styles.statusModalTitle}>제보 검토 및 매칭 중</Text>
                        <Text style={styles.statusModalDesc}>
                            귀한 제보 감사합니다!{"\n\n"}
                            제보하신 사진과 정보를 바탕으로{"\n"}
                            <Text style={styles.highlightText}>AI 유사도 및 위치 정합성 분석</Text>이{"\n"}
                            실시간으로 진행됩니다.{"\n\n"}
                            관리자 최종 확인 후 주인이 확인 시{"\n"}
                            메시지를 드릴 예정입니다.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
                            onPress={() => {
                                setShowApprovalWaitModal(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.modalPrimaryButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Edit Success Modal */}
            <Modal visible={showEditSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.statusModalContent}>
                        <View style={[styles.statusIconWrapper, { backgroundColor: '#f0fdf4' }]}>
                            <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
                        </View>
                        <Text style={styles.statusModalTitle}>제보 수정 완료</Text>
                        <Text style={styles.statusModalDesc}>
                            제보 내용이 성공적으로 수정되었습니다!{"\n"}
                            변경된 내용은 즉시 목록에 반영됩니다.
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalPrimaryButton, { backgroundColor: '#22c55e' }]}
                            onPress={() => {
                                setShowEditSuccessModal(false);
                                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                            }}
                        >
                            <Text style={styles.modalPrimaryButtonText}>확인</Text>
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
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    closeHeaderButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    hero: {
        padding: 24,
        backgroundColor: '#f8fafc',
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    formContainer: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    textArea: {
        height: 120,
    },
    imageScroll: {
        flexDirection: 'row',
    },
    imagePickerButton: {
        width: 100,
        height: 100,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        marginRight: 12,
    },
    imagePickerText: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    imagePreviewWrapper: {
        width: 100,
        height: 100,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
    },
    submitButton: {
        backgroundColor: '#f59e0b',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    statusModalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        alignItems: 'center',
    },
    statusIconWrapper: {
        width: 100,
        height: 100,
        backgroundColor: '#fffbeb',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    statusModalDesc: {
        fontSize: 16,
        lineHeight: 24,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
    },
    highlightText: {
        color: '#f59e0b',
        fontWeight: 'bold',
    },
    modalPrimaryButton: {
        backgroundColor: '#f59e0b',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    modalPrimaryButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
