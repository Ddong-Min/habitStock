import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";

type ToggleMode = "todo" | "bucket";

interface ToggleProps {
  onToggle: (mode: ToggleMode) => void;
}

const Toggle: React.FC<ToggleProps> = ({ onToggle }) => {
  const [activeTab, setActiveTab] = useState<ToggleMode>("todo");

  const handlePress = (mode: ToggleMode) => {
    setActiveTab(mode);
    onToggle(mode);
  };

  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          activeTab === "todo" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("todo")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            activeTab === "todo" ? styles.activeButtonText : styles.buttonText
          }
        >
          할일
        </Typo>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          activeTab === "bucket" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("bucket")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            activeTab === "bucket" ? styles.activeButtonText : styles.buttonText
          }
        >
          목표
        </Typo>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._40,
    borderBottomWidth: 1,
    borderBottomColor: colors.sub,
    backgroundColor: colors.white,
  },
  toggleButton: {
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._50,
  },
  activeButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.main,
  },
  buttonText: {
    color: colors.sub,
  },
  activeButtonText: {
    color: colors.main,
  },
});

export default Toggle;
