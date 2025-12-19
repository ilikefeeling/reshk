import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
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
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold">Report User</Text>
                <View className="w-6" />
            </View>

            <ScrollView className="p-6">
                <Text className="text-xl font-bold text-gray-900 mb-2">Reporting {targetUserName}</Text>
                <Text className="text-gray-500 mb-6">Why are you reporting this user?</Text>

                {REASONS.map((reason) => (
                    <TouchableOpacity
                        key={reason.id}
                        onPress={() => setSelectedReason(reason.id)}
                        className={`flex-row items-center p-4 mb-3 rounded-xl border ${selectedReason === reason.id ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                            }`}
                    >
                        <Ionicons
                            name={selectedReason === reason.id ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={selectedReason === reason.id ? "#dc2626" : "#9ca3af"}
                        />
                        <Text className={`ml-3 text-base ${selectedReason === reason.id ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                            {reason.label}
                        </Text>
                    </TouchableOpacity>
                ))}

                <Text className="text-lg font-semibold text-gray-800 mt-6 mb-2">Additional Details</Text>
                <TextInput
                    className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-h-[120] text-gray-800"
                    placeholder="Provide specific details about the incident..."
                    multiline
                    textAlignVertical="top"
                    value={details}
                    onChangeText={setDetails}
                />

                <TouchableOpacity
                    className={`mt-10 py-4 rounded-xl items-center ${submitting ? 'bg-gray-400' : 'bg-red-600'}`}
                    onPress={handleReport}
                    disabled={submitting}
                >
                    <Text className="text-white font-bold text-lg">Submit Report</Text>
                </TouchableOpacity>
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
