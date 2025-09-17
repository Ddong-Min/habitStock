// components/CustomDay.tsx
import React from "react";
import { TouchableOpacity, Text, ViewStyle, TextStyle } from "react-native";
import { colors, radius, spacingX } from "@/constants/theme";

type CustomDayProps = {
  date: {
    dateString: string;
    day: number;
  };
  today: string;
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
};

const CustomDay: React.FC<CustomDayProps> = ({
  date,
  today,
  selectedDate,
  onDateSelect,
}) => {
  if (!date) return null;

  const isToday = date.dateString === today;
  const isSelected = selectedDate === date.dateString;

  return (
    <TouchableOpacity
      onPress={() => onDateSelect(date.dateString)}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: spacingX._35,
        height: spacingX._35,
        borderRadius: radius._30,
        backgroundColor: isSelected ? colors.main : "transparent",
      }}
    >
      <Text
        style={{
          color: isSelected ? "white" : isToday ? colors.main : "black",
          fontWeight: isSelected || isToday ? "700" : "400",
        }}
      >
        {date.day}
      </Text>

      {/* 원하는 데이터 (예: 날짜*2) */}
      <Text style={{ fontSize: 10, color: "blue" }}>▲{date.day * 2}%</Text>
    </TouchableOpacity>
  );
};

export default CustomDay;
