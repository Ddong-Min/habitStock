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

  const { selectedDate } = useCalendar();

  // 뉴스 생성된 task ID들을 추적
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

  // 광고 시청 후 뉴스 생성
  const handleNewsGeneration = async (taskId: string, taskText: string) => {
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
              // 실제 구현시 Google AdMob 사용
              // const rewarded = RewardedAd.createForAdRequest('YOUR_AD_UNIT_ID');
              // rewarded.load();
              // rewarded.show();

              // 광고 시청 시뮬레이션 (실제로는 광고 완료 콜백에서 실행)
              setTimeout(async () => {
                try {
                  // 뉴스 생성 API 호출
                  // const response = await fetch('/api/generate-news', {
                  //   method: 'POST',
                  //   headers: { 'Content-Type': 'application/json' },
                  //   body: JSON.stringify({
                  //     taskId,
                  //     taskText,
                  //     selectedDate
                  //   })
                  // });

                  setNewsGeneratedTasks((prev) => new Set(prev).add(taskId));
                  Alert.alert("완료", "뉴스가 생성되었습니다!");
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

          const isPositive = item.priceChange > 0;
          const hasNewsGenerated = newsGeneratedTasks.has(item.id);

          return (
            <View
              key={item.id}
              style={[
                styles.taskContainer,
                taskStyle,
                { borderColor: difficultyborderColor(item.difficulty) },
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
                      <Typo
                        style={{
                          color: isPositive ? colors.red100 : colors.blue100,
                        }}
                      >
                        {item.completed &&
                          `${isPositive ? "▲" : "▼"} ${item.priceChange} (${
                            item.percentage
                          }%)`}
                      </Typo>
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

                  {/* 뉴스 모드일 때 뉴스 아이콘 표시 */}
                  {isNewsMode && (
                    <TouchableOpacity
                      style={[
                        styles.newsIcon,
                        hasNewsGenerated && styles.newsIconActive,
                      ]}
                      onPress={() => handleNewsGeneration(item.id, item.text)}
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
    borderWidth: 1,
    borderColor: colors.sub,
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
    width: spacingX._20,
    height: spacingX._20,
    borderRadius: radius._15,
    borderWidth: 2,
    borderColor: colors.sub,
    marginRight: spacingX._10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: colors.main,
    borderColor: colors.main,
  },
  plusButton: {
    padding: spacingX._5,
    alignSelf: "flex-start",
    marginBottom: spacingY._5,
  },
  newsIcon: {
    width: 40,
    height: 40,
    borderRadius: radius._50,
    backgroundColor: colors.main,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacingX._10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  newsIconActive: {
    backgroundColor: colors.black,
  },
  newsIconText: {
    fontSize: 20,
  },
});

export default TaskList;
