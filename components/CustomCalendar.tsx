import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import {
  CalendarList,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import CalendarViewToggle from "./CalendarViewToggle";
import { colors, spacingX, spacingY } from "@/constants/theme";
import CustomDay from "./CustomDay";
import { verticalScale } from "@/utils/styling";
import { useCalendar } from "@/contexts/calendarContext";
import { useStock } from "@/contexts/stockContext";
import { useAuth } from "@/contexts/authContext";
const CustomCalendar = () => {
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
  const { loadStocks } = useStock();
  const calendarListRef = useRef<{ scrollToMonth: (date: string) => void }>(
    null
  ); //if i git it a date string like "2024-10-05", it scrolls to that month
  const hasInitialLoadedRef = useRef(false);
  const { user } = useAuth();
  useEffect(() => {
    // 월간 보기일 때, 그리고 ref가 연결되어 있을 때 스크롤 명령
    if (hasInitialLoadedRef.current) {
      if (!isWeekView && calendarListRef.current) {
        calendarListRef.current.scrollToMonth(selectedDate);
      }
      loadStocks();
    }
  }, [selectedDate, isWeekView]);

  // 초기 로드용 useEffect - user.price가 처음 로드될 때만
  //when user.price ===undifined, loadStocksFirebase function occur error
  useEffect(() => {
    if (user?.uid && user.price !== undefined && !hasInitialLoadedRef.current) {
      hasInitialLoadedRef.current = true;
      loadStocks();
    }
  }, [user?.uid, user?.price]);

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
          onDateChanged={changeSelectedDate} // update when user selects a new day
        >
          <WeekCalendar
            current={selectedDate}
            onDayPress={(day) => changeSelectedDate(day.dateString)}
            style={styles.weekCalendar}
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
          ref={calendarListRef}
          calendarHeight={320}
          current={selectedDate}
          onDayPress={(day) => changeSelectedDate(day.dateString)}
          horizontal
          pagingEnabled
          renderHeader={() => null}
          onVisibleMonthsChange={onVisibleMonthsChange}
          pastScrollRange={12}
          futureScrollRange={12}
          showScrollIndicator={false}
          style={styles.calendarList}
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
    paddingVertical: spacingY._5,
    backgroundColor: "white",
  },
  monthText: { fontSize: 22, fontWeight: "bold" },
  arrow: { padding: spacingX._5 },
  arrowText: {
    fontSize: verticalScale(30),
    color: colors.black,
    lineHeight: verticalScale(30),
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  weekCalendar: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  calendarList: {
    // For iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // For Android
    elevation: 3,
  },
});

export default CustomCalendar;
