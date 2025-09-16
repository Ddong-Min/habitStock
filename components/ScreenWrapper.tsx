import {StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScreenWrapperProps } from "@/types";
import { colors } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.neutral50 }, style]}
    >
      <StatusBar style="dark"/>
      {children}
    </SafeAreaView>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({});
