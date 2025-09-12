// app/(tabs)/index.tsx
import React, { useState } from "react";
import { StyleSheet, FlatList, View } from "react-native";
import { colors } from "../../constants/theme";
import CustomCalendar from "../../components/CustomCalendar";
import TodoList from "../../components/TodoList";
import { TasksState } from "../../types";
import { format } from "date-fns";
import Toggle from "@/components/Toggle";
import SubProfile from "../../components/SubProfile";

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

  // FlatList에서 렌더링할 아이템 정의
  const content = [{ key: "calendar" }, { key: "todo" }];

  return (
    <View style={styles.container}>
      {/* 상단 고정 영역 */}
      <SubProfile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
      />
      <Toggle onToggle={setActiveTab} />

      {/* 스크롤 영역 */}
      <FlatList
        data={content}
        //keyExtractor={(item) => item.key} 이미 content에 key로 정의되어있어서 keyExtractor필요없음
        renderItem={({ item }) => {
          if (item.key === "calendar") {
            return (
              <CustomCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            );
          }
          if (item.key === "todo") {
            return <TodoList tasks={tasks} onDragEnd={setTasks} />;
          }
          return null;
        }}
        contentContainerStyle={styles.scrollContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default TodoScreen;
