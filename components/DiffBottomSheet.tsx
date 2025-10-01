import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { colors, difficultyborderColor } from "../constants/theme";
import {
  spacingX,
  spacingY,
  radius,
  difficultyColors,
} from "../constants/theme";
import { useTasks } from "@/contexts/taskContext";
import { TasksState } from "../types";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";

const DiffBottomSheet = () => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const { editTask, changeDifficultySheetState } = useTasks();
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={["40%"]} // 높이 40% 정도 (예시)
      enablePanDownToClose
      onClose={() => changeDifficultySheetState()}
      style={{
        width: "90%",
        marginLeft: "5%", // X축 중앙
      }}
      backgroundStyle={{
        borderRadius: radius._12,
        backgroundColor: colors.white,
        borderColor: colors.blue50,
        borderWidth: 1,
      }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          height: "100%",
          justifyContent: "center", // Y축 중앙
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "100%",
            height: "90%",
          }}
        >
          {["easy", "medium", "hard", "extreme"].map((label, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                editTask("difficulty", label as keyof TasksState);
                changeDifficultySheetState();
              }}
              style={{
                flex: 1,
                marginHorizontal: spacingX._10,
                marginVertical: spacingY._5,
                borderColor: difficultyColors(label as keyof TasksState),
                borderWidth: 1,
                backgroundColor: difficultyborderColor(
                  label as keyof TasksState
                ),
                borderRadius: radius._10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typo
                size={verticalScale(26)}
                fontWeight={600}
                style={{ lineHeight: verticalScale(26) }}
              >
                {label}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DiffBottomSheet;

const styles = StyleSheet.create({});
