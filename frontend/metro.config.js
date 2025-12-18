const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
// Only apply stubs for Web platform
const isWeb = process.env.EXPO_PUBLIC_PLATFORM === 'web' || process.argv.includes('--web');

config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    // Only stub native-only modules for web
    'react-native-maps': isWeb ? require.resolve('./stub') : 'react-native-maps',
    'expo-location': isWeb ? require.resolve('./stub') : 'expo-location',
    'react-native/Libraries/Utilities/codegenNativeCommands': isWeb ? require.resolve('./stub') : 'react-native/Libraries/Utilities/codegenNativeCommands',
};

module.exports = withNativeWind(config, { input: './global.css' });
