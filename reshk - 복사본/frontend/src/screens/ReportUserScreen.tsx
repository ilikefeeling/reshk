import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const REASONS = [
    { id: 'SPAM', label: 'Spam or advertising' },
    { id: 'FRAUD', label: 'Suspicious activity or fraud' },
    { id: 'ABUSE', label: 'Harassment or abuse' },
    { id: 'INAPPROPRIATE', label: 'Inappropriate content/behavior' },
    { id: 'OTHER', label: 'Other reasons' },
];

export default function ReportUserScreen({ route, navigation }: any) {
    const { targetUserId, targetUserName } = route.params;
    const [selectedReason, setSelectedReason] = useState('SPAM');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleReport = async () => {
        if (!details.trim()) {
            Alert.alert('Details Required', 'Please provide more information about the report.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/safety/report', {
                targetUserId,
                reason: selectedReason,
                details
            });
            Alert.alert(
                'Report Submitted',
                'Thank you for reporting. Our safety team will review this incident.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report User</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Reporting {targetUserName}</Text>
                <Text style={styles.subtitle}>Why are you reporting this user?</Text>

                {REASONS.map((reason) => {
                    const isSelected = selectedReason === reason.id;
                    return (
                        <TouchableOpacity
                            key={reason.id}
                            onPress={() => setSelectedReason(reason.id)}
                            style={[
                                styles.reasonCard,
                                isSelected ? styles.reasonCardSelected : styles.reasonCardUnselected
                            ]}
                        >
                            <Ionicons
                                name={isSelected ? "radio-button-on" : "radio-button-off"}
                                size={20}
                                color={isSelected ? "#dc2626" : "#9ca3af"}
                            />
                            <Text style={[
                                styles.reasonLabel,
                                isSelected ? styles.reasonLabelSelected : styles.reasonLabelUnselected
                            ]}>
                                {reason.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                <Text style={styles.label}>Additional Details</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Provide specific details about the incident..."
                    multiline
                    textAlignVertical="top"
                    value={details}
                    onChangeText={setDetails}
                    placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleReport}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
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
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerRightPlaceholder: {
        width: 32,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
    },
    reasonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    reasonCardSelected: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    reasonCardUnselected: {
        backgroundColor: '#f9fafb',
        borderColor: '#f1f5f9',
    },
    reasonLabel: {
        marginLeft: 12,
        fontSize: 16,
    },
    reasonLabelSelected: {
        color: '#991b1b',
        fontWeight: '600',
    },
    reasonLabelUnselected: {
        color: '#374151',
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 24,
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 16,
        padding: 16,
        minHeight: 140,
        fontSize: 16,
        color: '#111827',
    },
    submitButton: {
        marginTop: 40,
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
