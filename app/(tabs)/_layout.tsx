import { StyleSheet } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { CustomTabs } from "@/components/CustomTabs";
import { useTheme } from "@/contexts/themeContext";
const TabLayout = () => {
  const { theme } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <CustomTabs {...props} theme={theme} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({});
