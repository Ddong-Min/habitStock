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
  );
  const hasInitialLoadedRef = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    if (hasInitialLoadedRef.current) {
      if (!isWeekView && calendarListRef.current) {
        calendarListRef.current.scrollToMonth(selectedDate);
      }
      loadStocks();
    }
  }, [selectedDate, isWeekView]);

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
          <View style={styles.arrowContainer}>
            <TouchableOpacity onPress={handlePrevious} style={styles.arrow}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={handleNext} style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isWeekView ? (
        <CalendarProvider
          date={selectedDate}
          onDateChanged={changeSelectedDate}
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
    backgroundColor: "#FAFAFA",
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  monthText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
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
    backgroundColor: "#F8F8F8",
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
    color: "#1A1A1A",
    fontWeight: "300",
    lineHeight: 24,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#E8E8E8",
  },
  weekCalendar: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    backgroundColor: "#FFFFFF",
  },
  calendarList: {
    backgroundColor: "#FFFFFF",
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
