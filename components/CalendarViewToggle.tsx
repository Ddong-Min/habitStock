import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typo from "./Typo";
import { spacingX, spacingY } from "../constants/theme";
import { useTheme } from "@/contexts/themeContext";

type ViewMode = "week" | "month";

interface CalendarViewToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const CalendarViewToggle: React.FC<CalendarViewToggleProps> = ({
  viewMode,
  onToggle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View
        style={[styles.toggleContainer, { backgroundColor: theme.neutral100 }]}
      >
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "week" && [
              styles.activeButton,
              { backgroundColor: theme.cardBackground },
            ],
          ]}
          onPress={() => onToggle("week")}
          activeOpacity={0.7}
        >
          <Typo
            size={14}
            fontWeight="600"
            color={viewMode === "week" ? theme.text : theme.neutral500}
            style={{ letterSpacing: -0.2 }}
          >
            주
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "month" && [
              styles.activeButton,
              { backgroundColor: theme.cardBackground },
            ],
          ]}
          onPress={() => onToggle("month")}
          activeOpacity={0.7}
        >
          <Typo
            size={14}
            fontWeight="600"
            color={viewMode === "month" ? theme.text : theme.neutral500}
            style={{ letterSpacing: -0.2 }}
          >
            월
          </Typo>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default CalendarViewToggle;
