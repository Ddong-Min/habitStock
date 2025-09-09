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
        >
          <Typo
            size={14}
            fontWeight="600"
            color={viewMode === "week" ? colors.white : colors.textLight}
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
        >
          <Typo
            size={14}
            fontWeight="600"
            color={viewMode === "month" ? colors.white : colors.textLight}
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
    borderRadius: radius._10,
    padding: spacingX._3,
  },
  toggleButton: {
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._12,
    borderRadius: radius._10,
  },
  activeButton: {
    backgroundColor: colors.main,
  },
});

export default CalendarViewToggle;
