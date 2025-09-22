import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { colors } from "../constants/theme";
import { spacingX, spacingY, radius } from "../constants/theme";
import { useTasks } from "@/contexts/taskContext";
import { TasksState } from "../types";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";

const DiffBottomSheet = () => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const { changeDifficulty, clickSubMenu, bottomSheetIndex } = useTasks();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1} // snapPoints에 맞춰 0으로 설정
      snapPoints={["30%"]} // 높이 40% 정도 (예시)
      enablePanDownToClose
      onClose={() => clickSubMenu(null)}
      style={{
        width: "90%",
        marginLeft: "5%", // X축 중앙
      }}
      backgroundStyle={{
        borderRadius: 12,
        backgroundColor: colors.white + "4D",
        borderColor: colors.neutral300,
        borderWidth: 2,
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
            flexDirection: "row",
            width: "100%",
            height: "90%", // BottomSheet 높이의 80%
          }}
        >
          {["easy", "medium", "hard", "extreme"].map((label, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                changeDifficulty(label as keyof TasksState);
              }}
              style={{
                flex: 1,
                marginHorizontal: spacingX._10, // 버튼 간격
                marginVertical: spacingY._5,
                backgroundColor: colors.sub,
                borderRadius: radius._10,
                justifyContent: "center",
                paddingLeft: spacingX._20,
              }}
            >
              {
                <Typo size={verticalScale(26)} fontWeight={600}>
                  {label}
                </Typo>
              }
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DiffBottomSheet;

const styles = StyleSheet.create({});
