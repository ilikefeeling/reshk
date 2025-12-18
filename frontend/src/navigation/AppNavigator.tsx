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

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="CreateReport" component={CreateReportScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                <Stack.Screen name="ServiceInfo" component={ServiceInfoScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="Guide" component={GuidePage} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
