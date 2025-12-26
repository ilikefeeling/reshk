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

export default function CreateRequestScreen({ route, navigation }: any) {
    const editingRequest = route?.params?.editingRequest;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [locationName, setLocationName] = useState('');
    const [lostDate, setLostDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<any>(null);

    // Image State
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    // Date/Time Selection State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedHour, setSelectedHour] = useState(new Date().getHours());
    const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const { refreshRequests } = usePost();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showApprovalWaitModal, setShowApprovalWaitModal] = useState(false);
    const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);

    useEffect(() => {
        if (editingRequest) {
            setTitle(editingRequest.title);
            // Description might contain prefix, try to strip it or just use it
            let desc = editingRequest.description || '';
            if (desc.includes('[분실물 의뢰]')) {
                // Try to extract original description
                const parts = desc.split('\n\n');
                if (parts.length > 1) desc = parts.slice(1).join('\n\n');
            }
            setDescription(desc);
            setReward(editingRequest.rewardAmount?.toString() || '');
            setLocationName(editingRequest.location || '');
            setSelectedLocation({
                latitude: editingRequest.latitude,
                longitude: editingRequest.longitude
            });
            setSelectedImages(editingRequest.images || []);

            if (editingRequest.createdAt) {
                const date = new Date(editingRequest.createdAt);
                setSelectedYear(date.getFullYear());
                setSelectedMonth(date.getMonth() + 1);
                setSelectedDay(date.getDate());
                setSelectedHour(date.getHours());
                setSelectedMinute(date.getMinutes());
            }
        } else {
            // 신규 등록 시 상태 초기화
            setTitle('');
            setDescription('');
            setReward('');
            setLocationName('');
            setSelectedLocation(null);
            setSelectedImages([]);
        }
    }, [editingRequest]);

    const formatCurrency = (val: string) => {
        const num = val.replace(/[^0-9]/g, '');
        if (!num) return '';
        return Number(num).toLocaleString();
    };

    const handleRewardChange = (val: string) => {
        const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
        if (num > 10000000) {
            Alert.alert('금액 제한', '사례금은 10,000,000원 이하로만 설정 가능합니다.');
            return;
        }
        setReward(num.toString());
    };

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

    const uploadImages = async (imageUris: string[]): Promise<any[]> => {
        try {
            const formData = new FormData();
            // Separating already uploaded images (URLs) from new ones (uris)
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

    const calculateDeposit = (amount: number) => {
        if (amount <= 100000) return amount;
        return Math.floor(amount * 0.1);
    };

    const handleConfirmUpdate = async () => {
        try {
            if (!editingRequest?.id) {
                Alert.alert('오류', '게시물 정보를 찾을 수 없습니다.');
                return;
            }

            setLoading(true);
            let uploadedData: any[] = [];
            if (selectedImages.length > 0) {
                uploadedData = await uploadImages(selectedImages);
            }

            const imageUrls = uploadedData.map(d => d.url);
            const metadataList = uploadedData.map(d => d.metadata).filter(m => m !== null);

            const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
            const rewardValue = Number(reward.replace(/[^0-9]/g, '')) || 0;

            await api.put(`/requests/${editingRequest.id}`, {
                title,
                description: `[분실물 의뢰]\n분실 일시: ${formattedDate}\n\n${description}`,
                rewardAmount: rewardValue,
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
            console.log('[DEBUG] handleSubmit clicked');
            if (!title.trim()) {
                Alert.alert('알림', '제목을 입력해주세요.');
                return;
            }
            if (!description.trim()) {
                Alert.alert('알림', '설명을 입력해주세요.');
                return;
            }
            if (!reward || Number(reward) <= 0) {
                Alert.alert('알림', '사례금을 올바르게 입력해주세요.');
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

            const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
            const rewardValue = Number(reward.replace(/[^0-9]/g, '')) || 0;
            const depositValue = calculateDeposit(rewardValue);

            console.log('[DEBUG] Sending /requests POST with:', {
                title,
                rewardAmount: rewardValue,
                depositAmount: depositValue,
                status: 'PENDING_DEPOSIT'
            });

            await api.post('/requests', {
                category: 'LOST',
                title,
                description: `[분실물 의뢰]\n분실 일시: ${formattedDate}\n\n${description}`,
                rewardAmount: rewardValue,
                depositAmount: depositValue,
                location: locationName,
                latitude: selectedLocation?.latitude,
                longitude: selectedLocation?.longitude,
                images: imageUrls,
                metadata: metadataList,
                status: 'PENDING_DEPOSIT' // 의뢰는 입금 대기 상태
            });

            setShowDepositModal(false);
            setShowApprovalWaitModal(true);
        } catch (error: any) {
            console.error('[DEBUG] Registration Error:', error.response?.data || error.message);
            const errMsg = error.response?.data?.message || error.message || '등록에 실패했습니다.';
            Alert.alert('등록 오류', errMsg);
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
                <Text style={styles.headerTitle}>의뢰하기 (분실물 등록)</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>"소중한 물건을 찾기 위한 첫 걸음,{"\n"}LookingAll이 함께합니다."</Text>
                    <Text style={styles.heroSubtitle}>보상 설정 금액에 따라 최소 예치금만으로 의뢰가 가능합니다.</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.formCard}>

                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>물건 정보 (제목)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="예) 아이폰 15 프로 맥스"
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
                                placeholder="물건의 색상, 케이스 유무, 잃어버린 상황 등을 상세히 적어주세요."
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>분실 장소</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                                    placeholder="분실 장소를 입력하거나 지도에서 선택하세요"
                                    value={locationName}
                                    onChangeText={setLocationName}
                                    placeholderTextColor="#9ca3af"
                                />
                                <TouchableOpacity
                                    style={styles.mapIconButton}
                                    onPress={() => setShowMap(true)}
                                >
                                    <Ionicons name="map" size={24} color="#2563eb" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date & Time Picker UI */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>분실 일시</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { marginRight: 8 }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.pickerText}>{`${selectedYear}.${selectedMonth}.${selectedDay}`}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.pickerText}>{`${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`}</Text>
                                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Reward */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>보상 설정 (사례금)</Text>
                            <View style={styles.rewardInputContainer}>
                                <TextInput
                                    style={styles.rewardInput}
                                    placeholder="금액 입력 (최대 1,000만원)"
                                    keyboardType="numeric"
                                    value={formatCurrency(reward)}
                                    onChangeText={handleRewardChange}
                                    placeholderTextColor="#9ca3af"
                                />
                                <Text style={styles.rewardUnit}>원</Text>
                            </View>
                            <View style={styles.depositInfoBox}>
                                <Text style={styles.depositLabel}>실 입금액(예치금):</Text>
                                <Text style={styles.depositValue}>
                                    {formatCurrency(calculateDeposit(Number(reward)).toString())}원
                                </Text>
                            </View>
                            <Text style={styles.policyText}>
                                * 10만원 이하 100% / 10만원 초과 시 10% 선입금 정책이 적용됩니다.
                            </Text>
                        </View>

                        {/* Images */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>사진 첨부 ({selectedImages.length}/5)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {selectedImages.length < 5 && (
                                    <TouchableOpacity
                                        onPress={pickImages}
                                        style={styles.addImageButton}
                                    >
                                        <Ionicons name="camera" size={24} color="#2563eb" />
                                        <Text style={styles.addImageText}>추가하기</Text>
                                    </TouchableOpacity>
                                )}
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

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? (editingRequest ? '수정 중...' : '의뢰 등록 중...') : (editingRequest ? '의뢰 수정하기' : '의뢰 및 보상금 예치하기')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.footerInfo}>
                        <View style={styles.footerRow}>
                            <Ionicons name="notifications-outline" size={20} color="#4b5563" style={styles.footerIcon} />
                            <Text style={styles.footerText}>제보가 등록되면 의뢰인에게 실시간으로 알림이 전송됩니다.</Text>
                        </View>
                        <View style={styles.footerRow}>
                            <Ionicons name="chatbubbles-outline" size={20} color="#4b5563" style={styles.footerIcon} />
                            <Text style={styles.footerText}>LookingAll 안심 채팅으로 안전하게 대화하세요.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>날짜 선택</Text>
                        <View style={styles.wheelContainer}>
                            <ScrollView style={styles.wheelColumn}>
                                {[2024, 2025, 2026].map(y => (
                                    <TouchableOpacity key={y} onPress={() => setSelectedYear(y)} style={[styles.wheelItem, selectedYear === y && styles.activeWheelItem]}>
                                        <Text style={[styles.wheelText, selectedYear === y && styles.activeWheelText]}>{y}년</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView style={styles.wheelColumn}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <TouchableOpacity key={m} onPress={() => setSelectedMonth(m)} style={[styles.wheelItem, selectedMonth === m && styles.activeWheelItem]}>
                                        <Text style={[styles.wheelText, selectedMonth === m && styles.activeWheelText]}>{m}월</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView style={styles.wheelColumn}>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <TouchableOpacity key={d} onPress={() => setSelectedDay(d)} style={[styles.wheelItem, selectedDay === d && styles.activeWheelItem]}>
                                        <Text style={[styles.wheelText, selectedDay === d && styles.activeWheelText]}>{d}일</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <TouchableOpacity style={styles.modalConfirmButton} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.modalConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={showTimePicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>시간 선택</Text>
                        <View style={styles.wheelContainer}>
                            <ScrollView style={styles.wheelColumn}>
                                {Array.from({ length: 24 }, (_, i) => i).map(h => (
                                    <TouchableOpacity key={h} onPress={() => setSelectedHour(h)} style={[styles.wheelItem, selectedHour === h && styles.activeWheelItem]}>
                                        <Text style={[styles.wheelText, selectedHour === h && styles.activeWheelText]}>{String(h).padStart(2, '0')}시</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView style={styles.wheelColumn}>
                                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                                    <TouchableOpacity key={m} onPress={() => setSelectedMinute(m)} style={[styles.wheelItem, selectedMinute === m && styles.activeWheelItem]}>
                                        <Text style={[styles.wheelText, selectedMinute === m && styles.activeWheelText]}>{String(m).padStart(2, '0')}분</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <TouchableOpacity style={styles.modalConfirmButton} onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.modalConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Deposit Modal */}
            <Modal visible={showDepositModal} transparent animationType="slide">
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
                    <View style={styles.bottomSheetContent}>
                        <View style={styles.bottomSheetHeader}>
                            <Text style={styles.bottomSheetTitle}>보상금 예치 안내</Text>
                            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.depositSummaryBox}>
                            <Text style={styles.depositSummaryTitle}>
                                총 예치 금액: {formatCurrency(calculateDeposit(Number(reward)).toString())}원
                            </Text>
                            <Text style={styles.depositSummarySubtitle}>
                                (설정 보상금: {formatCurrency(reward)}원의 {Number(reward) <= 100000 ? '100%' : '10%'})
                            </Text>
                        </View>

                        <View style={styles.bankInfoContainer}>
                            <View style={styles.bankInfoRow}>
                                <Text style={styles.bankInfoLabel}>입금 은행</Text>
                                <Text style={styles.bankInfoValue}>신한은행</Text>
                            </View>
                            <View style={styles.bankInfoRow}>
                                <Text style={styles.bankInfoLabel}>계좌 번호</Text>
                                <Text style={styles.bankInfoValue}>110-123-456789</Text>
                            </View>
                            <View style={styles.bankInfoRow}>
                                <Text style={styles.bankInfoLabel}>예금주</Text>
                                <Text style={styles.bankInfoValue}>(주)루킹올</Text>
                            </View>
                        </View>

                        <Text style={styles.bankInfoNote}>
                            * 입급 확인 후 관리자 승인 절차를 거쳐 의뢰가 활성화됩니다.{"\n"}
                            * 승인 전에는 목록에 노출되지 않으며, 영업일 기준 1시간 내 처리됩니다.
                        </Text>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleConfirmDeposit}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>{loading ? '처리 중...' : '입금 완료 및 의뢰 등록'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Approval Wait Modal */}
            <Modal visible={showApprovalWaitModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.statusModalContent}>
                        <View style={styles.statusIconWrapper}>
                            <Ionicons name="time" size={60} color="#4f46e5" />
                        </View>
                        <Text style={styles.statusModalTitle}>보상금 입금 확인 중</Text>
                        <Text style={styles.statusModalDesc}>
                            의뢰 등록 접수가 완료되었습니다!{"\n\n"}
                            설정하신 <Text style={styles.highlightText}>사례금 입금이 확인</Text>되면{"\n"}
                            관리자 승인 후 즉시 리스트 최상단에 노출됩니다.{"\n\n"}
                            <Text style={styles.subInfoText}>* 영업시간 기준 보통 1시간 이내 처리</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
                            onPress={() => {
                                setShowApprovalWaitModal(false);
                                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                            }}
                        >
                            <Text style={styles.modalPrimaryText}>확인</Text>
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
                        <Text style={styles.statusModalTitle}>의뢰 수정 완료</Text>
                        <Text style={styles.statusModalDesc}>
                            의뢰 게시글이 성공적으로 수정되었습니다!{"\n"}
                            변경된 내용은 즉시 목록에 반영됩니다.
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalPrimaryButton, { backgroundColor: '#22c55e' }]}
                            onPress={() => {
                                setShowEditSuccessModal(false);
                                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                            }}
                        >
                            <Text style={styles.modalPrimaryText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Location Selection Modal */}
            <Modal visible={showMap} animationType="slide">
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderTitle}>위치 선택</Text>
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
                            setSelectedLocation(e.nativeEvent.coordinate);
                            const { latitude, longitude } = e.nativeEvent.coordinate;
                            if (!locationName) {
                                setLocationName(`위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                            }
                        }}
                    >
                        {selectedLocation && (
                            <Marker coordinate={selectedLocation} />
                        )}
                    </MapView>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.modalConfirmButton}
                            onPress={() => setShowMap(false)}
                        >
                            <Text style={styles.modalConfirmText}>확인</Text>
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
        color: '#1e40af',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    hero: {
        backgroundColor: '#2563eb',
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
        color: '#dbeafe',
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
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerButton: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        color: '#1f2937',
        fontSize: 16,
    },
    rewardInputContainer: {
        position: 'relative',
    },
    rewardInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        paddingRight: 40,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    rewardUnit: {
        position: 'absolute',
        right: 16,
        top: 20,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    depositInfoBox: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    depositLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    depositValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    policyText: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
    },
    imageScroll: {
        flexDirection: 'row',
        marginTop: 4,
    },
    addImageButton: {
        width: 96,
        height: 96,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#93c5fd',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    addImageText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
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
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        elevation: 4,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 10000,
        elevation: 10,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        width: '100%',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#1f2937',
    },
    subInfoText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
    },
    modalPrimaryButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    modalPrimaryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    wheelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    wheelColumn: {
        height: 160,
        width: '30%',
    },
    wheelItem: {
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 4,
    },
    activeWheelItem: {
        backgroundColor: '#eff6ff',
    },
    wheelText: {
        fontSize: 18,
        color: '#9ca3af',
    },
    activeWheelText: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    modalConfirmButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    modalConfirmText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Bottom Sheet
    bottomSheetContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 48,
        width: '100%',
        zIndex: 10001,
        elevation: 11,
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
    depositSummaryBox: {
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
    },
    depositSummaryTitle: {
        color: '#1e40af',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    depositSummarySubtitle: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: 'bold',
    },
    bankInfoContainer: {
        marginBottom: 32,
    },
    bankInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    bankInfoLabel: {
        color: '#6b7280',
        fontSize: 14,
    },
    bankInfoValue: {
        color: '#1f2937',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bankInfoNote: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
    },
    // Status Modal
    statusModalContent: {
        backgroundColor: '#ffffff',
        width: '100%',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
    },
    statusIconWrapper: {
        backgroundColor: '#eff6ff',
        padding: 24,
        borderRadius: 50,
        marginBottom: 24,
    },
    statusModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    statusModalDesc: {
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontSize: 14,
    },
    highlightText: {
        fontWeight: 'bold',
        color: '#2563eb',
    },
    // Map Modal Header
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalFooter: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    }
});
