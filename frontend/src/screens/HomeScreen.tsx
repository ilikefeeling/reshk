import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/NativeMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useIsFocused } from '@react-navigation/native';

export default function HomeScreen({ navigation }: any) {
    const [requests, setRequests] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const isFocused = useIsFocused();

    const fetchRequests = async () => {
        try {
            const response = await api.get('/requests');
            setRequests(response.data);
        } catch (error: any) {
            console.error('HomeScreen Fetch Error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchRequests();
        }
    }, [isFocused]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white shadow-sm flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-gray-800">Requests</Text>
                <View className="flex-row bg-gray-100 rounded-lg p-1">
                    <TouchableOpacity
                        className={`px-3 py-1 rounded-md ${viewMode === 'LIST' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setViewMode('LIST')}
                    >
                        <Ionicons name="list" size={20} color={viewMode === 'LIST' ? 'black' : 'gray'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-3 py-1 rounded-md ${viewMode === 'MAP' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setViewMode('MAP')}
                    >
                        <Ionicons name="map" size={20} color={viewMode === 'MAP' ? 'black' : 'gray'} />
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === 'LIST' ? (
                <FlatList
                    data={requests}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }: any) => (
                        <TouchableOpacity
                            className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100"
                            onPress={() => navigation.navigate('RequestDetail', { id: item.id })}
                        >
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
                                    <Text className="text-gray-500 mt-1">{item.location}</Text>
                                </View>
                                <View className="bg-blue-100 px-3 py-1 rounded-full">
                                    <Text className="text-blue-600 font-bold">₩{item.rewardAmount}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <View className="flex-1">
                    <MapView
                        style={{ width: Dimensions.get('window').width, height: '100%' }}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: location?.coords.latitude || 37.5665,
                            longitude: location?.coords.longitude || 126.9780,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }}
                        showsUserLocation={true}
                    >
                        {requests.map((item: any) => (
                            // Note: In a real app, you'd need lat/lng in the request data. 
                            // For now, we'll just put a dummy marker or skip if no coords.
                            // Assuming item.latitude and item.longitude exist or we parse item.location
                            <Marker
                                key={item.id}
                                coordinate={{
                                    latitude: 37.5665 + (Math.random() * 0.01 - 0.005), // Dummy random location around Seoul
                                    longitude: 126.9780 + (Math.random() * 0.01 - 0.005),
                                }}
                                title={item.title}
                                description={`Reward: ₩${item.rewardAmount}`}
                                onCalloutPress={() => navigation.navigate('RequestDetail', { id: item.id })}
                            />
                        ))}
                    </MapView>
                </View>
            )}

            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
                onPress={() => navigation.navigate('CreateRequest')}
            >
                <Text className="text-white text-3xl font-bold">+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
