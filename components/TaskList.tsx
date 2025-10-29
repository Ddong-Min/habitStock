import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
// ImagePicker 임포트 추가
import * as ImagePicker from "expo-image-picker";
import { customLogEvent } from "@/events/appEvent";

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
  } = useTasks();
  const { user } = useAuth();
  const { selectedDate } = useCalendar();
  const { createNews } = useNews();

  const [newsGeneratedTasks, setNewsGeneratedTasks] = useState<Set<string>>(
    new Set()
  );

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

  // --- 여기부터 handleNewsGeneration 로직이 수정되었습니다 ---

  const handleNewsGeneration = async (
    taskId: string,
    dueDate: string,
    taskText: string,
    difficulty: keyof TasksState
  ) => {
    // 3. 광고 시청 알림창 (이미지 URL을 파라미터로 받음)
    const showAdAlert = (imageUrl: string | null = null) => {
      try {
        Alert.alert(
          "광고 시청",
          "15초 광고를 시청하고 뉴스를 생성하시겠습니까?",
          [
            {
              text: "취소",
              style: "cancel",
              onPress: () => {
                customLogEvent({ eventName: "cancel_create_news_in_ad" });
              },
            },
            {
              text: "시청하기",
              onPress: async () => {
                setTimeout(async () => {
                  try {
                    // createNews 호출 시 imageUrl 전달
                    customLogEvent({ eventName: "ad_watch_for_news" });
                    await createNews(taskId, dueDate, true, imageUrl || "");
                    setNewsGeneratedTasks((prev) => new Set(prev).add(taskId));
                    Alert.alert("완료", "AI 뉴스가 생성되었습니다!");
                    customLogEvent({ eventName: "success_create_news" });
                    changePriceAfterNews(taskId, difficulty);
                  } catch (error) {
                    console.error("뉴스 생성 실패:", error);
                    Alert.alert("오류", "뉴스 생성에 실패했습니다.");
                    customLogEvent({ eventName: "fail_create_news" });
                  }
                }, 1000); // 광고 시청 시뮬레이션
              },
            },
          ]
        );
      } catch (error) {
        console.error("광고 로드 실패:", error);
        Alert.alert("오류", "광고를 불러올 수 없습니다.");
        customLogEvent({ eventName: "ad_load_fail" });
      }
    };

    // 2. 이미지 픽커 실행 함수
    const pickImageAndShowAd = async () => {
      // 권한 요청
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "권한 필요",
          "이미지를 선택하려면 카메라 롤 접근 권한이 필요합니다."
        );
        return;
      }

      // 이미지 픽커 실행
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // 뉴스 썸네일 비율
        quality: 0.7,
      });

      // 이미지 선택을 취소한 경우
      if (pickerResult.canceled) {
        // 취소하면 아무것도 안함 (혹은 showAdAlert(null)을 호출하여 이미지 없이 진행 가능)
        console.log("Image picker cancelled");
        customLogEvent({ eventName: "cancel_image_picker" });
        return;
      }

      // 이미지 선택 완료 -> 광고 알림창 호출
      if (pickerResult.assets && pickerResult.assets.length > 0) {
        customLogEvent({ eventName: "image_selected_for_news" });
        showAdAlert(pickerResult.assets[0].uri);
      }
    };

    // 1. 가장 먼저 이미지 추가 여부를 묻는 알림창
    Alert.alert("이미지 추가", "AI 뉴스에 이미지를 추가하시겠습니까?", [
      {
        text: "아니요 (이미지 없이 생성)",
        onPress: () => {
          showAdAlert(null),
            customLogEvent({ eventName: "create_news_no_image" });
        }, // 이미지 없이 광고 알림으로 이동
      },
      {
        text: "예 (이미지 선택)",
        onPress: () => {
          pickImageAndShowAd(),
            customLogEvent({ eventName: "create_news_with_image" });
        }, // 이미지 픽커 실행
      },
      {
        text: "취소",
        style: "cancel",
        onPress: () => {
          customLogEvent({ eventName: "candel_create_news_in_image" });
        },
      },
    ]);
  };

  // --- 여기까지 handleNewsGeneration 로직이 수정되었습니다 ---

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

          const hasNewsGenerated = newsGeneratedTasks.has(item.id);
          const dueDateTimeString = `${item.dueDate}T${user?.duetime}:00`;
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
                    {isNewsMode && (
                      <TouchableOpacity
                        style={[
                          styles.newsButton,
                          { backgroundColor: theme.main },
                          hasNewsGenerated && styles.newsButtonActive,
                        ]}
                        onPress={() =>
                          handleNewsGeneration(
                            item.id,
                            item.dueDate,
                            item.text,
                            item.difficulty
                          )
                        }
                        disabled={hasNewsGenerated}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={hasNewsGenerated ? "check" : "edit-3"}
                          size={16}
                          color={theme.white}
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
  dueDateText: {},
  priceText: {
    fontSize: verticalScale(12),
    fontWeight: "600",
  },
  priceUp: {},
  priceDown: {},
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
  newsButtonActive: {
    backgroundColor: "#10B981",
  },
  newsButtonText: {
    fontSize: 18,
  },
  moreButton: {
    padding: spacingX._7,
  },
});

export default TaskList;
