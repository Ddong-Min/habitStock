module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Reanimated 플러그인은 항상 마지막에 위치해야 합니다!
      "react-native-reanimated/plugin",
    ],
  };
};
