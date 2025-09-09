// app/(tabs)/index.tsx
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";
import Profile from "../../components/Profile";
import Toggle from "../../components/Toggle";
import CustomCalendar from "../../components/CustomCalendar";
import TodoList from "../../components/TodoList";
import { TasksState } from "../../types";
import { format } from "date-fns";
const initialTasks: TasksState = {
  easy: [
    { id: "1", text: "Task 1", completed: false, percentage: "+0.13%" },
    { id: "5", text: "Task 2", completed: false, percentage: "+0.13%" },
    { id: "6", text: "Task 3", completed: false, percentage: "+0.13%" },
  ],
  medium: [{ id: "2", text: "Task 1", completed: true, percentage: "+0.44%" }],
  hard: [{ id: "3", text: "Task 1", completed: false, percentage: "-0.55%" }],
  extreme: [{ id: "4", text: "뉴스 보내기", completed: false, percentage: "" }],
};

const TodoScreen = () => {
  const [activeTab, setActiveTab] = useState<"todo" | "bucket">("todo");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [tasks, setTasks] = useState<TasksState>(initialTasks);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Profile
          name="Ddongmin (DMN)"
          price={1033}
          changeValue={15}
          changePercentage={0.3}
        />
        <Toggle onToggle={setActiveTab} />

        <CustomCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        <TodoList tasks={tasks} onDragEnd={setTasks} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
});

export default TodoScreen;
