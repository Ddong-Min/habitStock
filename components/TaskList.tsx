import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import DifficultyHeader from "./DifficultyHeader";
import { useTasks } from "@/contexts/taskContext";
import { scale, verticalScale } from "@/utils/styling";
import { useCalendar } from "@/contexts/calendarContext";
import { TasksState } from "@/types";
import NewTask from "./NewTask";
import { useNews } from "@/contexts/newsContext";
import { useAuth } from "@/contexts/authContext";
import { useTheme } from "@/contexts/themeContext";
import { ViewStyle } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { customLogEvent } from "@/events/appEvent";
import { migrateStockDataToYearlyStructure } from "@/api/stockApi";
import { useEffect } from "react";
const TaskList: React.FC<{
  diffStyle?: ViewStyle;
  taskStyle?: ViewStyle;
  diffFontSize?: number;
  taskFontSize?: number;
  isNewsMode?: boolean;
}> = ({
  diffStyle,
  taskStyle,
  diffFontSize,
  taskFontSize,
  isNewsMode = false,
}) => {
  const { theme } = useTheme();
  const {
    taskByDate,
    selectedDifficulty,
    isAddTask,
    isEditText,
    selectedTaskId,
    chooseDifficulty,
    changeAddTaskState,
    completedTask,
    startModify,
    changeBottomSheetState,
    changePriceAfterNews,
    markTaskAsNewsGenerated,
  } = useTasks();
  const { user } = useAuth();
  const { selectedDate } = useCalendar();
  const { createNews } = useNews();

  // 뉴스 생성 로딩 상태
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);
  useEffect(() => {
    if (user?.uid) {
      migrateStockDataToYearlyStructure(user.uid, (current, total) => {
        console.log(`Progress: ${current}/${total} years`);
      });
    }
  }, []); // 빈 배열로 한 번만 실행
  const flatData = useMemo(() => {
    const tasksForSelectedDate = taskByDate[selectedDate] || [];
    return (
      Object.keys(tasksForSelectedDate) as Array<keyof TasksState>
    ).flatMap((difficulty) => [
      { type: "header" as const, difficulty },
      ...tasksForSelectedDate[difficulty].map((task) => ({
        ...task,
        type: "task" as const,
      })),
    ]);
  }, [selectedDate, taskByDate]);

  // 이미지와 함께 뉴스 생성
  const createNewsWithImage = async (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState,
    imageUrl: string | null
  ) => {
    try {
      setIsGeneratingNews(true);

      await createNews(taskId, dueDate, true, imageUrl || "");
      await markTaskAsNewsGenerated(taskId, difficulty);

      setIsGeneratingNews(false);
      Alert.alert("완료", "AI 뉴스가 생성되었습니다!");
      customLogEvent({ eventName: "success_create_news" });
      changePriceAfterNews(taskId, difficulty);
    } catch (error: any) {
      setIsGeneratingNews(false);
      console.error("뉴스 생성 실패:", error);
      Alert.alert("오류", error.message || "뉴스 생성에 실패했습니다.");
      customLogEvent({ eventName: "fail_create_news" });
    }
  };

  const handleNewsGeneration = async (
    taskId: string,
    dueDate: string,
    taskText: string,
    difficulty: keyof TasksState
  ) => {
    // 이미지 픽커 실행 함수
    const pickImageAndCreateNews = async () => {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "권한 필요",
          "이미지를 선택하려면 카메라 롤 접근 권한이 필요합니다."
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (pickerResult.canceled) {
        console.log("Image picker cancelled");
        customLogEvent({ eventName: "cancel_image_picker" });
        return;
      }

      if (pickerResult.assets && pickerResult.assets.length > 0) {
        customLogEvent({ eventName: "image_selected_for_news" });
        // 이미지 선택 후 바로 뉴스 생성
        await createNewsWithImage(
          taskId,
          dueDate,
          difficulty,
          pickerResult.assets[0].uri
        );
      }
    };

    // 이미지 추가 여부를 묻는 알림창
    Alert.alert("이미지 추가", "AI 뉴스에 이미지를 추가하시겠습니까?", [
      {
        text: "아니요 (이미지 없이 생성)",
        onPress: async () => {
          customLogEvent({ eventName: "create_news_no_image" });
          // 이미지 없이 바로 뉴스 생성
          await createNewsWithImage(taskId, dueDate, difficulty, null);
        },
      },
      {
        text: "예 (이미지 선택)",
        onPress: () => {
          customLogEvent({ eventName: "create_news_with_image" });
          pickImageAndCreateNews();
        },
      },
      {
        text: "취소",
        style: "cancel",
        onPress: () => {
          customLogEvent({ eventName: "cancel_create_news_in_image" });
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 뉴스 생성 로딩 모달 */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isGeneratingNews}
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <ActivityIndicator size="large" color={theme.main || colors.main} />
            <Typo
              size={16}
              color={theme.text}
              style={{ marginTop: spacingY._12 }}
            >
              AI 뉴스를 생성 중입니다...
            </Typo>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: theme.background, borderColor: theme.neutral200 },
        ]}
        contentContainerStyle={{
          paddingBottom:
            Platform.OS === "ios" ? verticalScale(150) : verticalScale(140),
        }}
      >
        {flatData.map((item) => {
          if (item.type === "header") {
            return (
              <View key={item.difficulty}>
                <DifficultyHeader
                  difficulty={item.difficulty}
                  setNewTaskDifficulty={chooseDifficulty}
                  isAddMode={changeAddTaskState}
                  style={diffStyle}
                  fontSize={diffFontSize}
                />
                {selectedDifficulty === item.difficulty && isAddTask && (
                  <NewTask />
                )}
              </View>
            );
          }
          const hasGeneratedNews = item.hasGeneratedNews || false;

          // ✅ duetime이 00~06이면 다음날로 처리
          let targetDate = item.dueDate;
          const dueTimeHour = parseInt(user?.duetime || "0", 10);

          if (dueTimeHour >= 0 && dueTimeHour <= 6) {
            const date = new Date(item.dueDate);
            date.setDate(date.getDate() + 1);
            targetDate = date.toISOString().split("T")[0];
          }

          const dueDateTimeString = `${targetDate}T${user?.duetime}:00`;
          const dueDateTime = new Date(dueDateTimeString);
          const isOverdue = !item.completed && dueDateTime < new Date();
          return (
            <View key={item.id}>
              {isEditText && selectedTaskId === item.id ? (
                <NewTask />
              ) : (
                <View
                  style={[
                    styles.taskRow,
                    { borderBottomColor: theme.neutral200 },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      completedTask(item.id, item.difficulty);
                    }}
                    style={styles.checkBoxContainer}
                  >
                    <View
                      style={[
                        styles.checkBox,
                        {
                          borderColor: theme.neutral300,
                          backgroundColor: theme.cardBackground,
                        },
                        item.completed && styles.checkedBox,
                        !item.completed && isOverdue && styles.overDueBox,
                      ]}
                    >
                      {item.completed && (
                        <Feather name="check" size={14} color={theme.white} />
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.taskContent}>
                    <Typo
                      size={16}
                      fontWeight={"600"}
                      color={item.completed ? theme.red100 : theme.blue100}
                      style={item.completed ? styles.completedText : undefined}
                    >
                      {item.text}
                    </Typo>

                    {(item.completed || isOverdue) && (
                      <Typo
                        size={13}
                        fontWeight={"600"}
                        color={item.completed ? theme.red100 : theme.blue100}
                      >
                        {item.completed ? "▲" : "▼"} {item.appliedPriceChange}(
                        {item.appliedPercentage}%)
                      </Typo>
                    )}
                  </View>

                  <View style={styles.rightActions}>
                    {isNewsMode && item.completed && (
                      <TouchableOpacity
                        style={styles.newsButton}
                        onPress={() =>
                          handleNewsGeneration(
                            item.id,
                            item.dueDate,
                            item.text,
                            item.difficulty
                          )
                        }
                        disabled={hasGeneratedNews}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={hasGeneratedNews ? "x" : "edit-3"}
                          size={16}
                          color={theme.text}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        startModify(
                          item.id,
                          item.dueDate,
                          item.difficulty,
                          item.text
                        ),
                          changeBottomSheetState();
                      }}
                      style={styles.moreButton}
                    >
                      <Feather
                        name="more-horizontal"
                        size={verticalScale(20)}
                        color={theme.neutral400}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
  },
  checkBoxContainer: {
    paddingRight: spacingX._12,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#d1706980",
    borderColor: "#d1706980",
  },
  overDueBox: {
    backgroundColor: "#7693a580",
    borderColor: "#7693a580",
  },
  taskContent: {
    flex: 1,
    gap: spacingY._5,
  },
  completedText: {
    textDecorationLine: "line-through",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._7,
  },
  newsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  moreButton: {
    padding: spacingX._7,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingContainer: {
    padding: spacingX._20,
    borderRadius: radius._10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TaskList;
