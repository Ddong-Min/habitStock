import React, { useRef, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import {
  CalendarList,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import CalendarViewToggle from "./CalendarViewToggle";
import { spacingX, spacingY } from "@/constants/theme";
import CustomDay from "./CustomDay";
import { useCalendar } from "@/contexts/calendarContext";
import { useStock } from "@/contexts/stockContext";
import { useAuth } from "@/contexts/authContext";
import { useTheme } from "@/contexts/themeContext";

const CustomCalendar = () => {
  const { theme } = useTheme();
  const {
    today,
    selectedDate,
    isWeekView,
    headerText,
    handleNext,
    handlePrevious,
    handleViewToggle,
    onVisibleMonthsChange,
    changeSelectedDate,
  } = useCalendar();
  const calendarListRef = useRef<{ scrollToMonth: (date: string) => void }>(
    null
  );
  const hasInitialLoadedRef = useRef(false);
  const { user } = useAuth();

  // react-native-calendars theme 설정
  const calendarTheme = useMemo(
    () => ({
      backgroundColor: theme.cardBackground,
      calendarBackground: theme.neutral100,
      textSectionTitleColor: theme.textLight, // 요일 (일월화수목금토)
      selectedDayBackgroundColor: theme.blue100,
      selectedDayTextColor: theme.white,
      todayTextColor: theme.blue100,
      dayTextColor: theme.text, // 일반 날짜
      textDisabledColor: theme.textLighter, // 비활성 날짜
      monthTextColor: theme.text,
      textMonthFontWeight: "600" as const,
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 14,
      "stylesheet.calendar.header": {
        week: {
          marginTop: 5,
          flexDirection: "row" as const,
          justifyContent: "space-between" as const,
        },
        dayHeader: {
          marginTop: 2,
          marginBottom: 7,
          width: 32,
          textAlign: "center" as const,
          fontSize: 14,
          fontWeight: "500" as const,
          color: theme.textLight, // 요일 색상
        },
      },
    }),
    [theme]
  );

  useEffect(() => {
    if (!isWeekView && calendarListRef.current) {
      calendarListRef.current.scrollToMonth(selectedDate);
    }
  }, [selectedDate, user?.uid, user?.price]);

  // 두 번째 useEffect는 제거

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View
        style={[
          styles.customHeader,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.neutral200,
          },
        ]}
      >
        <Text style={[styles.monthText, { color: theme.text }]}>
          {headerText}
        </Text>
        <View style={styles.controlsContainer}>
          <CalendarViewToggle
            viewMode={isWeekView ? "week" : "month"}
            onToggle={handleViewToggle}
          />
          <View
            style={[
              styles.arrowContainer,
              { backgroundColor: theme.neutral100 },
            ]}
          >
            <TouchableOpacity onPress={handlePrevious} style={styles.arrow}>
              <Text style={[styles.arrowText, { color: theme.text }]}>‹</Text>
            </TouchableOpacity>
            <View
              style={[styles.divider, { backgroundColor: theme.neutral200 }]}
            />
            <TouchableOpacity onPress={handleNext} style={styles.arrow}>
              <Text style={[styles.arrowText, { color: theme.text }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isWeekView ? (
        <CalendarProvider
          key={`week-${user?.isDarkMode}`}
          date={selectedDate}
          onDateChanged={changeSelectedDate}
        >
          <WeekCalendar
            key={`week-calendar-${user?.isDarkMode}`}
            current={selectedDate}
            onDayPress={(day) => changeSelectedDate(day.dateString)}
            style={[styles.weekCalendar, { backgroundColor: theme.neutral100 }]}
            theme={calendarTheme}
            dayComponent={({ date }) => (
              <CustomDay
                date={date ? date : { dateString: "", day: 0 }}
                selectedDate={selectedDate}
                onDateSelect={changeSelectedDate}
              />
            )}
            calendarHeight={60}
          />
        </CalendarProvider>
      ) : (
        <CalendarList
          key={`month-calendar-${user?.isDarkMode}`}
          ref={calendarListRef}
          calendarHeight={320}
          current={selectedDate}
          onDayPress={(day) => changeSelectedDate(day.dateString)}
          theme={calendarTheme}
          horizontal
          pagingEnabled
          renderHeader={() => null}
          onVisibleMonthsChange={onVisibleMonthsChange}
          pastScrollRange={12}
          futureScrollRange={12}
          showScrollIndicator={false}
          style={[styles.calendarList, { backgroundColor: theme.neutral100 }]}
          dayComponent={({ date }) => (
            <CustomDay
              date={date ? date : { dateString: "", day: 0 }}
              selectedDate={selectedDate}
              onDateSelect={changeSelectedDate}
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
    paddingTop: spacingY._15,
    paddingBottom: spacingY._12,
    borderBottomWidth: 1,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  arrow: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._7,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 24,
  },
  divider: {
    width: 1,
    height: 20,
  },
  weekCalendar: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  calendarList: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default CustomCalendar;
