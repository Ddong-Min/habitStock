import React, { useState } from "react";
import {
  format,
  addMonths,
  addWeeks,
  getDate, //return day of month (ex. if date is 2024-10-05, return 5)
  startOfMonth, //return first day of month (ex. if date is 2024-10-05, return 2024-10-01)
  getDay, //return day of week (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
} from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

export const useCalenderHook = () => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isWeekView, setIsWeekView] = useState(true);
  const currentDate = new Date(selectedDate);

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

  // 주간모드 : 2025년 09월 4주차 형식
  // 월간모드 : 2025년 09월 형식
  const headerText = isWeekView
    ? `${format(currentDate, "yyyy년 MM월")} ${getWeekOfMonth(currentDate)}주차`
    : format(currentDate, "yyyy년 MM월");

  // 달력 다음달로 넘기기기
  const handleNext = () => {
    const newDate = isWeekView
      ? addWeeks(currentDate, 1)
      : addMonths(currentDate, 1);
    setSelectedDate(format(newDate, "yyyy-MM-dd"));
  };

  //달력 이전달로 넘기기
  const handlePrevious = () => {
    const newDate = isWeekView
      ? addWeeks(currentDate, -1)
      : addMonths(currentDate, -1);
    setSelectedDate(format(newDate, "yyyy-MM-dd"));
  };

  //week or month view toggle
  const handleViewToggle = (mode: "week" | "month") => {
    setIsWeekView(mode === "week");
  };

  //화면에 보이는 달이 바뀔 때 호출되는 함수
  const onVisibleMonthsChange = (months: any[]) => {
    if (months.length > 0 && !isWeekView) {
      const newCurrentDate = new Date(months[0].dateString);
      if (
        format(newCurrentDate, "yyyy-MM") !== format(currentDate, "yyyy-MM")
      ) {
        setSelectedDate(format(newCurrentDate, "yyyy-MM-dd"));
      }
    }
  };

  //사용자가 날짜 선택했을 때 호출되는 함수
  const changeSelectedDate = (dateString: string) => {
    setSelectedDate(dateString);
  };

  return {
    today,
    selectedDate,
    isWeekView,
    getWeekOfMonth,
    headerText,
    handleNext,
    handlePrevious,
    handleViewToggle,
    onVisibleMonthsChange,
    changeSelectedDate,
  };
};
