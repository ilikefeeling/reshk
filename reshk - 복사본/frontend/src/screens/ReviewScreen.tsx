import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function ReviewScreen({ route, navigation }: any) {
    const { requestId, targetUserId, targetUserName } = route.params;
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await api.post('/reviews', {
                requestId,
                targetUserId,
                rating,
                content
            });
            Alert.alert('Success', 'Your review has been submitted.');
            navigation.goBack();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Leave a Review</Text>
                <Text style={styles.subtitle}>How was your experience with {targetUserName}?</Text>

                <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={48}
                                color={star <= rating ? "#f59e0b" : "#d1d5db"}
                                style={styles.starIcon}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Detailed Feedback</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Tell us what went well or could be improved..."
                    multiline
                    textAlignVertical="top"
                    value={content}
                    onChangeText={setContent}
                    placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 32,
    },
    starRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    starIcon: {
        marginHorizontal: 4,
    },
    label: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: '#1f2937',
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 16,
        minHeight: 180,
        fontSize: 16,
        color: '#111827',
    },
    submitButton: {
        marginTop: 32,
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563eb',
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
