import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
} from "react";
import {
  format,
  addMonths,
  addWeeks,
  startOfMonth,
  getDay,
  getDate,
} from "date-fns";

// --- Step 1: Define the shape of the context data ---
// This interface describes all the values and functions that our context will provide.
interface CalendarContextType {
  today: string;
  selectedDate: string;
  isWeekView: boolean;
  headerText: string;
  getWeekOfMonth: (date: Date) => number;
  handleNext: () => void;
  handlePrevious: () => void;
  handleViewToggle: (mode: "week" | "month") => void;
  onVisibleMonthsChange: (months: any[]) => void; // Using 'any' as in the original hook
  changeSelectedDate: (dateString: string) => void;
}

// --- Step 2: Create the Context ---
// We initialize it with `undefined`. We'll handle this case in our custom hook.
const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

// --- Step 3: Create the Provider Component ---
// This component will wrap your app or a part of it, providing the calendar state
// and logic to all children components.
export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [isWeekView, setIsWeekView] = useState(false);

  // All the logic from your original hook is moved inside the provider.
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const currentDate = new Date(selectedDate);

  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = startOfMonth(date);
    const firstDayOfWeek = getDay(firstDayOfMonth);
    const dayOfMonth = getDate(date);
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  };

  // Header text: "2025년 09월" for month view, "2025년 09월 4주차" for week view
  const headerText = isWeekView
    ? `${format(currentDate, "yyyy년 MM월")} ${getWeekOfMonth(currentDate)}주차`
    : format(currentDate, "yyyy년 MM월");

  const handleNext = () => {
    const newDate = isWeekView
      ? addWeeks(currentDate, 1)
      : addMonths(currentDate, 1);
    setSelectedDate(format(newDate, "yyyy-MM-dd"));
  };

  const handlePrevious = () => {
    const newDate = isWeekView
      ? addWeeks(currentDate, -1)
      : addMonths(currentDate, -1);
    setSelectedDate(format(newDate, "yyyy-MM-dd"));
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
        setSelectedDate(format(newCurrentDate, "yyyy-MM-dd"));
      }
    }
  };

  const changeSelectedDate = (dateString: string) => {
    setSelectedDate(dateString);
  };

  // Memoize the context value to prevent unnecessary re-renders of consuming components.
  const value = useMemo(
    () => ({
      today,
      selectedDate,
      isWeekView,
      headerText,
      getWeekOfMonth,
      handleNext,
      handlePrevious,
      handleViewToggle,
      onVisibleMonthsChange,
      changeSelectedDate,
    }),
    [selectedDate, isWeekView, headerText] // Dependencies for the useMemo
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

// --- Step 4: Create a custom hook for easy consumption ---
// This hook simplifies accessing the context and includes a safety check.
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    // This error will be thrown if you try to use the context
    // outside of its provider, which helps catch bugs early.
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};
