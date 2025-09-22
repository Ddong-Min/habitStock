import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { colors } from "../constants/theme";
import { spacingX, spacingY, radius } from "../constants/theme";
import { useTasks } from "@/contexts/taskContext";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";
import { Alert } from "react-native";

const TaskBottomSheet = () => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const {
    bottomSheetIndex,
    clickSubMenu,
    deleteTask,
    changeModifyDiffIndex,
    startModify,
  } = useTasks();

  const buttonActions = [
    {
      label: "내용 수정하기",
      onPress: () => {
        startModify(bottomSheetIndex);
      },
    },
    {
      label: "할일 삭제하기",
      onPress: () => {
        // code for deleting todo
        Alert.alert("삭제 확인", "정말로 이 할일을 삭제하시겠습니까?", [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: () => {
              if (bottomSheetIndex) {
                deleteTask(bottomSheetIndex);
              }
            },
          },
        ]);
      },
    },
    {
      label: "난이도 변경하기",
      onPress: () => {
        changeModifyDiffIndex(bottomSheetIndex);
      },
    },
  ];
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
            width: "100%",
            height: "90%", // BottomSheet 높이의 80%
          }}
        >
          {buttonActions.map((btn, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                btn.onPress();
                clickSubMenu(null); // BottomSheet 닫기
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
                  {btn.label}
                </Typo>
              }
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default TaskBottomSheet;

const styles = StyleSheet.create({});
