// components/CustomCalendar.tsx

import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { CalendarList, WeekCalendar } from "react-native-calendars";
import {
  format,
  addMonths,
  addWeeks,
  getDate,
  startOfMonth,
  getDay,
} from "date-fns";
import CalendarViewToggle from "./CalendarViewToggle";

const getWeekOfMonth = (date: Date) => {
  const firstDayOfMonth = startOfMonth(date);
  const firstDayOfWeek = getDay(firstDayOfMonth);
  const dayOfMonth = getDate(date);
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
};

interface CustomCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const CustomCalendar = ({
  selectedDate,
  onDateSelect,
}: CustomCalendarProps) => {
  const [isWeekView, setIsWeekView] = useState(false);
  const calendarListRef = useRef<{ scrollToMonth: (date: string) => void }>(
    null
  );

  const currentDate = new Date(selectedDate);

  const handleNext = () => {
    const newDate = isWeekView
      ? addWeeks(currentDate, 1)
      : addMonths(currentDate, 1);
    onDateSelect(format(newDate, "yyyy-MM-dd"));
  };

  const handlePrevious = () => {
    const newDate = isWeekView
      ? addWeeks(currentDate, -1)
      : addMonths(currentDate, -1);
    onDateSelect(format(newDate, "yyyy-MM-dd"));
  };

  const handleViewToggle = (mode: "week" | "month") => {
    setIsWeekView(mode === "week");
  };

  const onVisibleMonthsChange = (months: any[]) => {
    if (months.length > 0 && !isWeekView) {
      const newCurrentDate = new Date(months[0].dateString);
      if (
        format(newCurrentDate, "yyyy-MM") !== format(currentDate, "yyyy-MM")
      ) {
        onDateSelect(format(newCurrentDate, "yyyy-MM-dd"));
      }
    }
  };

  useEffect(() => {
    // 월간 보기일 때, 그리고 ref가 연결되어 있을 때 스크롤 명령
    if (!isWeekView && calendarListRef.current) {
      calendarListRef.current.scrollToMonth(selectedDate);
    }
  }, [selectedDate, isWeekView]);

  const headerText = isWeekView
    ? `${format(currentDate, "MM월")} ${getWeekOfMonth(currentDate)}주차`
    : format(currentDate, "yyyy년 MM월");

  return (
    <View style={styles.container}>
      <View style={styles.customHeader}>
        <Text style={styles.monthText}>{headerText}</Text>
        <CalendarViewToggle
          viewMode={isWeekView ? "week" : "month"}
          onToggle={handleViewToggle}
        />
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={handlePrevious} style={styles.arrow}>
            <Text style={styles.arrowText}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.arrow}>
            <Text style={styles.arrowText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isWeekView ? (
        <WeekCalendar
          key={selectedDate} // 주간 보기는 key로 제어 (유지)
          current={selectedDate}
          onDayPress={(day) => onDateSelect(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#6a0dad" },
          }}
          theme={calendarTheme}
        />
      ) : (
        <CalendarList
          // ******** 월간 보기에서는 key를 제거하고 ref로만 제어 ********
          ref={calendarListRef}
          current={selectedDate} // current prop 추가하여 초기 월 설정
          onDayPress={(day) => onDateSelect(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#6a0dad" },
          }}
          horizontal={true}
          pagingEnabled={true}
          renderHeader={() => null}
          onVisibleMonthsChange={onVisibleMonthsChange}
          pastScrollRange={12}
          futureScrollRange={12}
          showScrollIndicator={false}
          theme={calendarTheme}
        />
      )}
    </View>
  );
};

// ... styles and theme ... (이전과 동일)
const calendarTheme = {
  selectedDayBackgroundColor: "#6a0dad",
  arrowColor: "#6a0dad",
  dotColor: "#6a0dad",
  todayTextColor: "#6a0dad",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  monthText: { fontSize: 18, fontWeight: "bold" },
  arrow: { padding: 10 },
  arrowText: { fontSize: 22, color: "#007aff" },
});

export default CustomCalendar;
