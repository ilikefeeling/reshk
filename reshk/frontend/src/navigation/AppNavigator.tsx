import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabNavigator from './MainTabNavigator';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ChatScreen from '../screens/ChatScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import ServiceInfoScreen from '../screens/ServiceInfoScreen';

import CreateReportScreen from '../screens/CreateReportScreen';
import GuidePage from '../pages/GuidePage';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import VerificationScreen from '../screens/VerificationScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ReportUserScreen from '../screens/ReportUserScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';

import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { isLoggedIn } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
            >
                {/* 1. Common Public Screens - Always at the top for stability */}
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
                <Stack.Screen name="ServiceInfo" component={ServiceInfoScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="Guide" component={GuidePage} />

                {isLoggedIn ? (
                    // 2. Authenticated Only Screens
                    <Stack.Group>
                        <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="CreateReport" component={CreateReportScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Payment" component={PaymentScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="Verification" component={VerificationScreen} />
                        <Stack.Screen name="Review" component={ReviewScreen} />
                        <Stack.Screen name="ReportUser" component={ReportUserScreen} />
                        <Stack.Screen name="UserDetail" component={UserDetailScreen} />
                        <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
                    </Stack.Group>
                ) : (
                    // 3. Unauthenticated Only Screens
                    <Stack.Group>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
