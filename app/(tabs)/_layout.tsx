import { StyleSheet } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { CustomTabs } from "@/components/CustomTabs";
import { useTheme } from "@/contexts/themeContext";
import { customLogScreenView } from "@/events/appEvent"; // (경로 확인)

const TabLayout = () => {
  const { theme } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <CustomTabs {...props} theme={theme} />} // ✅ 이 prop이 남아있는지 확인
      screenOptions={{ headerShown: false }}
      screenListeners={({ route }) => ({
        focus: () => {
          const screenName = route.name === "index" ? "todo" : route.name;
          customLogScreenView(screenName);
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}; // 👈 컴포넌트 선언은 여기서 끝납니다.

export default TabLayout; // (아마 export default가 있을 것입니다)
