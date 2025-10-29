import { StyleSheet, View, TouchableOpacity, ViewStyle } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import {
  difficultyColors,
  radius,
  spacingX,
  spacingY,
} from "@/constants/theme";
import { TasksState } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useTheme } from "@/contexts/themeContext";

const DifficultyHeader: React.FC<{
  difficulty: keyof TasksState;
  setNewTaskDifficulty: (difficulty: keyof TasksState) => void;
  isAddMode: () => void;
  style?: ViewStyle;
  fontSize?: number;
}> = ({ difficulty, setNewTaskDifficulty, isAddMode, style, fontSize }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={styles.difficultyHeader}>
      <View
        style={[
          styles.badgeContainer,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        <View
          style={[
            styles.difficultyIndicator,
            { backgroundColor: difficultyColors(difficulty, isDarkMode) },
          ]}
        />
        <Typo
          size={verticalScale(fontSize ? fontSize : 16)}
          style={{
            lineHeight: verticalScale(fontSize ? fontSize : 16),
            letterSpacing: -0.2,
          }}
          color={theme.text}
          fontWeight="600"
        >
          {difficulty}
        </Typo>
        <TouchableOpacity
          style={[styles.plusButton, { backgroundColor: theme.neutral100 }]}
          onPress={() => {
            setNewTaskDifficulty(difficulty);
            isAddMode();
          }}
          activeOpacity={0.7}
        >
          <Feather
            name="plus"
            size={verticalScale(fontSize ? fontSize - 2 : 14)}
            color={theme.neutral500}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DifficultyHeader;

const styles = StyleSheet.create({
  difficultyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._12,
    marginTop: spacingY._10,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._5,
    paddingLeft: spacingX._7,
    paddingRight: spacingX._10,
    borderRadius: 10,
    gap: spacingX._7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  difficultyIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  plusButton: {
    borderRadius: 6,
    padding: spacingX._5,
    marginLeft: spacingX._5,
  },
});
