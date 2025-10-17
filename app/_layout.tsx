import React, { useCallback } from "react";
import { View } from "react-native";
import { Stack, router } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/authContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/contexts/themeContext";
import * as SplashScreen from "expo-splash-screen";

// 다른 모든 Provider들을 import 합니다.
import ScreenWrapper from "@/components/ScreenWrapper";
import { CalendarProvider } from "@/contexts/calendarContext";
import { StockProvider } from "@/contexts/stockContext";
import { TasksProvider } from "@/contexts/taskContext";
import { FollowProvider } from "@/contexts/followContext";
import { NewsProvider } from "@/contexts/newsContext";
import { NotificationProvider } from "@/contexts/notificationContext";
import "react-native-url-polyfill/auto";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
// 앱이 시작될 때 스플래시 스크린이 자동으로 사라지지 않도록 합니다.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  // authContext에서 isAuthLoading과 user 상태를 가져옵니다.
  const { isAuthLoading, user } = useAuth();

  // 레이아웃이 준비되면 스플래시 스크린을 숨기고 라우팅을 처리하는 함수입니다.
  const onLayoutRootView = useCallback(async () => {
    // 인증 상태 확인이 모두 끝났을 때만 실행됩니다.
    if (!isAuthLoading) {
      // 스플래시 스크린을 숨깁니다.
      await SplashScreen.hideAsync();

      // 로딩이 끝난 후, 사용자 로그인 상태에 따라 페이지를 이동시킵니다.
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/welcome");
      }
    }
  }, [isAuthLoading, user]); // isAuthLoading 또는 user 상태가 바뀔 때만 함수가 재생성됩니다.

  // 아직 인증 상태를 확인하는 중이라면(isAuthLoading이 true이면) 아무것도 렌더링하지 않습니다.
  // 이 시간 동안 사용자는 스플래시 스크린을 보게 됩니다.
  if (isAuthLoading) {
    return null;
  }

  // 로딩이 끝나면 실제 앱 콘텐츠를 렌더링합니다.
  return (
    // View가 화면에 실제로 그려졌을 때 onLayoutRootView 함수를 실행합니다.
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ScreenWrapper>
        <CalendarProvider>
          <StockProvider>
            <TasksProvider>
              <FollowProvider>
                <NewsProvider>
                  <Stack screenOptions={{ headerShown: false }} />
                </NewsProvider>
              </FollowProvider>
            </TasksProvider>
          </StockProvider>
        </CalendarProvider>
      </ScreenWrapper>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}
