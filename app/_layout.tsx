import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

// 스플래시 스크린이 자동으로 사라지는 것을 막습니다.
SplashScreen.preventAutoHideAsync();

const _layout = () => {
  const [loaded, error] = useFonts({
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-Light": require("../assets/fonts/Outfit-Light.ttf"),
    "Outfit-ExtraLight": require("../assets/fonts/Outfit-ExtraLight.ttf"),
    "Outfit-ExtraBold": require("../assets/fonts/Outfit-ExtraBold.ttf"),
    "Outfit-Black": require("../assets/fonts/Outfit-Black.ttf"),
    "Outfit-Thin": require("../assets/fonts/Outfit-Thin.ttf")
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // 2. 폰트 로딩이 끝나면 스플래시 스크린을 숨깁니다.
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 3. 폰트가 로드되지 않았으면 null을 반환하여 로딩을 기다립니다.
  if (!loaded) {
    return null;
  }

  // 폰트 로딩이 완료되면 Stack 네비게이션을 보여줍니다.
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default _layout;