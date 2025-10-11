import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
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
import { difficultyborderColor } from "@/constants/theme";
import { useNews } from "@/contexts/newsContext";
import { useAuth } from "@/contexts/authContext";

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
        style={styles.container}
        contentContainerStyle={{ paddingBottom: spacingY._20 }}
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
            <View
              key={item.id}
              style={[
                styles.taskContainer,
                taskStyle,
                { borderLeftColor: difficultyborderColor(item.difficulty) },
              ]}
            >
              {isEditText && selectedTaskId === item.id ? (
                <NewTask />
              ) : (
                <View style={styles.taskWrapper}>
                  <View style={styles.task}>
                    <View style={styles.taskLeft}>
                      <TouchableOpacity
                        onPress={() => {
                          completedTask(item.id, item.difficulty);
                        }}
                        style={[
                          styles.checkBox,
                          item.completed && styles.checkedBox,
                        ]}
                      >
                        {item.completed && (
                          <Feather name="check" size={16} color="white" />
                        )}
                        {isOverdue && !item.completed && (
                          <Feather name="x" size={16} color={colors.red100} />
                        )}
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <Typo size={taskFontSize} style={{ flexWrap: "wrap" }}>
                          {item.text}
                        </Typo>
                        {!isTodo && (
                          <Typo
                            size={verticalScale(18)}
                            style={{
                              color: colors.neutral300,
                              flexWrap: "wrap",
                            }}
                          >
                            만료일 {item.dueDate}
                          </Typo>
                        )}
                      </View>
                    </View>
                    <View style={styles.taskRight}>
                      {item.completed && (
                        <Typo
                          style={{
                            color: colors.red100,
                          }}
                        >
                          ▲ {item.priceChange}({item.percentage}%)
                        </Typo>
                      )}
                      {!item.completed && isOverdue && (
                        <Typo
                          style={{
                            color: colors.blue100,
                          }}
                        >
                          ▼ {item.priceChange}({item.percentage}%)
                        </Typo>
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
                      >
                        <Feather
                          name="more-horizontal"
                          size={verticalScale(22)}
                          color={colors.neutral300}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isNewsMode && (
                    <TouchableOpacity
                      style={[
                        styles.newsIcon,
                        hasNewsGenerated && styles.newsIconActive,
                      ]}
                      onPress={() =>
                        handleNewsGeneration(item.id, item.dueDate, item.text)
                      }
                      disabled={hasNewsGenerated}
                      activeOpacity={0.7}
                    >
                      <Typo style={styles.newsIconText}>
                        {hasNewsGenerated ? "✓" : "📰"}
                      </Typo>
                    </TouchableOpacity>
                  )}
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
    paddingHorizontal: spacingX._30,
    backgroundColor: colors.neutral50,
  },
  taskContainer: {
    backgroundColor: colors.white,
    padding: spacingY._20,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
    borderLeftWidth: 4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  task: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    flexShrink: 0,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: colors.neutral300,
    marginRight: spacingX._10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: colors.main,
    borderColor: colors.main,
    transform: [{ scale: 1.05 }],
  },
  plusButton: {
    padding: spacingX._5,
    alignSelf: "flex-start",
    marginBottom: spacingY._5,
  },
  newsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.main,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacingX._10,
    shadowColor: colors.main,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  newsIconActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  newsIconText: {
    fontSize: 22,
  },
});

export default TaskList;
