import { StyleSheet, View, TouchableOpacity, TextInput } from "react-native";
import React from "react";
import { useTasks } from "@/contexts/taskContext";
import { useCalendar } from "@/contexts/calendarContext";
import { Feather } from "@expo/vector-icons";
import { verticalScale } from "@/utils/styling";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { difficultyColors } from "@/constants/theme";
const NewTask = () => {
  const {
    taskType,
    newTaskText,
    putTaskText,
    addNewTask,
    editTask,
    changeAddTaskState,
    changeEditTextState,
    isEditText,
    selectedTaskId,
    finishModify,
    changeShowDatePicker,
    selectedDifficulty,
  } = useTasks();
  const { selectedDate } = useCalendar();

  return (
    <View style={styles.container}>
      <View style={styles.taskRow}>
        <View style={styles.emptyCheckBox} />

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="할 일 입력"
            placeholderTextColor={colors.neutral300}
            value={newTaskText}
            onChangeText={putTaskText}
            style={styles.textInput}
            autoFocus
            onSubmitEditing={() =>
              isEditText
                ? editTask("task", newTaskText)
                : taskType === "buckets"
                ? changeShowDatePicker()
                : addNewTask(selectedDate)
            }
          />
          <View
            style={[
              styles.underline,
              {
                backgroundColor: difficultyColors(selectedDifficulty ?? "easy"),
              },
            ]}
          />
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={() =>
              isEditText
                ? editTask("task", newTaskText)
                : taskType === "buckets"
                ? changeShowDatePicker()
                : addNewTask(selectedDate)
            }
            style={styles.actionButton}
            activeOpacity={0.6}
          >
            <Feather name="check" size={18} color={colors.neutral600} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              selectedTaskId !== null
                ? (finishModify(), changeEditTextState())
                : (finishModify(), changeAddTaskState())
            }
            style={styles.actionButton}
            activeOpacity={0.6}
          >
            <Feather name="x" size={18} color={colors.neutral600} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NewTask;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingY._5,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
  },
  emptyCheckBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral200,
    marginRight: spacingX._12,
  },
  inputWrapper: {
    flex: 1,
  },
  textInput: {
    fontSize: verticalScale(15),
    color: colors.black,
    padding: 0,
    margin: 0,
    paddingBottom: spacingY._5,
  },
  underline: {
    height: 1,

    marginTop: spacingY._2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
    marginLeft: spacingX._7,
  },
  actionButton: {
    padding: spacingX._7,
  },
});
