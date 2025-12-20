import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function GuidePage() {
    const navigation = useNavigation();

    const StepContainer = ({ step, icon, title, children }: any) => (
        <View style={styles.stepContainer}>
            {/* Badge */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>STEP {step}</Text>
            </View>

            {/* Header */}
            <View style={styles.stepHeader}>
                {icon}
                <Text style={styles.stepTitle}>{title}</Text>
            </View>

            {/* Content */}
            <View>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>LookingAll 이용 가이드</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Hero Banner */}
                <View style={styles.heroBanner}>
                    <Text style={styles.heroTitle}>누구나 쉽게 이용하는{'\n'}안심 매칭 프로세스</Text>
                    <Text style={styles.heroSubtitle}>회원가입부터 보상금 정산까지 한눈에 확인하세요.</Text>
                </View>

                <View style={styles.contentPadding}>

                    {/* STEP 1 */}
                    <StepContainer
                        step="01"
                        icon={<Ionicons name="person-add-outline" size={24} color="#2563eb" />}
                        title="회원가입 및 인증"
                    >
                        <View style={styles.bulletList}>
                            <View style={styles.bulletItem}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>카카오 계정으로 3초 만에 간편 가입</Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>사용자 유형 선택 없이 모든 기능 즉시 이용 가능</Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>안전한 거래를 위한 최초 1회 휴대폰 본인 인증</Text>
                            </View>
                        </View>
                    </StepContainer>

                    {/* STEP 2 */}
                    <StepContainer
                        step="02"
                        icon={<Ionicons name="search-outline" size={24} color="#2563eb" />}
                        title="의뢰 등록 또는 제보"
                    >
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxTitle}>잃어버렸을 때 (의뢰)</Text>
                            <Text style={styles.infoBoxText}>물건 정보와 위치 입력 후 보상금 예치</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxTitle}>물건을 찾았을 때 (제보)</Text>
                            <Text style={styles.infoBoxText}>습득 장소와 사진 등록 후 시스템 자동 매칭</Text>
                        </View>
                    </StepContainer>

                    {/* STEP 3 */}
                    <StepContainer
                        step="03"
                        icon={<Ionicons name="chatbubbles-outline" size={24} color="#2563eb" />}
                        title="안심 채팅 및 조율"
                    >
                        <View style={styles.bulletList}>
                            <View style={styles.bulletItem}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>개인 번호 노출 없는 1:1 안심 채팅 연결</Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>물건 세부 특징 확인 및 인도 장소 협의</Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>문제 발생 시 운영팀의 실시간 분쟁 조정 지원</Text>
                            </View>
                        </View>
                    </StepContainer>

                    {/* STEP 4 */}
                    <StepContainer
                        step="04"
                        icon={<Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />}
                        title="수령 승인 및 보상"
                    >
                        <View style={styles.trustBox}>
                            <Text style={styles.trustText}>
                                의뢰인의 <Text style={styles.boldText}>{'\'수령 완료\''}</Text> 승인 즉시 제보자에게 보상금이 자동 정산됩니다.
                            </Text>
                            <View style={styles.trustBadge}>
                                <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
                                <Text style={styles.trustBadgeText}>플랫폼 100% 지급 이행 보증 적용</Text>
                            </View>
                        </View>
                    </StepContainer>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerRow}>
                            <Ionicons name="card-outline" size={14} color="#94a3b8" />
                            <Text style={styles.footerSmallText}>안전결제 에스크로 시스템 가동 중</Text>
                        </View>
                        <Text style={styles.footerLegalText}>LookingAll은 모든 사용자의 안전한 거래를 위해{'\n'}최선을 다하고 있습니다.</Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#ffffff',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 20,
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollView: {
        flex: 1,
    },
    heroBanner: {
        backgroundColor: '#2563eb',
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        color: '#dbeafe',
        fontSize: 14,
        opacity: 0.8,
        textAlign: 'center',
    },
    contentPadding: {
        padding: 20,
        paddingBottom: 40,
    },
    stepContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    badge: {
        position: 'absolute',
        top: -12,
        left: 20,
        backgroundColor: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        zIndex: 10,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    stepTitle: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    bulletList: {
        gap: 8,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bulletDot: {
        color: '#94a3b8',
        marginRight: 8,
    },
    bulletText: {
        color: '#4b5563',
        fontSize: 14,
        flex: 1,
    },
    infoBox: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    infoBoxTitle: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 4,
    },
    infoBoxText: {
        color: '#6b7280',
        fontSize: 12,
    },
    trustBox: {
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#22c55e',
    },
    trustText: {
        color: '#4b5563',
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#374151',
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trustBadgeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    footer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    footerSmallText: {
        color: '#94a3b8',
        fontSize: 12,
        marginLeft: 4,
    },
    footerLegalText: {
        color: '#cbd5e1',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
});
