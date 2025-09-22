import React, { useState } from "react";
import { SafeAreaView, StyleSheet, ScrollView, View } from "react-native";
import { colors, radius, spacingX, spacingY } from "../../constants/theme";
import Profile from "../../components/Profile";
import CustomCalendar from "../../components/CustomCalendar";
import TodoList from "../../components/TodoList";
import Toggle from "@/components/Toggle";
import { useTasks } from "@/contexts/taskContext";

import TaskBottomSheet from "@/components/taskBottomSheet";
import DiffBottomSheet from "@/components/DiffBottomSheet";
const TodoScreen = () => {
  const [activeTab, setActiveTab] = useState<"todo" | "bucket">("todo");
  const { bottomSheetIndex, modifyDifficulty } = useTasks();

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 고정 영역 */}
      <Profile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
      />
      <Toggle onToggle={setActiveTab} />

      {/* 스크롤 영역 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <CustomCalendar />
        <View style={{ marginTop: spacingY._15 }}>
          <TodoList />
        </View>
      </ScrollView>

      {/* Bottom Sheets */}
      {bottomSheetIndex != null && <TaskBottomSheet />}
      {modifyDifficulty != null && <DiffBottomSheet />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
});

export default TodoScreen;
