// components/CustomDay.tsx
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { colors, radius } from "@/constants/theme";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";

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
      style={styles.container}
    >
      <View
        style={[
          styles.circle,
          { backgroundColor: isSelected ? colors.main : "transparent" },
        ]}
      >
        <Typo
          style={{
            color: isSelected ? "white" : isToday ? colors.main : "black",
            fontWeight: isSelected || isToday ? "700" : "400",
            fontSize: 15, // 날짜 폰트 크기를 약간 조절
          }}
        >
          {date.day}
        </Typo>
      </View>

      <Typo
        size={verticalScale(12)}
        color={colors.blue100}
        style={styles.percentageText}
      >
        ▲ {date.day * 2}%
      </Typo>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 2,
  },
  circle: {
    // 월간 보기에 맞게 원 크기를 조절합니다.
    width: 28,
    height: 28,
    borderRadius: 14, // width/height의 절반
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    // 폰트 크기와 마진을 줄여 전체 높이를 최소화합니다.
    fontSize: 9,
    marginTop: 2,
  },
});

export default CustomDay;
