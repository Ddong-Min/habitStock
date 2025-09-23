import React, { useState } from "react";
import { SafeAreaView, StyleSheet, ScrollView, View } from "react-native";
import { colors, radius, spacingX, spacingY } from "../../constants/theme";
import Profile from "../../components/Profile";
import CustomCalendar from "../../components/CustomCalendar";
import TaskList from "../../components/TaskList";
import Toggle from "@/components/Toggle";
import { useTasks } from "@/contexts/taskContext";

import TaskBottomSheet from "@/components/TaskBottomSheet";
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

      {activeTab === "todo" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <CustomCalendar />

          <View style={{ flex: 1, marginTop: spacingY._15 }}>
            <TaskList isTodo={true} />
          </View>
        </ScrollView>
      )}
      {activeTab === "bucket" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1, marginTop: spacingY._15 }}>
            <TaskList
              isTodo={false}
              diffStyle={{
                paddingVertical: spacingY._7,
                paddingHorizontal: spacingX._20,
              }}
            />
          </View>
        </ScrollView>
      )}
      {/* 모달 영역 */}
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
