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
  style?: ViewStyle;
  fontSize?: number;
  isTodo: boolean;
}> = ({ difficulty, setNewTaskDifficulty, style, fontSize, isTodo }) => {
  return (
    <View style={styles.difficultyHeader}>
      <View
        style={[
          styles.difficultyBadge,
          style,
          { backgroundColor: difficultyColors(difficulty) },
        ]}
      >
        <View
          style={{
            marginRight: spacingX._10,
            marginLeft: isTodo ? -spacingX._5 : -spacingX._7,
          }}
        >
          <Typo
            size={verticalScale(fontSize ? fontSize : 22)}
            style={{ lineHeight: verticalScale(fontSize ? fontSize : 22) }} // 폰트 크기랑 동일하게
            color="white"
            fontWeight="bold"
          >
            {difficulty}
          </Typo>
        </View>
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => setNewTaskDifficulty(difficulty)}
        >
          <Feather
            name="plus"
            size={verticalScale(fontSize ? fontSize : 22)}
            color={colors.black}
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
    marginBottom: spacingY._15,
  },
  difficultyBadge: {
    flexDirection: "row",
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._15,
    paddingRight: spacingX._15,
    borderRadius: radius._20,
  },
  plusButton: {
    backgroundColor: colors.neutral100,
    borderRadius: radius._15,
    marginRight: -spacingX._10,
  },
});
