import { StyleSheet, View, TouchableOpacity, TextInput } from "react-native";
import React from "react";
import { useTasks } from "@/contexts/taskContext";
import { useCalendar } from "@/contexts/calendarContext";
import { Feather } from "@expo/vector-icons";
import { verticalScale } from "@/utils/styling";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";

const NewTask = () => {
  const {
    newTaskText,
    putTaskText,
    addNewTask,
    editTask,
    changeAddTaskState,
    changeEditTextState,
    isEditText,
    selectedTaskId,
    finishModify,
  } = useTasks();
  const { selectedDate } = useCalendar();
  return (
    <View style={styles.newTaskContainer}>
      <TextInput
        placeholder="새 할일을 입력해주세요."
        value={newTaskText}
        onChangeText={putTaskText}
        style={styles.newTaskInput}
        autoFocus
        onSubmitEditing={() =>
          isEditText ? editTask("task", newTaskText) : addNewTask(selectedDate)
        }
      />
      <TouchableOpacity
        onPress={() =>
          isEditText ? editTask("task", newTaskText) : addNewTask(selectedDate)
        }
        style={styles.addButton}
      >
        <Feather name="check" size={verticalScale(20)} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          selectedTaskId !== null
            ? (finishModify(), changeEditTextState())
            : (finishModify(), changeAddTaskState())
        }
        style={styles.cancelButton}
      >
        <Feather name="x" size={verticalScale(20)} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default NewTask;

const styles = StyleSheet.create({
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
    marginRight: spacingX._3,
  },
  cancelButton: {
    backgroundColor: colors.red100,
    padding: spacingX._10,
    borderRadius: radius._10,
  },
});
