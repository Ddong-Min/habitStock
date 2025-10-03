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

const YearHeader = ({ year, style }: { year: string; style?: ViewStyle }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState(parseInt(year));

  const years = Array.from({ length: 21 }, (_, i) => selectedYear - 10 + i);
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
                  setSelectedYear(y);
                  setExpanded(false);
                }}
              >
                <Text
                  style={[
                    styles.itemText,
                    y === selectedYear && styles.selectedText,
                  ]}
                >
                  {y}년
                </Text>
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
    top: 40, // 현재 연도 아래에 뜨게
    left: 0,
    right: 0,
    maxHeight: 200, // 스크롤 가능하도록 제한
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
    padding: 12,
  },
  itemText: {
    fontSize: 18,
  },
  selectedText: {
    fontWeight: "700",
    color: "blue",
  },
});

export default YearHeader;
