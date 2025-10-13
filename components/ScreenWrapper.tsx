import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScreenWrapperProps } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/themeContext";

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.background }, style]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({});
