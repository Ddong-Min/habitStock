// components/CustomDay.tsx
import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "./Typo";
import { verticalScale, scale } from "@/utils/styling";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";
type CustomDayProps = {
  date: {
    dateString: string;
    day: number;
  };
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
};

const CustomDay: React.FC<CustomDayProps> = ({
  date,
  selectedDate,
  onDateSelect,
}) => {
  const { stockData } = useStock();
  const { today } = useCalendar();
  const { theme } = useTheme();

  if (!date) return null;

  const isToday = date.dateString === today;
  const isSelected = selectedDate === date.dateString;
  const isPositive = stockData?.[date.dateString]?.changeRate! > 0;
  const changePrice = stockData?.[date.dateString]?.changePrice ?? 0;
  const isNoChange = changePrice === 0;

  return (
    <TouchableOpacity
      onPress={() => onDateSelect(date.dateString)}
      style={styles.container}
    >
      <View
        style={[
          styles.circle,
          { backgroundColor: isSelected ? theme.blue100 : "transparent" },
        ]}
      >
        <Typo
          style={{
            color: isSelected
              ? theme.background
              : isToday
              ? theme.blue100
              : theme.text,
          }}
          size={22}
          fontWeight="bold"
        >
          {date.day}
        </Typo>
      </View>
      {date.dateString <= today && (
        <Typo
          size={10}
          color={
            isNoChange
              ? theme.neutral500
              : isPositive
              ? theme.red100
              : theme.blue100
          }
          style={styles.percentageText}
        >
          {isNoChange ? "- " : isPositive ? "▲" : "▼"}
          {stockData?.[date.dateString]?.changeRate}%
        </Typo>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 2,
  },
  circle: {
    width: spacingX._30,
    height: spacingX._30,
    borderRadius: radius._30,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {},
});

export default CustomDay;
