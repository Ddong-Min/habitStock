import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { colors, radius, spacingX, spacingY } from "../../constants/theme";
import CustomCalendar from "../../components/CustomCalendar";
import TaskList from "../../components/TaskList";
import { useTasks } from "@/contexts/taskContext";
import TaskBottomSheet from "@/components/TaskBottomSheet";
import DiffBottomSheet from "@/components/DiffBottomSheet";
import CustomDatePicker from "@/components/CustomDatePicker";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";
import UserProfile from "../../components/UserProfile";
const TodoScreen = () => {
  const {
    taskType,
    isBottomSheetOpen,
    isModifyDifficultySheet,
    showDatePicker,
    isAddTask,
    changeShowDatePicker,
    editTask,
    addNewTask,
    finishModify,
  } = useTasks();
  const { selectedDate } = useCalendar();
  const { theme } = useTheme();

  // 뉴스 생성 모드 상태
  const [isNewsMode, setIsNewsMode] = useState(false);

  // 뉴스 생성 버튼 토글
  const toggleNewsMode = () => {
    setIsNewsMode(!isNewsMode);
  };

  // Z-index 계산: BottomSheet가 열려있으면 그 아래로
  const floatingButtonZIndex = 5;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <UserProfile type="todo" />
        {/* <Toggle /> */}

        <CustomCalendar />

        <View style={{ flex: 1 }}>
          <TaskList isTodo={true} isNewsMode={isNewsMode} />
        </View>
      </ScrollView>

      {/* 뉴스 생성 플로팅 버튼 */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { zIndex: floatingButtonZIndex },
          isNewsMode && styles.floatingButtonActive,
        ]}
        onPress={toggleNewsMode}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>
          {isNewsMode ? "완료" : "뉴스생성"}
        </Text>
      </TouchableOpacity>

      {/* 모달 영역 */}
      {isBottomSheetOpen && <TaskBottomSheet />}
      {isModifyDifficultySheet && <DiffBottomSheet />}
      {showDatePicker && !isAddTask && (
        <View style={styles.datePickerOverlay}>
          <CustomDatePicker
            onConfirm={(date) => {
              editTask(
                "dueDate",
                `${date.year}-${String(date.month).padStart(2, "0")}-${String(
                  date.day
                ).padStart(2, "0")}`
              );
              changeShowDatePicker();
            }}
            onCancel={() => (finishModify(), changeShowDatePicker())}
          />
        </View>
      )}
      {showDatePicker && isAddTask && (
        <View style={styles.datePickerOverlay}>
          <CustomDatePicker
            onConfirm={(date) => {
              addNewTask(
                `${date.year}-${String(date.month).padStart(2, "0")}-${String(
                  date.day
                ).padStart(2, "0")}`
              );
              changeShowDatePicker();
            }}
            onCancel={() => changeShowDatePicker()}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  datePickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  floatingButton: {
    position: "absolute",
    right: spacingX._20,
    bottom: spacingY._30,
    backgroundColor: colors.blue100,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._25,
    borderRadius: radius._50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  floatingButtonActive: {
    backgroundColor: colors.sub,
  },
  floatingButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TodoScreen;
