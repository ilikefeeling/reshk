import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/NativeMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Requests</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'LIST' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('LIST')}
                    >
                        <Ionicons name="list" size={20} color={viewMode === 'LIST' ? '#111827' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'MAP' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('MAP')}
                    >
                        <Ionicons name="map" size={20} color={viewMode === 'MAP' ? '#111827' : '#9ca3af'} />
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === 'LIST' ? (
                <FlatList
                    data={requests}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                    }
                    renderItem={({ item }: any) => (
                        <TouchableOpacity
                            style={styles.requestCard}
                            onPress={() => navigation.navigate('RequestDetail', { id: item.id })}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-outline" size={14} color="#6b7280" />
                                        <Text style={styles.cardLocation}>{item.location}</Text>
                                    </View>
                                </View>
                                <View style={styles.rewardBadge}>
                                    <Text style={styles.rewardText}>₩{Number(item.rewardAmount).toLocaleString()}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: location?.coords.latitude || 37.5665,
                            longitude: location?.coords.longitude || 126.9780,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                        }}
                        showsUserLocation={true}
                    >
                        {requests.map((item: any) => (
                            <Marker
                                key={item.id}
                                coordinate={{
                                    latitude: 37.5665 + (Math.random() * 0.04 - 0.02),
                                    longitude: 126.9780 + (Math.random() * 0.04 - 0.02),
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
                style={styles.fab}
                onPress={() => navigation.navigate('CreateRequest')}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ffffff',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        padding: 4,
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    requestCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardInfo: {
        flex: 1,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardLocation: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 4,
    },
    rewardBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    rewardText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        width: width,
        height: '100%',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#2563eb',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
});
