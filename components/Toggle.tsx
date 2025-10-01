import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useTasks } from "@/contexts/taskContext";

type ToggleMode = "todo" | "bucket";

const Toggle: React.FC<{}> = () => {
  const { taskType, changeTaskType } = useTasks();
  const handlePress = (mode: ToggleMode) => {
    changeTaskType(mode);
  };

  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          taskType === "todo" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("todo")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            taskType === "todo" ? styles.activeButtonText : styles.buttonText
          }
        >
          할일
        </Typo>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          taskType === "bucket" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("bucket")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            taskType === "bucket" ? styles.activeButtonText : styles.buttonText
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
