import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  Alert, // ✅ Alert 임포트
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
import { customLogEvent } from "@/events/appEvent";
import { useAuth } from "@/contexts/authContext"; // ✅ useAuth 임포트

const TodoScreen = () => {
  const {
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
  const { user } = useAuth(); // ✅ user 객체 가져오기

  // 뉴스 생성 모드 상태
  const [isNewsMode, setIsNewsMode] = useState(false);

  // 뉴스 생성 버튼 토글
  const toggleNewsMode = async () => {
    // ✅ 4. 뉴스 생성 모드 "진입 시"에만 횟수 체크
    if (!isNewsMode) {
      if (!user) return; // 유저 정보 없으면 중단

      // ✅ [오류 수정] KST(UTC+9) 날짜 계산 로직 변경
      // (new Date().toLocaleString()는 React Native에서 불안정)
      const now = new Date();
      const localOffsetInMs = now.getTimezoneOffset() * 60000;
      const kstOffsetInMs = 9 * 3600000; // UTC+9
      const kstTime = new Date(now.getTime() + localOffsetInMs + kstOffsetInMs);
      const todayKST = kstTime.toISOString().split("T")[0];
      // ✅ 수정 끝

      const lastReset = user.newsGenerationLastReset || null;
      let currentCount = user.newsGenerationCount || 0;

      // 날짜가 다르면 카운트 0으로 간주 (체크용)
      if (lastReset !== todayKST) {
        currentCount = 0;
      }

      // 횟수 제한 체크
      if (currentCount >= 3) {
        Alert.alert(
          "한도 초과",
          `오늘 뉴스 생성 횟수(${currentCount}/3)를 모두 사용했습니다. 내일 다시 시도해주세요.`
        );
        return; // 모드 변경(setIsNewsMode)을 막음
      }
    }

    // ✅ 5. 횟수 제한에 걸리지 않으면 모드 변경
    setIsNewsMode(!isNewsMode);

    await customLogEvent({
      eventName: "toggle_news_mode",
      payload: {
        previous_mode: isNewsMode,
        new_mode: !isNewsMode,
        timestamp: new Date().toISOString(),
      },
    });
  };
  // Z-index 계산: BottomSheet가 열려있으면 그 아래로
  const floatingButtonZIndex = 5;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <UserProfile />
        {/* <Toggle /> */}

        <CustomCalendar />

        <View style={{ flex: 1 }}>
          <TaskList isNewsMode={isNewsMode} />
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
    backgroundColor: colors.blue100, // (theme.ts에 blue100이 정의되어 있어야 함)
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
    backgroundColor: colors.sub, // (theme.ts에 sub가 정의되어 있어야 함)
  },
  floatingButtonText: {
    color: colors.white, // (theme.ts에 white가 정의되어 있어야 함)
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TodoScreen;
