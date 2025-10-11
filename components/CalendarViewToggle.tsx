import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typo from "./Typo";
import { colors, spacingX, spacingY, radius } from "../constants/theme";

type ViewMode = "week" | "month";

interface CalendarViewToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const CalendarViewToggle: React.FC<CalendarViewToggleProps> = ({
  viewMode,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "week" && styles.activeButton,
          ]}
          onPress={() => onToggle("week")}
          activeOpacity={0.7}
        >
          <Typo
            size={14}
            fontWeight="600"
            color={viewMode === "week" ? colors.black : colors.neutral500}
            style={{ letterSpacing: -0.2 }}
          >
            주
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "month" && styles.activeButton,
          ]}
          onPress={() => onToggle("month")}
          activeOpacity={0.7}
        >
          <Typo
            size={14}
            fontWeight="600"
            color={viewMode === "month" ? colors.black : colors.neutral500}
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
    backgroundColor: colors.white,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral100,
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
    backgroundColor: colors.white,
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
