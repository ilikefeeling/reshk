import { registerRootComponent } from 'expo';
import './global.css';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { PostProvider } from './src/context/PostContext';
import { Platform } from 'react-native';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PostProvider>
          <AppNavigator />
        </PostProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App;
