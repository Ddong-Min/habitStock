import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
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

const DifficultyHeader = ({ difficulty }: { difficulty: keyof TasksState }) => {
  return (
    <View style={styles.difficultyHeader}>
      <View
        style={[
          styles.difficultyBadge,
          { backgroundColor: difficultyColors(difficulty) },
        ]}
      >
        <View style={{ marginRight: spacingX._10, marginLeft: -spacingX._5 }}>
          <Typo
            size={verticalScale(22)}
            style={{ lineHeight: verticalScale(22) }} // 폰트 크기랑 동일하게
            color="white"
            fontWeight="bold"
          >
            {difficulty}
          </Typo>
        </View>
        <TouchableOpacity style={styles.plusButton}>
          <Feather name="plus" size={verticalScale(22)} color={colors.black} />
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
    marginBottom: 12,
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
