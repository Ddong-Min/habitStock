import React, { useState } from "react";
import { SafeAreaView, StyleSheet, ScrollView, View } from "react-native";
import { colors, spacingY } from "../../constants/theme";
import Profile from "../../components/Profile";
import CustomCalendar from "../../components/CustomCalendar";
import TodoList from "../../components/TodoList";
import { format } from "date-fns";
import Toggle from "@/components/Toggle";
import { useTasks } from "@/hooks/useTaskHook";

const TodoScreen = () => {
  const [activeTab, setActiveTab] = useState<"todo" | "bucket">("todo");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 고정 영역 */}
      <Profile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
      />
      <Toggle onToggle={setActiveTab} />

      {/* 스크롤 영역 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <CustomCalendar />

        <View style={{ marginTop: spacingY._15 }}>
          <TodoList />
        </View>
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
