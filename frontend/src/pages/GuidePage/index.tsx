import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function GuidePage() {
    const navigation = useNavigation();

    const StepContainer = ({ step, icon, title, children }: any) => (
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm relative border border-gray-100">
            {/* Badge */}
            <View className="absolute -top-3 left-5 bg-blue-600 px-3 py-1 rounded-full z-10">
                <Text className="text-white text-xs font-bold">STEP {step}</Text>
            </View>

            {/* Header */}
            <View className="flex-row items-center mb-4 mt-2">
                {icon}
                <Text className="ml-2 text-base font-bold text-gray-900">{title}</Text>
            </View>

            {/* Content */}
            <View>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 flex-row items-center border-b border-gray-100 shadow-sm z-20">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold">LookingAll 이용 가이드</Text>
            </View>

            <ScrollView className="flex-1">
                {/* Hero Banner */}
                <View className="bg-blue-600 p-8 items-center justify-center">
                    <Text className="text-white text-xl font-bold mb-2 text-center">누구나 쉽게 이용하는{'\n'}안심 매칭 프로세스</Text>
                    <Text className="text-blue-100 text-sm opacity-80">회원가입부터 보상금 정산까지 한눈에 확인하세요.</Text>
                </View>

                <View className="p-5 pb-10">

                    {/* STEP 1 */}
                    <StepContainer
                        step="01"
                        icon={<Ionicons name="person-add-outline" size={24} color="#2563eb" />}
                        title="회원가입 및 인증"
                    >
                        <View className="space-y-2">
                            <View className="flex-row items-start">
                                <Text className="text-gray-400 mr-2">•</Text>
                                <Text className="text-gray-500 text-sm flex-1">카카오 계정으로 3초 만에 간편 가입</Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-gray-400 mr-2">•</Text>
                                <Text className="text-gray-500 text-sm flex-1">사용자 유형 선택 없이 모든 기능 즉시 이용 가능</Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-gray-400 mr-2">•</Text>
                                <Text className="text-gray-500 text-sm flex-1">안전한 거래를 위한 최초 1회 휴대폰 본인 인증</Text>
                            </View>
                        </View>
                    </StepContainer>

                    {/* STEP 2 */}
                    <StepContainer
                        step="02"
                        icon={<Ionicons name="search-outline" size={24} color="#2563eb" />}
                        title="의뢰 등록 또는 제보"
                    >
                        <View className="bg-gray-100 p-3 rounded-lg mb-2">
                            <Text className="text-gray-900 font-bold text-xs mb-1">잃어버렸을 때 (의뢰)</Text>
                            <Text className="text-gray-500 text-xs">물건 정보와 위치 입력 후 보상금 예치</Text>
                        </View>
                        <View className="bg-gray-100 p-3 rounded-lg">
                            <Text className="text-gray-900 font-bold text-xs mb-1">물건을 찾았을 때 (제보)</Text>
                            <Text className="text-gray-500 text-xs">습득 장소와 사진 등록 후 시스템 자동 매칭</Text>
                        </View>
                    </StepContainer>

                    {/* STEP 3 */}
                    <StepContainer
                        step="03"
                        icon={<Ionicons name="chatbubbles-outline" size={24} color="#2563eb" />}
                        title="안심 채팅 및 조율"
                    >
                        <View className="space-y-2">
                            <View className="flex-row items-start">
                                <Text className="text-gray-400 mr-2">•</Text>
                                <Text className="text-gray-500 text-sm flex-1">개인 번호 노출 없는 1:1 안심 채팅 연결</Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-gray-400 mr-2">•</Text>
                                <Text className="text-gray-500 text-sm flex-1">물건 세부 특징 확인 및 인도 장소 협의</Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-gray-400 mr-2">•</Text>
                                <Text className="text-gray-500 text-sm flex-1">문제 발생 시 운영팀의 실시간 분쟁 조정 지원</Text>
                            </View>
                        </View>
                    </StepContainer>

                    {/* STEP 4 */}
                    <StepContainer
                        step="04"
                        icon={<Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />}
                        title="수령 승인 및 보상"
                    >
                        <View className="pl-3 border-l-2 border-green-500">
                            <Text className="text-gray-500 text-sm mb-2 leading-5">
                                의뢰인의 <Text className="font-bold text-gray-700">{'\'수령 완료\''}</Text> 승인 즉시 제보자에게 보상금이 자동 정산됩니다.
                            </Text>
                            <View className="flex-row items-center">
                                <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
                                <Text className="text-green-600 text-xs font-bold ml-1">플랫폼 100% 지급 이행 보증 적용</Text>
                            </View>
                        </View>
                    </StepContainer>

                    {/* Footer */}
                    <View className="items-center mt-4 mb-8">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="card-outline" size={14} color="#94a3b8" />
                            <Text className="text-gray-400 text-xs ml-1">안전결제 에스크로 시스템 가동 중</Text>
                        </View>
                        <Text className="text-gray-300 text-xs text-center leading-4">LookingAll은 모든 사용자의 안전한 거래를 위해{'\n'}최선을 다하고 있습니다.</Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
