// YearHeader.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useCalendar } from "@/contexts/calendarContext";
import Typo from "./Typo";
import { colors, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

const YearHeader = ({ year, style }: { year: string; style?: ViewStyle }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState(parseInt(year));

  const years = Array.from([
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  ]);
  const { changeSelectedDate } = useCalendar();
  return (
    <View style={{ position: "relative", ...style }}>
      {/* 현재 연도 */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.currentYear}>{selectedYear}년 ▼</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.scroll} nestedScrollEnabled>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={styles.item}
                onPress={() => {
                  changeSelectedDate(`${y}`);
                  setSelectedYear(y);
                  setExpanded(false);
                }}
              >
                <Typo
                  size={24}
                  style={y === selectedYear ? { ...styles.selectedText } : {}}
                >
                  {y}년
                </Typo>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  currentYear: {
    fontSize: 24,
    fontWeight: "700",
  },
  dropdown: {
    position: "absolute", // 다른 애들 밀지 않고 겹침
    top: spacingY._40, // 현재 연도 아래에 뜨게
    left: 0,
    right: 0,
    maxHeight: verticalScale(200), // 스크롤 가능하도록 제한
    width: verticalScale(100),
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    zIndex: 9999,
    elevation: 5, // Android 그림자
  },
  scroll: {
    flexGrow: 0, // 스크롤이 동작하려면 높이 고정 필요
  },
  item: {
    padding: spacingY._12,
  },
  selectedText: {
    fontWeight: "700",
    color: colors.main,
  },
});

export default YearHeader;
