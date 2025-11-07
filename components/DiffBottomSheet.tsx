import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
// 'colors' import 제거, 'difficultyborderColor'는 사용되지 않아 제거
import {
  spacingX,
  spacingY,
  difficultyColors,
} from "../constants/theme";
import { useTasks } from "@/contexts/taskContext";
import { TasksState } from "../types";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";
import { useTheme } from "@/contexts/themeContext"; // 1. useTheme 훅 import

const DiffBottomSheet = () => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const { editTask, changeDifficultySheetState } = useTasks();

  const { theme, isDarkMode } = useTheme(); // 2. useTheme 훅 호출

  const difficulties = [
    { key: "easy", label: "Easy" },
    { key: "medium", label: "Medium" },
    { key: "hard", label: "Hard" },
    { key: "extreme", label: "Extreme" },
  ];

  // 3. styles 정의를 컴포넌트 내부로 이동 (theme 객체 사용)
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacingX._20,
      paddingTop: spacingY._7,
      backgroundColor: theme.neutral50, // colors -> theme
    },
    header: {
      paddingBottom: spacingY._20,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral200, // colors -> theme
      marginBottom: spacingY._12,
    },
    titleText: {
      color: theme.black, // colors -> theme
      lineHeight: verticalScale(24),
      letterSpacing: -0.3,
    },
    buttonContainer: {
      flex: 1,
      gap: spacingY._12,
    },
    difficultyButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.white, // colors -> theme
      borderRadius: 12,
      paddingVertical: spacingY._17,
      paddingHorizontal: spacingX._17,
      borderWidth: 1,
      borderColor: theme.neutral200, // colors -> theme
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    difficultyIndicator: {
      width: 8,
      height: 40,
      borderRadius: 4,
      marginRight: spacingX._15,
    },
    buttonLabel: {
      color: theme.black, // colors -> theme
      letterSpacing: -0.2,
    },
  });

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={["45%"]}
      enablePanDownToClose
      onClose={() => changeDifficultySheetState()}
      style={{
        width: "94%",
        marginLeft: "3%",
        zIndex: 10,
      }}
      backgroundStyle={{
        borderRadius: 20,
        backgroundColor: theme.white, // 4. colors -> theme
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
        backgroundColor: theme.neutral400, // 5. colors -> theme
        width: 40,
        height: 4,
      }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Typo size={18} fontWeight="600" style={styles.titleText}>
            난이도 선택
          </Typo>
        </View>

        <View style={styles.buttonContainer}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.key}
              onPress={() => {
                editTask("difficulty", difficulty.key as keyof TasksState);
                changeDifficultySheetState();
              }}
              style={styles.difficultyButton}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.difficultyIndicator,
                  {
                    backgroundColor: difficultyColors(
                      difficulty.key as keyof TasksState,
                      isDarkMode // 6. isDarkMode 값 전달
                    ),
                  },
                ]}
              />
              <Typo size={16} fontWeight="600" style={styles.buttonLabel}>
                {difficulty.label}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DiffBottomSheet;
