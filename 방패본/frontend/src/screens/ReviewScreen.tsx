import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
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
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="p-6">
                <Text className="text-2xl font-bold text-gray-900 mb-2">Leave a Review</Text>
                <Text className="text-gray-500 mb-8">How was your experience with {targetUserName}?</Text>

                <View className="flex-row justify-center mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={48}
                                color={star <= rating ? "#f59e0b" : "#d1d5db"}
                                style={{ marginHorizontal: 4 }}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-lg font-semibold text-gray-800 mb-2">Detailed Feedback</Text>
                <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[150] text-gray-800"
                    placeholder="Tell us what went well or could be improved..."
                    multiline
                    textAlignVertical="top"
                    value={content}
                    onChangeText={setContent}
                />

                <TouchableOpacity
                    className={`mt-8 py-4 rounded-xl items-center ${submitting ? 'bg-gray-400' : 'bg-blue-600'}`}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <Text className="text-white font-bold text-lg">Submit Review</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
