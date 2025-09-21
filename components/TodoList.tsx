import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import DifficultyHeader from "./DifficultyHeader";
import { useTasks } from "@/hooks/useToggleTask";
import { verticalScale } from "@/utils/styling";
import { Gaussian } from "ts-gaussian";

const TodoList: React.FC<{}> = () => {
  const { tasks, handleToggleTask, changeTasks } = useTasks();
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<
    keyof typeof tasks | null
  >(null);
  const [newTaskText, setNewTaskText] = useState("");

  const flatData = useMemo(() => {
    return (Object.keys(tasks) as Array<keyof typeof tasks>).flatMap(
      (difficulty) => [
        { type: "header" as const, difficulty },
        ...tasks[difficulty].map((task) => ({
          ...task,
          type: "task" as const,
        })),
      ]
    );
  }, [tasks]);

  const handleAddNewTask = (difficulty: keyof typeof tasks) => {
    if (!newTaskText.trim()) return; // remove the whitespaces both start and end
    // call parent callback to add task

    // Add new task , task collection에 새로운 할일 추가
    // firestore에 연결하면, newTaskText만 넘기고, 잘 저장되면 결과를 받은 후에 이걸 changeTasks로 반영
    const randomWeight =
      difficulty === "extreme"
        ? 4
        : difficulty === "hard"
        ? 3
        : difficulty === "medium"
        ? 2
        : 1;
    const gaussian = new Gaussian(randomWeight, 1);

    changeTasks(difficulty, {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      percentage: `+${gaussian.pdf(1).toFixed(3).toString()}%`,
      date: new Date().toISOString().split("T")[0], // today's date
      difficulty,
    });

    // reset input
    setNewTaskText("");
    setNewTaskDifficulty(null);
  };

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
                setNewTaskDifficulty={setNewTaskDifficulty}
              />
              {/* Show input if this header is active */}
              {newTaskDifficulty === item.difficulty && (
                <View style={styles.newTaskContainer}>
                  <TextInput
                    placeholder="새 할일을 입력해주세요."
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    style={styles.newTaskInput}
                    autoFocus
                    onSubmitEditing={() => handleAddNewTask(item.difficulty)}
                  />
                  <TouchableOpacity
                    onPress={() => handleAddNewTask(item.difficulty)}
                    style={styles.addButton}
                  >
                    <Feather
                      name="check"
                      size={verticalScale(20)}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }

        const isPositive = item.percentage.startsWith("+");

        return (
          <View key={item.id} style={styles.taskContainer}>
            <View style={styles.task}>
              <View style={styles.taskLeft}>
                <TouchableOpacity
                  onPress={() => handleToggleTask(item.id)}
                  style={[styles.checkBox, item.completed && styles.checkedBox]}
                >
                  {item.completed && (
                    <Feather name="check" size={16} color="white" />
                  )}
                </TouchableOpacity>
                <Typo>{item.text}</Typo>
              </View>
              <Typo
                style={{
                  color: isPositive ? colors.red100 : colors.blue100,
                }}
              >
                {item.completed &&
                  `${isPositive ? "▲" : "▼"} ${item.percentage.substring(1)}`}
              </Typo>
            </View>
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
  newTaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  newTaskInput: {
    flex: 1,
    padding: spacingY._12,
    borderWidth: 1,
    borderColor: colors.sub,
    borderRadius: radius._10,
    marginRight: spacingX._10,
    backgroundColor: colors.white,
  },
  addButton: {
    backgroundColor: colors.main,
    padding: spacingX._10,
    borderRadius: radius._10,
  },
});

export default TodoList;
