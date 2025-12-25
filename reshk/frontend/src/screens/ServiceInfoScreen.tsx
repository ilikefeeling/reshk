import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceInfoScreen({ navigation, route }: any) {
    const { initialSection } = route.params || {};
    const scrollViewRef = useRef<ScrollView>(null);
    const section1Ref = useRef<View>(null);
    const section2Ref = useRef<View>(null);
    const section3Ref = useRef<View>(null);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>서비스 소개</Text>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {/* Section 1: 사례금 제도 */}
                <View style={[styles.sectionCard, styles.blueSection]} ref={section1Ref}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionEmoji}>💰</Text>
                        <Text style={[styles.sectionTitle, styles.blueTitle]}>사례금 제도</Text>
                    </View>
                    <Text style={[styles.sectionQuote, styles.blueQuote]}>"따뜻한 마음을 나누는 합리적인 기준"</Text>

                    <View style={styles.sectionBody}>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>📌 제도의 취지</Text>
                            <Text style={styles.itemText}>분실물을 되찾아준 제보자의 선의에 보답하고, 감사의 마음을 공식적으로 전달할 수 있는 체계를 제공합니다.</Text>
                        </View>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>⚖️ 합리적 가이드라인</Text>
                            <Text style={[styles.itemText, { marginBottom: 4 }]}>• 물건의 시장 가치와 실제 중요도(기념품 등)를 고려한 맞춤형 보상 기준을 제시하여 상호 간의 의견 조율을 돕습니다.</Text>
                            <Text style={styles.itemText}>• 불필요한 가격 협상이나 실랑이 없이 플랫폼 내에서 정해진 기준에 따라 깔끔한 보상이 가능합니다.</Text>
                        </View>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>🔍 투명한 보상 프로세스</Text>
                            <Text style={styles.itemText}>모든 사례금 지급 내역은 시스템에 기록되어 의뢰자와 제보자 모두에게 증빙 데이터로 관리됩니다.</Text>
                        </View>
                    </View>
                </View>

                {/* Section 2: 보증금 보장 */}
                <View style={[styles.sectionCard, styles.greenSection]} ref={section2Ref}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionEmoji}>🛡️</Text>
                        <Text style={[styles.sectionTitle, styles.greenTitle]}>보증금 보장</Text>
                    </View>
                    <Text style={[styles.sectionQuote, styles.greenQuote]}>"누구도 피해 보지 않는 안전한 거래 환경"</Text>

                    <View style={styles.sectionBody}>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>🔒 에스크로(Escrow) 안전 결제</Text>
                            <Text style={[styles.itemText, { marginBottom: 4 }]}>• 의뢰인이 게시글 등록 시 사례금을 플랫폼에 미리 예치하는 시스템입니다.</Text>
                            <Text style={styles.itemText}>• 물건을 실제로 인도받고 의뢰인이 '수령 완료'를 승인한 후에만 금액이 제보자에게 정산됩니다.</Text>
                        </View>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>🚫 먹튀 및 사기 방지</Text>
                            <Text style={styles.itemText}>사례금만 받고 물건을 돌려주지 않거나, 물건만 받고 사례금을 주지 않는 행위를 기술적으로 차단합니다.</Text>
                        </View>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>⚖️ 분쟁 조정 시스템</Text>
                            <Text style={styles.itemText}>물건의 상태가 설명과 다르거나 인도 과정에서 마찰이 생길 경우, 전문 운영팀이 중재에 개입하여 공정하게 해결합니다.</Text>
                        </View>
                    </View>
                </View>

                {/* Section 3: 100% 보상금 지급 */}
                <View style={[styles.sectionCard, styles.indigoSection]} ref={section3Ref}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionEmoji}>✅</Text>
                        <Text style={[styles.sectionTitle, styles.indigoTitle]}>100% 보상금 지급</Text>
                    </View>
                    <Text style={[styles.sectionQuote, styles.indigoQuote]}>"정직한 제보자에게 주어지는 당연한 권리"</Text>

                    <View style={styles.sectionBody}>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>🤝 지급 이행 보증</Text>
                            <Text style={styles.itemText}>의뢰인이 물건을 찾았음에도 불구하고 고의로 보상을 회피하는 경우, 플랫폼이 예치된 보증금을 기반으로 제보자에게 100% 보상을 이행합니다.</Text>
                        </View>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>🌟 선의의 보호</Text>
                            <Text style={styles.itemText}>정직하게 유실물을 습득하여 주인에게 돌려준 선량한 시민이 정당한 대우를 받을 수 있는 문화를 만듭니다.</Text>
                        </View>
                        <View style={styles.itemContainer}>
                            <Text style={styles.itemTitle}>✨ 클린 제보 시스템</Text>
                            <Text style={[styles.itemText, { marginBottom: 4 }]}>• 철저한 본인 인증과 허위 제보 신고 시스템을 통해 진정성 있는 제보를 필터링합니다.</Text>
                            <Text style={styles.itemText}>• 신뢰도가 검증된 제보자에게 보상금이 우선적으로 전달될 수 있도록 관리합니다.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        LookingAll은 이 세 가지 제도를 통해{"\n"}
                        분실물 시장의 고질적인 불신을 해소하고,{"\n"}
                        "당신의 소중한 것"을 가장 확실하게 되찾아드리는{"\n"}
                        길을 열어갑니다.
                    </Text>
                </View>

            </ScrollView>
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
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    sectionCard: {
        marginBottom: 24,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    blueSection: {
        backgroundColor: '#eff6ff',
        borderColor: '#dbeafe',
    },
    greenSection: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    indigoSection: {
        backgroundColor: '#eef2ff',
        borderColor: '#e0e7ff',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    blueTitle: {
        color: '#1e40af',
    },
    greenTitle: {
        color: '#166534',
    },
    indigoTitle: {
        color: '#3730a3',
    },
    sectionQuote: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
    },
    blueQuote: {
        color: '#1d4ed8',
    },
    greenQuote: {
        color: '#15803d',
    },
    indigoQuote: {
        color: '#4338ca',
    },
    sectionBody: {
        // space-y-4 equivalent
    },
    itemContainer: {
        marginBottom: 16,
    },
    itemTitle: {
        fontWeight: 'bold',
        color: '#1f2937',
        fontSize: 15,
        marginBottom: 4,
    },
    itemText: {
        color: '#4b5563',
        fontSize: 14,
        lineHeight: 20,
    },
    footerContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    footerText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
        lineHeight: 22,
    },
});
