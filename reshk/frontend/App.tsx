import { registerRootComponent } from 'expo';
import './global.css';
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PostProvider } from './src/context/PostContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

function AppContent() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Hide splash screen once auth state is determined
      SplashScreen.hideAsync().catch(() => {
        /* ignore error */
      });
    }
  }, [isLoading]);

  return <AppNavigator />;
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PostProvider>
          <AppContent />
        </PostProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App;
