import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Image, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/NativeMap';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { usePost } from '../context/PostContext';

export default function CreateReportScreen({ route, navigation }: any) {
    const editingRequest = route?.params?.editingRequest;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('');
    const [foundDate, setFoundDate] = useState(new Date().toISOString().split('T')[0]);
    const [keepingMethod, setKeepingMethod] = useState('DIRECT');
    const [loading, setLoading] = useState(false);

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<any>(null);

    // Image State
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    useEffect(() => {
        if (editingRequest) {
            setTitle(editingRequest.title);
            let desc = editingRequest.description || '';
            if (desc.includes('[습득물 신고]')) {
                const parts = desc.split('\n\n');
                if (parts.length > 1) {
                    desc = parts.slice(1).join('\n\n');
                    // Try to extract keepingMethod
                    if (parts[0].includes('경찰서/데스크 인계')) setKeepingMethod('POLICE');
                    else setKeepingMethod('DIRECT');

                    // Try to extract date
                    const matches = parts[0].match(/습득 일시: ([\d-]+)/);
                    if (matches) setFoundDate(matches[1]);
                }
            }
            setDescription(desc);
            setLocationName(editingRequest.location || '');
            setSelectedLocation({
                latitude: editingRequest.latitude,
                longitude: editingRequest.longitude
            });
            setSelectedImages(editingRequest.images || []);
        } else {
            // 신규 등록 시 상태 초기화
            setTitle('');
            setDescription('');
            setLocationName('');
            setFoundDate(new Date().toISOString().split('T')[0]);
            setKeepingMethod('DIRECT');
            setSelectedLocation(null);
            setSelectedImages([]);
        }
    }, [editingRequest]);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let loc = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            }
        })();
    }, []);

    // 이미지 선택 함수 (Reuse logic)
    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
        }
        const remainingSlots = 5 - selectedImages.length;
        if (remainingSlots <= 0) {
            Alert.alert('최대 개수 도달', '최대 5장까지 선택할 수 있습니다.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: remainingSlots,
        });
        if (!result.canceled && result.assets) {
            const newImageUris = result.assets.map(asset => asset.uri);
            setSelectedImages([...selectedImages, ...newImageUris]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        setSelectedImages(newImages);
    };

    // 이미지 업로드 함수
    const uploadImages = async (imageUris: string[]): Promise<any[]> => {
        try {
            const formData = new FormData();
            const newImages = imageUris.filter(uri => uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('http://localhost') || uri.startsWith('http://10.0.2.2'));
            const alreadyUploaded = imageUris.filter(uri => !newImages.includes(uri));

            if (newImages.length === 0) return alreadyUploaded.map(url => ({ url, metadata: null }));

            for (let i = 0; i < newImages.length; i++) {
                const uri = newImages[i];
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
            if (!token) throw new Error('인증 토큰을 찾을 수 없습니다.');

            const baseURL = api.defaults.baseURL || 'http://localhost:3002/api';
            const response = await fetch(`${baseURL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) throw new Error('이미지 업로드 실패');
            const data = await response.json();
            return [...alreadyUploaded.map(url => ({ url, metadata: null })), ...data.data];
        } catch (error) {
            console.error('Upload images error:', error);
            throw error;
        }
    };

    const { refreshRequests } = usePost();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showApprovalWaitModal, setShowApprovalWaitModal] = useState(false);
    const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);

    const handleConfirmUpdate = async () => {
        try {
            if (!editingRequest?.id) {
                Alert.alert('오류', '정보를 찾을 수 없습니다.');
                return;
            }

            setLoading(true);
            let uploadedData: any[] = [];
            if (selectedImages.length > 0) {
                uploadedData = await uploadImages(selectedImages);
            }

            const imageUrls = uploadedData.map(d => d.url);
            const metadataList = uploadedData.map(d => d.metadata).filter(m => m !== null);

            await api.put(`/requests/${editingRequest.id}`, {
                title,
                description: `[습득물 신고]\n보관 방식: ${keepingMethod === 'DIRECT' ? '본인 보관' : '경찰서/데스크 인계'}\n습득 일시: ${foundDate}\n\n${description}`,
                rewardAmount: 0,
                depositAmount: 0,
                location: locationName,
                latitude: selectedLocation?.latitude,
                longitude: selectedLocation?.longitude,
                images: imageUrls,
                metadata: metadataList,
            });

            await refreshRequests();
            setShowEditSuccessModal(true);
        } catch (error: any) {
            const detail = error.response?.data?.message || error.message;
            Alert.alert('오류', `수정 중 문제가 발생했습니다: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!title.trim()) {
                Alert.alert('알림', '제목을 입력해주세요.');
                return;
            }
            if (!description.trim()) {
                Alert.alert('알림', '설명을 입력해주세요.');
                return;
            }
            if (!locationName) {
                Alert.alert('알림', '위치를 선택해주세요.');
                return;
            }

            if (editingRequest) {
                await handleConfirmUpdate();
            } else {
                setShowDepositModal(true);
            }
        } catch (error: any) {
            Alert.alert('오류', `처리 중 오류가 발생했습니다.`);
        }
    };

    const handleConfirmDeposit = async () => {
        try {
            setLoading(true);
            let uploadedData: any[] = [];
            if (selectedImages.length > 0) {
                uploadedData = await uploadImages(selectedImages);
            }

            const imageUrls = uploadedData.map(d => d.url);
            const metadataList = uploadedData.map(d => d.metadata).filter(m => m !== null);

            await api.post('/requests', {
                category: 'FOUND', // 습득물
                title,
                description: `[습득물 신고]\n보관 방식: ${keepingMethod === 'DIRECT' ? '본인 보관' : '경찰서/데스크 인계'}\n습득 일시: ${foundDate}\n\n${description}`,
                rewardAmount: 0,
                depositAmount: 0,
                location: locationName,
                latitude: selectedLocation?.latitude,
                longitude: selectedLocation?.longitude,
                images: imageUrls,
                metadata: metadataList,
                status: 'PENDING' // Now goes to admin for review
            });

            setShowDepositModal(false);
            setShowApprovalWaitModal(true);
        } catch (error: any) {
            console.error('[DEBUG] Report Registration Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            const errMsg = error.response?.data?.message || error.message || '등록에 실패했습니다.';
            Alert.alert('등록 오류', errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeHeaderButton}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>제보하기 (습득물 등록)</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>"당신의 사소한 발견이{"\n"}누군가에게는 기적이 됩니다."</Text>
                    <Text style={styles.heroSubtitle}>당신의 선의가 헛되지 않도록, 보상의 마지막 순간까지 lookingall이 책임집니다.</Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Form Card */}
                    <View style={styles.formCard}>

                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>습득물 정보 (제목)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="예) 강남역 1번 출구 에어팟"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>상세 설명</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="물건의 상태(파손 여부), 시리얼 번호 등 주인이 확인할 수 있는 특징을 기록해 주세요."
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>습득 장소</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                                    placeholder="지도에서 위치 선택"
                                    value={locationName}
                                    onChangeText={setLocationName}
                                    editable={true}
                                    placeholderTextColor="#9ca3af"
                                />
                                <TouchableOpacity
                                    style={styles.mapIconButton}
                                    onPress={() => setShowMap(true)}
                                >
                                    <Ionicons name="map" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>습득 일시</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="YYYY-MM-DD"
                                value={foundDate}
                                onChangeText={setFoundDate}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Keeping Method */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>보관 방식</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.methodButton, keepingMethod === 'DIRECT' && styles.activeMethodButton]}
                                    onPress={() => setKeepingMethod('DIRECT')}
                                >
                                    <Text style={[styles.methodText, keepingMethod === 'DIRECT' && styles.activeMethodText]}>본인 보관 중</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.methodButton, keepingMethod === 'POLICE' && styles.activeMethodButton]}
                                    onPress={() => setKeepingMethod('POLICE')}
                                >
                                    <Text style={[styles.methodText, keepingMethod === 'POLICE' && styles.activeMethodText]}>경찰서/데스크 인계</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Image Upload */}
                        <View style={styles.inputGroup}>
                            <View style={styles.imageHeader}>
                                <Text style={styles.inputLabel}>사진 첨부 ({selectedImages.length}/5)</Text>
                                {selectedImages.length < 5 && (
                                    <TouchableOpacity onPress={pickImages} style={styles.imageAddAction}>
                                        <Ionicons name="camera" size={20} color="#16a34a" />
                                        <Text style={styles.imageAddText}>추가하기</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {selectedImages.map((uri, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <Image source={{ uri }} style={styles.imageItem} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close" size={14} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? (editingRequest ? '수정 중...' : '제보 등록 중...') : (editingRequest ? '제보 수정하기' : '제보 등록 및 승인 요청')}
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Footer Info */}
                    <View style={styles.footerInfo}>
                        <View style={styles.footerRow}>
                            <Ionicons name="gift-outline" size={20} color="#16a34a" style={styles.footerIcon} />
                            <Text style={[styles.footerText, { color: '#166534', fontWeight: 'bold' }]}>
                                찾아주신 보람은 마음속에, 합당한 보상은 확실하게.
                            </Text>
                        </View>
                        <View style={styles.footerRow}>
                            <Ionicons name="card-outline" size={20} color="#4b5563" style={styles.footerIcon} />
                            <Text style={styles.footerText}>복잡한 약속이나 조율 없이, 승인 즉시 당신의 계좌로 약속된 보상이 전달됩니다.</Text>
                        </View>
                        <View style={styles.footerRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#4b5563" style={styles.footerIcon} />
                            <Text style={styles.footerText}>투명한 보상 프로세스. lookingall이 제보자와 주인 사이의 가장 안전한 신뢰교량이 되겠습니다.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Deposit Modal */}
            <Modal visible={showDepositModal} transparent animationType="slide">
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
                    <View style={styles.bottomSheetContent}>
                        <View style={styles.bottomSheetHeader}>
                            <Text style={styles.bottomSheetTitle}>제보 등록 확인</Text>
                            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryTitle}>제보 감사 예치금: 0원</Text>
                            <Text style={styles.summarySubtitle}>습득물 제보는 별도의 예치금이 필요하지 않습니다.</Text>
                        </View>

                        <View style={styles.confirmNoteBox}>
                            <Text style={styles.confirmNoteText}>
                                허위 제보 방지를 위해 관리자 승인 단계를 거칩니다.{"\n"}
                                승인이 완료되면 즉시 등록됩니다.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleConfirmDeposit}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>{loading ? '처리 중...' : '확인 및 제보 등록'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Approval Wait Modal */}
            <Modal visible={showApprovalWaitModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.statusModalContent}>
                        <View style={styles.statusIconWrapper}>
                            <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
                        </View>
                        <Text style={styles.statusModalTitle}>제보 접수 완료</Text>
                        <Text style={styles.statusModalDesc}>
                            따뜻한 제보 감사합니다!{"\n\n"}
                            제보 내용은 <Text style={styles.highlightText}>관리자 검토 후 즉시 리스트 최상단</Text>에{"\n"}
                            노출되어 주인을 찾게 됩니다.{"\n\n"}
                            <Text style={styles.subInfoText}>* 보통 1시간 이내 처리가 완료됩니다.</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
                            onPress={() => {
                                setShowApprovalWaitModal(false);
                                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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
                        <View style={styles.statusIconWrapper}>
                            <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
                        </View>
                        <Text style={styles.statusModalTitle}>제보 수정 완료</Text>
                        <Text style={styles.statusModalDesc}>
                            제보 게시글이 성공적으로 수정되었습니다!{"\n"}
                            변경된 내용은 즉시 목록에 반영됩니다.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
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

            {/* Map Modal */}
            <Modal visible={showMap} animationType="slide">
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.mapHeaderTitle}>위치 선택</Text>
                        <TouchableOpacity onPress={() => setShowMap(false)}>
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <MapView
                        style={{ flex: 1 }}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={userLocation || {
                            latitude: 37.5665,
                            longitude: 126.9780,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }}
                        onPress={(e) => {
                            const { latitude, longitude } = e.nativeEvent.coordinate;
                            setSelectedLocation({ latitude, longitude });
                            setLocationName(`선택된 위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                        }}
                    >
                        {selectedLocation && (
                            <Marker coordinate={selectedLocation} />
                        )}
                    </MapView>
                    <View style={styles.mapFooter}>
                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
                            onPress={() => setShowMap(false)}
                        >
                            <Text style={styles.modalPrimaryButtonText}>이 위치로 설정</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
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
        backgroundColor: '#ffffff',
        zIndex: 10,
    },
    closeHeaderButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
        color: '#166534', // green-800
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    hero: {
        backgroundColor: '#16a34a', // green-600
        padding: 24,
        paddingBottom: 32,
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 28,
        marginBottom: 8,
    },
    heroSubtitle: {
        color: '#dcfce7',
        fontSize: 14,
    },
    formContainer: {
        padding: 16,
        marginTop: -24,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4b5563',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        height: 120,
    },
    row: {
        flexDirection: 'row',
    },
    mapIconButton: {
        backgroundColor: '#16a34a',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    activeMethodButton: {
        backgroundColor: '#f0fdf4',
        borderColor: '#22c55e',
    },
    methodText: {
        fontWeight: 'bold',
        color: '#9ca3af',
    },
    activeMethodText: {
        color: '#15803d',
    },
    imageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    imageAddAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageAddText: {
        color: '#16a34a',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    imageScroll: {
        flexDirection: 'row',
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 8,
    },
    imageItem: {
        width: 96,
        height: 96,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ef4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    submitButton: {
        backgroundColor: '#166534', // green-800
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    footerInfo: {
        marginTop: 32,
        paddingHorizontal: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    footerIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    footerText: {
        flex: 1,
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    // Modal & Status styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bottomSheetContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 48,
        width: '100%',
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    summaryBox: {
        backgroundColor: '#f0fdf4',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    summaryTitle: {
        color: '#166534',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 8,
    },
    summarySubtitle: {
        color: '#16a34a',
        fontSize: 14,
        textAlign: 'center',
    },
    confirmNoteBox: {
        marginBottom: 24,
    },
    confirmNoteText: {
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    statusModalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        alignItems: 'center',
    },
    statusIconWrapper: {
        backgroundColor: '#f0fdf4',
        padding: 24,
        borderRadius: 50,
        marginBottom: 24,
    },
    statusModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    statusModalDesc: {
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    subInfoText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
    },
    highlightText: {
        color: '#16a34a',
        fontWeight: 'bold',
    },
    modalPrimaryButton: {
        backgroundColor: '#16a34a',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    modalPrimaryButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    mapHeader: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    mapHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    mapFooter: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
});
