import { StyleSheet, View, TouchableOpacity, TextInput } from "react-native";
import React from "react";
import { useTasks } from "@/contexts/taskContext";
import { useCalendar } from "@/contexts/calendarContext";
import { Feather } from "@expo/vector-icons";
import { verticalScale } from "@/utils/styling";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";

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
  } = useTasks();
  const { selectedDate } = useCalendar();

  return (
    <View style={styles.newTaskContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="새 할일을 입력해주세요."
          placeholderTextColor={colors.neutral400}
          value={newTaskText}
          onChangeText={putTaskText}
          style={styles.newTaskInput}
          autoFocus
          multiline
          onSubmitEditing={() =>
            isEditText
              ? editTask("task", newTaskText)
              : taskType === "buckets"
              ? changeShowDatePicker()
              : addNewTask(selectedDate)
          }
        />
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={() =>
              isEditText
                ? editTask("task", newTaskText)
                : taskType === "buckets"
                ? changeShowDatePicker()
                : addNewTask(selectedDate)
            }
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <Feather name="check" size={verticalScale(18)} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              selectedTaskId !== null
                ? (finishModify(), changeEditTextState())
                : (finishModify(), changeAddTaskState())
            }
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Feather name="x" size={verticalScale(18)} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NewTask;

const styles = StyleSheet.create({
  newTaskContainer: {
    marginBottom: spacingY._12,
  },
  inputWrapper: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  newTaskInput: {
    fontSize: verticalScale(15),
    color: colors.black,
    minHeight: verticalScale(40),
    letterSpacing: -0.2,
    paddingBottom: spacingY._7,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacingX._7,
    marginTop: spacingY._5,
  },
  addButton: {
    backgroundColor: colors.main,
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.red100,
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
