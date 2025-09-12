import { StyleSheet } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/authContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ScreenWrapper from "@/components/ScreenWrapper";

const StackLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 모든 스크린을 ScreenWrapper로 감싸줌
        contentStyle: { flex: 1 },
      }}
    />
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* ScreenWrapper가 Stack 전체를 감싸게 */}
        <ScreenWrapper>
          <StackLayout />
        </ScreenWrapper>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
