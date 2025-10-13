import React, { useEffect, useMemo, useState } from "react";
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
import { radius, spacingX, spacingY } from "@/constants/theme";
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

const TaskList: React.FC<{
  isTodo: boolean;
  diffStyle?: ViewStyle;
  taskStyle?: ViewStyle;
  diffFontSize?: number;
  taskFontSize?: number;
  isNewsMode?: boolean;
}> = ({
  isTodo,
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
    loadTasks,
    changeAddTaskState,
    completedTask,
    startModify,
    changeBottomSheetState,
  } = useTasks();
  const { user } = useAuth();
  const { selectedDate } = useCalendar();
  const { createNews } = useNews();

  const [newsGeneratedTasks, setNewsGeneratedTasks] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate]);

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

  const handleNewsGeneration = async (
    taskId: string,
    dueDate: string,
    taskText: string
  ) => {
    try {
      Alert.alert(
        "광고 시청",
        "15초 광고를 시청하고 뉴스를 생성하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "시청하기",
            onPress: async () => {
              setTimeout(async () => {
                try {
                  await createNews(taskId, dueDate, true);
                  setNewsGeneratedTasks((prev) => new Set(prev).add(taskId));
                  Alert.alert("완료", "AI 뉴스가 생성되었습니다!");
                } catch (error) {
                  console.error("뉴스 생성 실패:", error);
                  Alert.alert("오류", "뉴스 생성에 실패했습니다.");
                }
              }, 1000);
            },
          },
        ]
      );
    } catch (error) {
      console.error("광고 로드 실패:", error);
      Alert.alert("오류", "광고를 불러올 수 없습니다.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
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
                  isTodo={isTodo}
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
                          handleNewsGeneration(item.id, item.dueDate, item.text)
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
