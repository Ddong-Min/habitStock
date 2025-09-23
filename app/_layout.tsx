import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/authContext";
// 1. GestureHandlerRootView를 import 합니다.
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ScreenWrapper from "@/components/ScreenWrapper";
import { TasksProvider } from "@/contexts/taskContext";
import { CalendarProvider } from "@/contexts/calendarContext";

const StackLayout = () => {
  return <Stack screenOptions={{ headerShown: false }}></Stack>;
};

export default function RootLayout() {
  return (
    // 2. AuthProvider 바깥을 GestureHandlerRootView로 감싸줍니다.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenWrapper>
        <AuthProvider>
          <CalendarProvider>
            <TasksProvider>
              <StackLayout />
            </TasksProvider>
          </CalendarProvider>
        </AuthProvider>
      </ScreenWrapper>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
