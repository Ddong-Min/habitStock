// components/CustomDay.tsx
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
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
          }}
          size={verticalScale(24)}
          fontWeight="bold"
        >
          {date.day}
        </Typo>
      </View>

      <Typo
        size={verticalScale(15)}
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
    width: spacingX._30,
    height: spacingX._30,
    borderRadius: radius._30, // width/height의 절반
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    marginTop: spacingY._3,
  },
});

export default CustomDay;
