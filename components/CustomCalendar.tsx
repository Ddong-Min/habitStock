import React, { useState, useRef, useEffect } from "react";
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
  getDate,
  startOfMonth,
  getDay,
} from "date-fns";
import CalendarViewToggle from "./CalendarViewToggle";
import { CustomCalendarProps } from "@/types";
import { colors, spacingX, spacingY } from "@/constants/theme";

const today = format(new Date(), "yyyy-MM-dd");

// Utility: get week number of month
const getWeekOfMonth = (date: Date) => {
  const firstDay = startOfMonth(date);
  return Math.ceil((getDate(date) + getDay(firstDay)) / 7);
};

// Utility: create marked dates
const getMarkedDates = (selectedDate: string) => ({
  [today]: {
    customStyles: {
      text: { color: colors.main, fontWeight: "600" },
    },
  },
  [selectedDate]: {
    selected: true,
    customStyles: {
      container: {
        backgroundColor: colors.main,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        width: 32,
        height: 32,
        alignSelf: "center",
      },
      text: { color: "white", fontWeight: "bold" as const},
    },
  },
});

const CustomCalendar = ({
  selectedDate,
  onDateSelect,
}: CustomCalendarProps) => {
  const [isWeekView, setIsWeekView] = useState(true);
  const calendarListRef = useRef<{ scrollToMonth: (date: string) => void }>(
    null
  );

  const currentDate = new Date(selectedDate);

  // Change date with direction (±1)
  const handleChangeDate = (dir: number) => {
    const newDate = isWeekView
      ? addWeeks(currentDate, dir)
      : addMonths(currentDate, dir);
    onDateSelect(format(newDate, "yyyy-MM-dd"));
  };

  // Scroll CalendarList when month view & date changes
  useEffect(() => {
    if (!isWeekView && calendarListRef.current) {
      calendarListRef.current.scrollToMonth(selectedDate);
    }
  }, [selectedDate, isWeekView]);

  // Header text
  const headerText = isWeekView
    ? `${format(currentDate, "yyyy년 MM월")} ${getWeekOfMonth(currentDate)}주차`
    : format(currentDate, "yyyy년 MM월");

  return (
    <View style={styles.container}>
      {/* Custom header */}
      <View style={styles.customHeader}>
        <Text style={styles.monthText}>{headerText}</Text>
        <View style={styles.controlsContainer}>
          <CalendarViewToggle
            viewMode={isWeekView ? "week" : "month"}
            onToggle={(mode) => setIsWeekView(mode === "week")}
          />
          <TouchableOpacity
            onPress={() => handleChangeDate(-1)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleChangeDate(1)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      {isWeekView ? (
        <CalendarProvider date={selectedDate} onDateChanged={onDateSelect}>
          <WeekCalendar
            current={selectedDate}
            onDayPress={(day) => onDateSelect(day.dateString)}
            markedDates={getMarkedDates(selectedDate)}
            markingType="custom"
          />
        </CalendarProvider>
      ) : (
        <CalendarList
          ref={calendarListRef}
          current={selectedDate}
          onDayPress={(day) => onDateSelect(day.dateString)}
          markedDates={getMarkedDates(selectedDate)}
          markingType="custom"
          calendarHeight={320}
          horizontal
          pagingEnabled
          renderHeader={() => null}
          pastScrollRange={12}
          futureScrollRange={12}
          showScrollIndicator={false}
          onVisibleMonthsChange={(months) => {
            if (months.length > 0) {
              const newMonth = new Date(months[0].dateString);
              if (
                format(newMonth, "yyyy-MM") !== format(currentDate, "yyyy-MM")
              ) {
                onDateSelect(format(newMonth, "yyyy-MM-dd"));
              }
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
    backgroundColor: "white",
  },
  monthText: { fontSize: spacingX._20, fontWeight: "bold" },
  arrow: { padding: spacingX._5 },
  arrowText: { fontSize: spacingX._25, color: colors.black },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
});

export default CustomCalendar;
