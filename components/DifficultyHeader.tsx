import { StyleSheet, View, TouchableOpacity, ViewStyle } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import {
  colors,
  difficultyColors,
  radius,
  spacingX,
  spacingY,
} from "@/constants/theme";
import { TasksState } from "@/types";
import { verticalScale } from "@/utils/styling";

const DifficultyHeader: React.FC<{
  difficulty: keyof TasksState;
  setNewTaskDifficulty: (difficulty: keyof TasksState) => void;
  isAddMode: () => void;
  style?: ViewStyle;
  fontSize?: number;
  isTodo: boolean;
}> = ({
  difficulty,
  setNewTaskDifficulty,
  isAddMode,
  style,
  fontSize,
  isTodo,
}) => {
  return (
    <View style={styles.difficultyHeader}>
      <View
        style={[
          styles.difficultyBadge,
          style,
          { backgroundColor: difficultyColors(difficulty) },
        ]}
      >
        <Typo
          size={verticalScale(fontSize ? fontSize : 18)}
          style={{
            lineHeight: verticalScale(fontSize ? fontSize : 18),
            marginRight: spacingX._7,
          }}
          color="white"
          fontWeight="600"
        >
          {difficulty}
        </Typo>
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => {
            setNewTaskDifficulty(difficulty);
            isAddMode();
          }}
          activeOpacity={0.7}
        >
          <Feather
            name="plus"
            size={verticalScale(fontSize ? fontSize - 2 : 16)}
            color={colors.white}
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
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._5,
    paddingLeft: spacingX._12,
    paddingRight: spacingX._7,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  plusButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 6,
    padding: spacingX._3,
  },
});
