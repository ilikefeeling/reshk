import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/NativeMap';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export default function CreateReportScreen({ navigation }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('');
    const [foundDate, setFoundDate] = useState(new Date().toISOString().split('T')[0]); // Simple date for now
    const [keepingMethod, setKeepingMethod] = useState('DIRECT'); // DIRECT or POLICE
    const [loading, setLoading] = useState(false);

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<any>(null);

    // Image State
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

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
    const uploadImages = async (imageUris: string[]): Promise<string[]> => {
        try {
            const formData = new FormData();
            for (let i = 0; i < imageUris.length; i++) {
                const uri = imageUris[i];
                const filename = uri.split('/').pop() || `image_${i}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                if (Platform.OS === 'web') {
                    // Web 환경에서는 URI로부터 Blob을 생성하여 추가
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    formData.append('images', blob, filename);
                } else {
                    // Native 환경
                    formData.append('images', { uri, name: filename, type } as any);
                }
            }
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('인증 토큰을 찾을 수 없습니다.');

            const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api';
            const response = await fetch(`${baseURL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) throw new Error('이미지 업로드 실패');
            const data = await response.json();
            return data.urls;
        } catch (error) {
            console.error('Upload images error:', error);
            throw error;
        }
    };

    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showApprovalWaitModal, setShowApprovalWaitModal] = useState(false);

    const formatCurrency = (val: string) => {
        const num = val.replace(/[^0-9]/g, '');
        if (!num) return '';
        return Number(num).toLocaleString();
    };

    const handleSubmit = async () => {
        if (!title || !description || !locationName) {
            Alert.alert('필수 입력 누락', '제목, 설명, 습득 장소를 모두 입력해주세요.');
            return;
        }
        setShowDepositModal(true);
    };

    const handleConfirmDeposit = async () => {
        try {
            setLoading(true);
            let uploadedImageUrls: string[] = [];
            if (selectedImages.length > 0) {
                uploadedImageUrls = await uploadImages(selectedImages);
            }

            await api.post('/requests', {
                category: 'FOUND', // 습득물
                title,
                description: `[습득물 신고]\n보관 방식: ${keepingMethod === 'DIRECT' ? '본인 보관' : '경찰서/데스크 인계'}\n습득 일시: ${foundDate}\n\n${description}`,
                rewardAmount: 0,
                depositAmount: 0,
                location: locationName,
                latitude: selectedLocation?.latitude,
                longitude: selectedLocation?.longitude,
                images: uploadedImageUrls,
                status: 'OPEN' // Temporarily bypass admin approval
            });

            setShowDepositModal(false);
            Alert.alert('제보 완료', '따뜻한 제보 감사합니다! 즉시 등록되어 리스트에 노출됩니다.', [
                { text: '확인', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('오류', error.message || '등록에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-100 bg-white shadow-sm z-10">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-4 text-green-800">제보하기 (습득물 등록)</Text>
            </View>

            <ScrollView className="flex-1 bg-gray-50">

                {/* Hero / Motivation */}
                <View className="bg-green-600 p-6 pb-8">
                    <Text className="text-white text-xl font-bold mb-2">"당신의 따뜻한 제보가{'\n'}누군가에게는 큰 기적이 됩니다."</Text>
                    <Text className="text-green-100 text-sm">관리자 승인 후 즉시 리스트에 노출되어 주인을 찾게 됩니다.</Text>
                </View>

                <View className="p-4 -mt-6">
                    {/* Form Card */}
                    <View className="bg-white rounded-xl p-5 shadow-md space-y-6">

                        {/* Title */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">습득물 정보 (제목)</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg"
                                placeholder="예) 강남역 1번 출구 에어팟"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Description */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">상세 설명</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-32 text-base"
                                placeholder="물건의 상태(파손 여부), 시리얼 번호 등 주인이 확인할 수 있는 특징을 기록해 주세요."
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        {/* Location */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">습득 장소</Text>
                            <View className="flex-row gap-2">
                                <TextInput
                                    className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                                    placeholder="지도에서 위치 선택"
                                    value={locationName}
                                    editable={false}
                                    onChangeText={setLocationName}
                                />
                                <TouchableOpacity
                                    className="bg-green-500 p-4 rounded-xl justify-center items-center"
                                    onPress={() => setShowMap(true)}
                                >
                                    <Ionicons name="map" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date (Simplified) */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">습득 일시</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                                placeholder="YYYY-MM-DD"
                                value={foundDate}
                                onChangeText={setFoundDate}
                            />
                        </View>

                        {/* Keeping Method */}
                        <View>
                            <Text className="text-gray-600 mb-3 font-bold text-base">보관 방식</Text>
                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    className={`flex-1 p-4 rounded-xl border ${keepingMethod === 'DIRECT' ? 'bg-green-50 border-green-500' : 'border-gray-200'}`}
                                    onPress={() => setKeepingMethod('DIRECT')}
                                >
                                    <Text className={`text-center font-bold ${keepingMethod === 'DIRECT' ? 'text-green-700' : 'text-gray-500'}`}>본인 보관 중</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`flex-1 p-4 rounded-xl border ${keepingMethod === 'POLICE' ? 'bg-green-50 border-green-500' : 'border-gray-200'}`}
                                    onPress={() => setKeepingMethod('POLICE')}
                                >
                                    <Text className={`text-center font-bold ${keepingMethod === 'POLICE' ? 'text-green-700' : 'text-gray-500'}`}>경찰서/데스크 인계</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Image Upload */}
                        <View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600 font-bold text-base">사진 첨부 ({selectedImages.length}/5)</Text>
                                {selectedImages.length < 5 && (
                                    <TouchableOpacity onPress={pickImages} className="flex-row items-center">
                                        <Ionicons name="camera" size={20} color="#22c55e" />
                                        <Text className="text-green-600 font-bold ml-1">추가하기</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {selectedImages.map((uri, index) => (
                                    <View key={index} className="relative mr-2">
                                        <Image source={{ uri }} className="w-24 h-24 rounded-lg bg-gray-100" />
                                        <TouchableOpacity
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white shadow-sm"
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
                            className={`bg-green-600 p-4 rounded-xl items-center shadow-lg mt-4 ${loading ? 'opacity-50' : ''}`}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text className="text-white font-bold text-lg">{loading ? '제보 등록 중...' : '제보 등록 및 승인 요청'}</Text>
                        </TouchableOpacity>

                    </View>

                    {/* Footer Info */}
                    <View className="mt-8 mb-10 space-y-4 px-2">
                        <View className="flex-row items-start">
                            <Ionicons name="notifications-outline" size={20} color="#4b5563" className="mt-1 mr-2" />
                            <Text className="text-gray-500 flex-1 text-sm">제보가 승인되면 의뢰인에게 실시간으로 알림이 전송됩니다.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <Ionicons name="chatbubbles-outline" size={20} color="#4b5563" className="mt-1 mr-2" />
                            <Text className="text-gray-500 flex-1 text-sm">LookingAll 안심 채팅으로 안전하게 대화하세요.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Deposit Modal (Reused for consistency) */}
            <Modal visible={showDepositModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 pb-12">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-800">제보 등록 확인</Text>
                            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-green-50 p-4 rounded-xl mb-6">
                            <Text className="text-green-800 font-bold text-lg mb-2 text-center">제보 감사 예치금: 0원</Text>
                            <Text className="text-green-600 text-sm text-center">습득물 제보는 별도의 예치금이 필요하지 않습니다.</Text>
                        </View>

                        <View className="space-y-4 mb-8">
                            <Text className="text-gray-600 text-center leading-5">
                                허위 제보 방지를 위해 관리자 승인 단계를 거칩니다.{"\n"}
                                승인이 완료되면 즉시 등록됩니다.
                            </Text>
                        </View>

                        <TouchableOpacity
                            className={`bg-green-600 p-4 rounded-xl items-center shadow-lg ${loading ? 'opacity-50' : ''}`}
                            onPress={handleConfirmDeposit}
                            disabled={loading}
                        >
                            <Text className="text-white font-bold text-lg">{loading ? '처리 중...' : '확인 및 제보 등록'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Approval Wait Modal */}
            <Modal visible={showApprovalWaitModal} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/50 p-6">
                    <View className="bg-white w-full rounded-3xl p-8 items-center">
                        <View className="bg-green-100 p-6 rounded-full mb-6">
                            <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
                        </View>
                        <Text className="text-2xl font-bold mb-4 text-gray-800 text-center">제보 등록 접수</Text>
                        <Text className="text-gray-500 text-center leading-6 mb-8">
                            따뜻한 제보 감사합니다!{"\n"}
                            제보 내용은 <Text className="font-bold text-green-600">관리자 검토 후 즉시 노출</Text>됩니다.{"\n\n"}
                            보통 1시간 이내에 처리가 완료됩니다.
                        </Text>
                        <TouchableOpacity
                            className="bg-green-600 w-full p-4 rounded-xl items-center shadow-lg"
                            onPress={() => {
                                setShowApprovalWaitModal(false);
                                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                            }}
                        >
                            <Text className="text-white font-bold text-lg">메인으로 이동</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Map Modal */}
            <Modal visible={showMap} animationType="slide">
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                        <Text className="text-lg font-bold">위치 선택</Text>
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
                    <View className="p-4 bg-white border-t border-gray-100">
                        <TouchableOpacity
                            className="bg-green-600 p-4 rounded-xl items-center"
                            onPress={() => setShowMap(false)}
                        >
                            <Text className="text-white font-bold text-lg">이 위치로 설정</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
