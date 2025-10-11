import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { colors } from "../constants/theme";
import { spacingX, spacingY, radius } from "../constants/theme";
import { useTasks } from "@/contexts/taskContext";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";
import { Alert } from "react-native";
import {
  TrashSimpleIcon,
  ScissorsIcon,
  SwapIcon,
  CalendarIcon,
} from "phosphor-react-native";

const TaskBottomSheet = () => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const {
    selectedText,
    changeEditTextState,
    deleteTask,
    changeDifficultySheetState,
    changeShowDatePicker,
    changeBottomSheetState,
    finishModify,
  } = useTasks();

  const buttonActions = [
    {
      label: "내용 수정하기",
      icon: <ScissorsIcon size={24} color="gray" />,
      onPress: () => {
        changeEditTextState();
      },
    },
    {
      label: "할일 삭제하기",
      icon: <TrashSimpleIcon size={24} color="gray" />,
      onPress: () => {
        // code for deleting todo
        Alert.alert("삭제 확인", "정말로 이 할일을 삭제하시겠습니까?", [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: () => {
              deleteTask();
            },
          },
        ]);
      },
    },
    {
      label: "난이도 변경하기",
      icon: <SwapIcon size={24} color="gray" />,
      onPress: () => {
        changeDifficultySheetState();
      },
    },
    {
      label: "날짜 변경하기",
      icon: <CalendarIcon size={24} color="gray" />,
      onPress: () => {
        changeShowDatePicker();
      },
    },
  ];
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0} // snapPoints에 맞춰 0으로 설정
      snapPoints={["30%", "40%"]} // 높이 40% 정도 (예시)
      enablePanDownToClose
      onClose={() => {
        finishModify(), changeBottomSheetState();
      }}
      style={{
        width: "90%",
        marginLeft: "5%", // X축 중앙
        zIndex: 10,
      }}
      backgroundStyle={{
        borderRadius: 12,
        backgroundColor: colors.white,
        borderColor: colors.blue50,
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
        <Typo
          size={verticalScale(30)}
          fontWeight={700}
          style={{
            lineHeight: verticalScale(30),
            marginBottom: spacingY._10,
          }}
        >
          "{selectedText}"
        </Typo>
        <View
          style={{
            width: "90%",
            height: "90%", // BottomSheet 높이의 80%
          }}
        >
          {buttonActions.map((btn, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                btn.onPress();
                changeBottomSheetState(); // BottomSheet 닫기
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                marginHorizontal: spacingX._5, // 버튼 간격
                marginVertical: spacingY._5,
                backgroundColor: colors.neutral50,
                borderRadius: radius._10,
                paddingLeft: spacingX._20,
                alignItems: "center",
                gap: spacingX._15,
                borderWidth: 1,
                borderColor: colors.blue25,
              }}
            >
              {btn.icon}
              {
                <Typo
                  size={verticalScale(26)}
                  fontWeight={600}
                  style={{ lineHeight: verticalScale(26) }}
                >
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
