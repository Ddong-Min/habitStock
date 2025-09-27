import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import DifficultyHeader from "./DifficultyHeader";
import { useTasks } from "@/contexts/taskContext";
import { verticalScale } from "@/utils/styling";
import { useCalendar } from "@/contexts/calendarContext";
import { TasksState } from "@/types";
import NewTask from "./NewTask";

const TaskList: React.FC<{
  isTodo: boolean;
  diffStyle?: ViewStyle;
  taskStyle?: ViewStyle;
  diffFontSize?: number;
  taskFontSize?: number;
}> = ({ isTodo, diffStyle, taskStyle, diffFontSize, taskFontSize }) => {
  const {
    taskByDate,
    selectedDifficulty,
    isAddTask,
    isEditText,
    selectedTaskId,
    chooseDifficulty,
    loadTasks,
    changeAddTaskState,
    editTask,
    startModify,
    changeBottomSheetState,
  } = useTasks();
  const { selectedDate } = useCalendar();

  useEffect(() => {
    loadTasks(selectedDate); // call the hook function to fetch tasks from Firestore
  }, [selectedDate]); // empty dependency array -> run only once

  const flatData = useMemo(() => {
    const tasksForSelectedDate = taskByDate[selectedDate] || []; //처음에 selectedDate에 해당하는 값이 없을 수 있으니 빈 배열로 초기화
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

  return (
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
              {/* Show input if this header is active */}
              {selectedDifficulty === item.difficulty && isAddTask && (
                <NewTask />
              )}
            </View>
          );
        }

        const isPositive = item.percentage.startsWith("+");

        return (
          <View key={item.id} style={[styles.taskContainer, taskStyle]}>
            {isEditText && selectedTaskId === item.id ? (
              <NewTask />
            ) : (
              <View style={styles.task}>
                <View style={styles.taskLeft}>
                  <TouchableOpacity
                    onPress={() => {
                      startModify(item.id, item.dueDate, item.difficulty),
                        editTask("completed", "");
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
                  <View>
                    <Typo size={taskFontSize}>{item.text}</Typo>
                    {!isTodo && (
                      <Typo
                        size={verticalScale(18)}
                        style={{ color: colors.neutral300 }}
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
                      `${isPositive ? "▲" : "▼"} ${item.percentage.substring(
                        1
                      )}`}
                  </Typo>
                  <TouchableOpacity
                    onPress={() => {
                      startModify(item.id, item.dueDate, item.difficulty),
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
            )}
          </View>
        );
      })}
    </ScrollView>
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
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
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
});

export default TaskList;
