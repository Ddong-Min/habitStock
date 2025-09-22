import React, { useEffect, useMemo, useState } from "react";
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
import { useTasks } from "@/contexts/taskContext";
import { verticalScale } from "@/utils/styling";

const TodoList: React.FC<{}> = () => {
  const {
    tasks,
    newTaskText,
    newTaskDifficulty,
    modifyIndex,
    handleToggleTask,
    addNewTask,
    loadTasks,
    makeNewTask,
    selectNewTaskDifficulty,
    clickSubMenu,
    saveEditedTask,
  } = useTasks();

  useEffect(() => {
    loadTasks(); // call the hook function to fetch tasks from Firestore
  }, []); // empty dependency array -> run only once

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
                setNewTaskDifficulty={selectNewTaskDifficulty}
              />
              {/* Show input if this header is active */}
              {newTaskDifficulty === item.difficulty && (
                <View style={styles.newTaskContainer}>
                  <TextInput
                    placeholder="새 할일을 입력해주세요."
                    value={newTaskText}
                    onChangeText={makeNewTask}
                    style={styles.newTaskInput}
                    autoFocus
                    onSubmitEditing={() =>
                      modifyIndex !== null ? saveEditedTask() : addNewTask()
                    }
                  />
                  <TouchableOpacity
                    onPress={() =>
                      modifyIndex != null ? saveEditedTask() : addNewTask()
                    }
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
              <View style={styles.taskRight}>
                <Typo
                  style={{
                    color: isPositive ? colors.red100 : colors.blue100,
                  }}
                >
                  {item.completed &&
                    `${isPositive ? "▲" : "▼"} ${item.percentage.substring(1)}`}
                </Typo>
                <TouchableOpacity onPress={() => clickSubMenu(item.id)}>
                  <Feather
                    name="more-horizontal"
                    size={22}
                    color={colors.neutral300}
                  />
                </TouchableOpacity>
              </View>
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
