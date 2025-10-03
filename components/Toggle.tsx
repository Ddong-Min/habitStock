import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useTasks } from "@/contexts/taskContext";
import { useCalendar } from "@/contexts/calendarContext";

type ToggleMode = "todos" | "buckets";

const Toggle: React.FC<{}> = () => {
  const { taskType, changeTaskType } = useTasks();
  const { changeSelectedDate } = useCalendar();

  const handlePress = (mode: ToggleMode) => {
    if (taskType === mode) return; // 이미 선택된 모드면 아무 작업도 하지 않음
    if (mode === "buckets") {
      const today = new Date();
      const year = today.getFullYear();
      const formattedDate = `${year}`;
      changeSelectedDate(formattedDate); // 오늘 날짜로 변경
    } else if (mode === "todos") {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      changeSelectedDate(formattedDate); // 오늘 날짜로 변경
    }
    changeTaskType(mode);
  };

  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          taskType === "todos" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("todos")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            taskType === "todos" ? styles.activeButtonText : styles.buttonText
          }
        >
          할일
        </Typo>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          taskType === "buckets" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("buckets")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            taskType === "buckets" ? styles.activeButtonText : styles.buttonText
          }
        >
          목표
        </Typo>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._40,
    borderBottomWidth: 1,
    borderBottomColor: colors.sub,
    backgroundColor: colors.white,
  },
  toggleButton: {
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._50,
  },
  activeButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.main,
  },
  buttonText: {
    color: colors.sub,
  },
  activeButtonText: {
    color: colors.main,
  },
});

export default Toggle;
