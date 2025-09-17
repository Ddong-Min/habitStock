import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import {
  CalendarList,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import {
  format,
  addMonths,
  addWeeks,
  getDate, //return day of month (ex. if date is 2024-10-05, return 5)
  startOfMonth, //return first day of month (ex. if date is 2024-10-05, return 2024-10-01)
  getDay, //return day of week (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
} from "date-fns";
import CalendarViewToggle from "./CalendarViewToggle";
import { MarkedDates } from "react-native-calendars/src/types";
import { CustomCalendarProps } from "@/types";
import { colors, spacingX, spacingY } from "@/constants/theme";
import CustomDay from "./CustomDay";
const today = format(new Date(), "yyyy-MM-dd");

//calculate week of month
//if date is 2024-10-05, return 1 (it means that day is in first week of month)
//if date is 2024-10-15, return 3
//if date is 2024-10-25, return 4
const getWeekOfMonth = (date: Date) => {
  const firstDayOfMonth = startOfMonth(date);
  const firstDayOfWeek = getDay(firstDayOfMonth);
  const dayOfMonth = getDate(date);
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
};

const CustomCalendar = ({
  selectedDate,
  onDateSelect,
}: CustomCalendarProps) => {
  const [isWeekView, setIsWeekView] = useState(true);
  const calendarListRef = useRef<{ scrollToMonth: (date: string) => void }>(
    null
  ); //if i git it a date string like "2024-10-05", it scrolls to that month

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
    ? `${format(currentDate, "yyyy년 MM월")} ${getWeekOfMonth(currentDate)}주차`
    : format(currentDate, "yyyy년 MM월");

  return (
    <View style={styles.container}>
      <View style={styles.customHeader}>
        <Text style={styles.monthText}>{headerText}</Text>
        <View style={styles.controlsContainer}>
          <CalendarViewToggle
            viewMode={isWeekView ? "week" : "month"}
            onToggle={handleViewToggle}
          />
          <TouchableOpacity onPress={handlePrevious} style={styles.arrow}>
            <Text style={styles.arrowText}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.arrow}>
            <Text style={styles.arrowText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isWeekView ? (
        <CalendarProvider
          date={selectedDate} // syncs selected date with provider
          onDateChanged={onDateSelect} // update when user selects a new day
        >
          <WeekCalendar
            current={selectedDate}
            onDayPress={(day) => onDateSelect(day.dateString)}
            dayComponent={({ date }) => (
              <CustomDay
                date={date ? date : { dateString: "", day: 0 }}
                today={today}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
              />
            )}
            calendarHeight={60}
          />
        </CalendarProvider>
      ) : (
        <CalendarList
          ref={calendarListRef}
          calendarHeight={320}
          current={selectedDate}
          onDayPress={(day) => onDateSelect(day.dateString)}
          horizontal
          pagingEnabled
          renderHeader={() => null}
          onVisibleMonthsChange={onVisibleMonthsChange}
          pastScrollRange={12}
          futureScrollRange={12}
          showScrollIndicator={false}
          dayComponent={({ date }) => (
            <CustomDay
              date={date ? date : { dateString: "", day: 0 }}
              today={today}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
    backgroundColor: "white",
  },
  monthText: { fontSize: 22, fontWeight: "bold" },
  arrow: { padding: spacingX._5 },
  arrowText: { fontSize: 30, color: colors.black },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
});

export default CustomCalendar;
