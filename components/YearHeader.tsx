import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useCalendar } from "@/contexts/calendarContext";
import Typo from "./Typo";
import { colors, spacingY, spacingX } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useTheme } from "@/contexts/themeContext";
import { useNews } from "@/contexts/newsContext";

const YearHeader = ({ year, style }: { year: string; style?: ViewStyle }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { selectedYear, setSelectedYear, years } = useNews();

  return (
    <View style={{ position: "relative", ...style }}>
      {/* 현재 연도 버튼 */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.currentYearButton,
          {
            backgroundColor: theme.neutral100,
          },
        ]}
        activeOpacity={0.7}
      >
        <Typo size={22} fontWeight="700" color={theme.text}>
          {selectedYear}년
        </Typo>
        <Typo
          size={14}
          fontWeight="600"
          color={theme.textLight}
          //style={[expanded && styles.arrowUp]}
        >
          ▼
        </Typo>
      </TouchableOpacity>

      {/* 드롭다운 */}
      {expanded && (
        <>
          {/* 배경 오버레이 */}
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setExpanded(false)}
            activeOpacity={1}
          />
          {/* 드롭다운 메뉴 */}
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.neutral200,
                shadowColor: theme.text,
              },
            ]}
          >
            <ScrollView
              style={styles.scroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {years.map((y, index) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.item,
                    index !== years.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.neutral100,
                    },
                  ]}
                  onPress={() => {
                    setSelectedYear(y);
                    setExpanded(false);
                  }}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.itemContent,
                      y === selectedYear && {
                        backgroundColor: `${theme.blue100}15`,
                      },
                    ]}
                  >
                    <Typo
                      size={16}
                      fontWeight={y === selectedYear ? "700" : "500"}
                      color={y === selectedYear ? theme.blue100 : theme.text}
                    >
                      {y}년
                    </Typo>
                    {y === selectedYear && (
                      <Typo size={18} color={theme.blue100}>
                        ✓
                      </Typo>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  currentYearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._17,
    paddingVertical: spacingY._10,
    borderRadius: 12,
    gap: spacingX._7,
    alignSelf: "flex-start",
  },
  arrowUp: {
    transform: [{ rotate: "180deg" }],
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 998,
  },
  dropdown: {
    position: "absolute",
    top: spacingY._50,
    left: 0,
    maxHeight: verticalScale(280),
    width: verticalScale(140),
    borderWidth: 1,
    borderRadius: 16,
    zIndex: 999,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: "hidden",
  },
  scroll: {
    flexGrow: 0,
  },
  item: {
    width: "100%",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._15,
  },
});

export default YearHeader;
