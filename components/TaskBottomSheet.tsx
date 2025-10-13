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
      icon: (
        <ScissorsIcon size={22} color={colors.neutral500} weight="regular" />
      ),
      onPress: () => {
        changeEditTextState();
      },
    },
    {
      label: "할일 삭제하기",
      icon: (
        <TrashSimpleIcon size={22} color={colors.red100} weight="regular" />
      ),
      onPress: () => {
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
      icon: <SwapIcon size={22} color={colors.neutral500} weight="regular" />,
      onPress: () => {
        changeDifficultySheetState();
      },
    },
    {
      label: "날짜 변경하기",
      icon: (
        <CalendarIcon size={22} color={colors.neutral500} weight="regular" />
      ),
      onPress: () => {
        changeShowDatePicker();
      },
    },
  ];

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={["35%", "45%"]}
      enablePanDownToClose
      onClose={() => {
        finishModify(), changeBottomSheetState();
      }}
      style={{
        width: "94%",
        marginLeft: "3%",
        zIndex: 10,
      }}
      backgroundStyle={{
        borderRadius: 20,
        backgroundColor: colors.white,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.neutral300,
        width: 40,
        height: 4,
      }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Typo size={18} fontWeight="600" style={styles.titleText}>
            {selectedText}
          </Typo>
        </View>

        <View style={styles.buttonContainer}>
          {buttonActions.map((btn, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                btn.onPress();
                changeBottomSheetState();
              }}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>{btn.icon}</View>
              <Typo size={16} fontWeight="500" style={styles.buttonLabel}>
                {btn.label}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default TaskBottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._7,
  },
  header: {
    paddingBottom: spacingY._20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
    marginBottom: spacingY._12,
  },
  titleText: {
    color: colors.black,
    lineHeight: verticalScale(24),
    letterSpacing: -0.3,
  },
  buttonContainer: {
    flex: 1,
    gap: spacingY._10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
    borderWidth: 1,
    borderColor: colors.neutral100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neutral50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._12,
  },
  buttonLabel: {
    color: colors.black,
    letterSpacing: -0.2,
  },
});
