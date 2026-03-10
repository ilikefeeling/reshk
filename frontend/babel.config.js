module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // 다른 플러그인이 있다면 여기에 추가
        'react-native-reanimated/plugin', // 반드시 마지막 줄!
      ],
    };
  };