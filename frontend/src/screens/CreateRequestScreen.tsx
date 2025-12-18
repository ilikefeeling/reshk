import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/NativeMap';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export default function CreateRequestScreen({ navigation }: any) {
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showApprovalWaitModal, setShowApprovalWaitModal] = useState(false);

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

    const handleSubmit = async () => {
        if (!title || !description || !reward || !locationName) {
            Alert.alert('필수 입력 누락', '모든 필수 정보를 입력해주세요.');
            return;
        }
        setShowDepositModal(true);
    };

    const calculateDeposit = (amount: number) => {
        if (amount <= 100000) return amount;
        return Math.floor(amount * 0.1);
    };

    const handleConfirmDeposit = async () => {
        try {
            setLoading(true);
            let uploadedImageUrls: string[] = [];
            if (selectedImages.length > 0) {
                uploadedImageUrls = await uploadImages(selectedImages);
            }

            const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
            const rewardValue = Number(reward);
            const depositValue = calculateDeposit(rewardValue);

            await api.post('/requests', {
                category: 'LOST',
                title,
                description: `[분실물 의뢰]\n분실 일시: ${formattedDate}\n\n${description}`,
                rewardAmount: rewardValue,
                depositAmount: depositValue,
                location: locationName,
                images: uploadedImageUrls,
                status: 'OPEN' // Temporarily bypass admin approval
            });

            setShowDepositModal(false);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error(error);
            Alert.alert('오류', error.message || '등록에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100 bg-white shadow-sm z-10">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-4 text-blue-800">의뢰하기 (분실물 등록)</Text>
            </View>

            <ScrollView className="flex-1 bg-gray-50">
                {/* Hero */}
                <View className="bg-blue-600 p-6 pb-8">
                    <Text className="text-white text-xl font-bold mb-2">"소중한 물건을 찾기 위한 첫 걸음,{'\n'}LookingAll이 함께합니다."</Text>
                    <Text className="text-blue-100 text-sm">보상 설정 금액에 따라 최소 예치금만으로 의뢰가 가능합니다.</Text>
                </View>

                <View className="p-4 -mt-6">
                    <View className="bg-white rounded-xl p-5 shadow-md space-y-6">

                        {/* Title */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">물건 정보 (제목)</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg"
                                placeholder="예) 아이폰 15 프로 맥스"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Description */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">상세 설명</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-32 text-base"
                                placeholder="물건의 색상, 케이스 유무, 잃어버린 상황 등을 상세히 적어주세요."
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        {/* Location */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">분실 장소</Text>
                            <View className="flex-row gap-2">
                                <TextInput
                                    className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                                    placeholder="분실 장소를 입력하거나 지도에서 선택하세요"
                                    value={locationName}
                                    onChangeText={setLocationName}
                                />
                                <TouchableOpacity
                                    className="bg-blue-100 p-4 rounded-xl justify-center items-center border border-blue-200"
                                    onPress={() => setShowMap(true)}
                                >
                                    <Ionicons name="map" size={24} color="#2563eb" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date & Time Picker UI */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">분실 일시</Text>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 items-center justify-between flex-row"
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text className="text-gray-800">{`${selectedYear}.${selectedMonth}.${selectedDay}`}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 items-center justify-between flex-row"
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text className="text-gray-800">{`${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`}</Text>
                                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Reward */}
                        <View>
                            <Text className="text-gray-600 mb-2 font-bold text-base">보상 설정 (사례금)</Text>
                            <View className="relative">
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg font-bold text-blue-600 pr-10"
                                    placeholder="금액 입력 (최대 1,000만원)"
                                    keyboardType="numeric"
                                    value={formatCurrency(reward)}
                                    onChangeText={handleRewardChange}
                                />
                                <Text className="absolute right-4 top-5 text-gray-500 font-bold">원</Text>
                            </View>
                            <View className="mt-2 flex-row justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <Text className="text-blue-800 text-xs font-bold">실 입금액(예치금):</Text>
                                <Text className="text-blue-600 font-bold text-sm">
                                    {formatCurrency(calculateDeposit(Number(reward)).toString())}원
                                </Text>
                            </View>
                            <Text className="text-[10px] text-gray-400 mt-1">
                                * 10만원 이하 100% / 10만원 초과 시 10% 선입금 정책이 적용됩니다.
                            </Text>
                        </View>

                        {/* Images */}
                        <View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600 font-bold text-base">사진 첨부 ({selectedImages.length}/5)</Text>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {selectedImages.length < 5 && (
                                    <TouchableOpacity
                                        onPress={pickImages}
                                        className="w-24 h-24 bg-gray-50 rounded-lg border border-dashed border-blue-300 items-center justify-center mr-2"
                                    >
                                        <Ionicons name="camera" size={24} color="#2563eb" />
                                        <Text className="text-blue-600 text-xs font-bold mt-1">추가하기</Text>
                                    </TouchableOpacity>
                                )}
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

                        {/* Submit */}
                        <TouchableOpacity
                            className={`bg-blue-600 p-4 rounded-xl items-center shadow-lg mt-4 ${loading ? 'opacity-50' : ''}`}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text className="text-white font-bold text-lg">{loading ? '의뢰 등록 중...' : '의뢰 및 보상금 예치하기'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Info */}
                    <View className="mt-8 mb-10 space-y-4 px-2">
                        <View className="flex-row items-start">
                            <Ionicons name="notifications-outline" size={20} color="#4b5563" className="mt-1 mr-2" />
                            <Text className="text-gray-500 flex-1 text-sm">제보가 등록되면 의뢰인에게 실시간으로 알림이 전송됩니다.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <Ionicons name="chatbubbles-outline" size={20} color="#4b5563" className="mt-1 mr-2" />
                            <Text className="text-gray-500 flex-1 text-sm">LookingAll 안심 채팅으로 안전하게 대화하세요.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/50 p-4">
                    <View className="bg-white w-full rounded-2xl p-6">
                        <Text className="text-xl font-bold mb-6 text-center text-gray-800">날짜 선택</Text>
                        <View className="flex-row justify-around mb-6">
                            <ScrollView className="h-40 w-1/3">
                                {[2024, 2025, 2026].map(y => (
                                    <TouchableOpacity key={y} onPress={() => setSelectedYear(y)} className={`p-3 items-center rounded-lg mb-1 ${selectedYear === y ? 'bg-blue-100' : ''}`}>
                                        <Text className={`text-lg ${selectedYear === y ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{y}년</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView className="h-40 w-1/4">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <TouchableOpacity key={m} onPress={() => setSelectedMonth(m)} className={`p-3 items-center rounded-lg mb-1 ${selectedMonth === m ? 'bg-blue-100' : ''}`}>
                                        <Text className={`text-lg ${selectedMonth === m ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{m}월</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView className="h-40 w-1/4">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <TouchableOpacity key={d} onPress={() => setSelectedDay(d)} className={`p-3 items-center rounded-lg mb-1 ${selectedDay === d ? 'bg-blue-100' : ''}`}>
                                        <Text className={`text-lg ${selectedDay === d ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{d}일</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={() => setShowDatePicker(false)}>
                            <Text className="text-white font-bold text-lg">확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={showTimePicker} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/50 p-4">
                    <View className="bg-white w-full rounded-2xl p-6">
                        <Text className="text-xl font-bold mb-6 text-center text-gray-800">시간 선택</Text>
                        <View className="flex-row justify-around mb-6">
                            <ScrollView className="h-40 w-1/3">
                                {Array.from({ length: 24 }, (_, i) => i).map(h => (
                                    <TouchableOpacity key={h} onPress={() => setSelectedHour(h)} className={`p-3 items-center rounded-lg mb-1 ${selectedHour === h ? 'bg-blue-100' : ''}`}>
                                        <Text className={`text-lg ${selectedHour === h ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{String(h).padStart(2, '0')}시</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView className="h-40 w-1/3">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                                    <TouchableOpacity key={m} onPress={() => setSelectedMinute(m)} className={`p-3 items-center rounded-lg mb-1 ${selectedMinute === m ? 'bg-blue-100' : ''}`}>
                                        <Text className={`text-lg ${selectedMinute === m ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{String(m).padStart(2, '0')}분</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={() => setShowTimePicker(false)}>
                            <Text className="text-white font-bold text-lg">확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Deposit Modal */}
            <Modal visible={showDepositModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 pb-12">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-800">보상금 예치 안내</Text>
                            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-blue-50 p-4 rounded-xl mb-6">
                            <Text className="text-blue-800 font-bold text-lg mb-1 text-center">
                                총 예치 금액: {formatCurrency(calculateDeposit(Number(reward)).toString())}원
                            </Text>
                            <Text className="text-blue-500 text-xs text-center font-bold">
                                (설정 보상금: {formatCurrency(reward)}원의 {Number(reward) <= 100000 ? '100%' : '10%'})
                            </Text>
                        </View>

                        <View className="space-y-4 mb-8">
                            <View className="flex-row justify-between border-b border-gray-100 py-3">
                                <Text className="text-gray-500">입금 은행</Text>
                                <Text className="font-bold text-gray-800">신한은행</Text>
                            </View>
                            <View className="flex-row justify-between border-b border-gray-100 py-3">
                                <Text className="text-gray-500">계좌 번호</Text>
                                <Text className="font-bold text-gray-800">110-123-456789</Text>
                            </View>
                            <View className="flex-row justify-between border-b border-gray-100 py-3">
                                <Text className="text-gray-500">예금주</Text>
                                <Text className="font-bold text-gray-800">(주)루킹올</Text>
                            </View>
                        </View>

                        <Text className="text-xs text-gray-400 mb-6 text-center">
                            * 입급 확인 후 관리자 승인 절차를 거쳐 의뢰가 활성화됩니다.{"\n"}
                            * 승인 전에는 목록에 노출되지 않으며, 영업일 기준 1시간 내 처리됩니다.
                        </Text>

                        <TouchableOpacity
                            className={`bg-blue-600 p-4 rounded-xl items-center shadow-lg ${loading ? 'opacity-50' : ''}`}
                            onPress={handleConfirmDeposit}
                            disabled={loading}
                        >
                            <Text className="text-white font-bold text-lg">{loading ? '처리 중...' : '입금 완료 및 의뢰 등록'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Approval Wait Modal */}
            <Modal visible={showApprovalWaitModal} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/50 p-6">
                    <View className="bg-white w-full rounded-3xl p-8 items-center">
                        <View className="bg-blue-100 p-6 rounded-full mb-6">
                            <Ionicons name="time" size={60} color="#2563eb" />
                        </View>
                        <Text className="text-2xl font-bold mb-4 text-gray-800 text-center">관리자 승인 대기</Text>
                        <Text className="text-gray-500 text-center leading-6 mb-8">
                            의뢰 등록이 완료되었습니다!{"\n"}
                            사례금 입금이 확인되면{"\n"}
                            <Text className="font-bold text-blue-600">관리자 승인 후 즉시 리스트에 노출</Text>됩니다.{"\n\n"}
                            영업시간 기준 보통 1시간 이내에{"\n"}승인 처리가 완료됩니다.
                        </Text>
                        <TouchableOpacity
                            className="bg-blue-600 w-full p-4 rounded-xl items-center shadow-lg"
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
                            setSelectedLocation(e.nativeEvent.coordinate);
                            const { latitude, longitude } = e.nativeEvent.coordinate;
                            // Update location name if empty or as helpful text
                            if (!locationName) {
                                setLocationName(`위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                            }
                        }}
                    >
                        {selectedLocation && (
                            <Marker coordinate={selectedLocation} />
                        )}
                    </MapView>
                    <View className="p-4 bg-white border-t border-gray-100">
                        <TouchableOpacity
                            className="bg-blue-600 p-4 rounded-xl items-center"
                            onPress={() => setShowMap(false)}
                        >
                            <Text className="text-white font-bold text-lg">확인</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-white w-full rounded-3xl p-8 items-center">
                        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                            <Ionicons name="checkmark" size={48} color="#2563eb" />
                        </View>

                        <Text className="text-2xl font-bold text-gray-900 mb-2">등록이 완료되었습니다!</Text>
                        <Text className="text-gray-500 text-center mb-8 leading-6">
                            작성하신 의뢰가 성공적으로 등록되었습니다.{"\n"}
                            이제 홈 화면에서 확인하실 수 있습니다.
                        </Text>

                        <TouchableOpacity
                            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
                            className="w-full bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/30"
                        >
                            <Text className="text-white font-bold text-lg">홈으로 돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
