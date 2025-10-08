import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useStock } from "@/contexts/stockContext";

type ToggleMode = "stocks" | "news";

const ToggleStockTab: React.FC<{}> = () => {
  const { stockTabType, changeStockTabType } = useStock();
  const handlePress = (mode: ToggleMode) => {
    if (stockTabType === mode) return; // 이미 선택된 모드면 아무 작업도 하지 않음
    changeStockTabType(mode);
  };

  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          stockTabType === "stocks" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("stocks")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            stockTabType === "stocks"
              ? styles.activeButtonText
              : styles.buttonText
          }
        >
          차트
        </Typo>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          stockTabType === "news" ? styles.activeButton : {},
        ]}
        onPress={() => handlePress("news")}
      >
        <Typo
          size={20}
          fontWeight="bold"
          style={
            stockTabType === "news"
              ? styles.activeButtonText
              : styles.buttonText
          }
        >
          뉴스
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

export default ToggleStockTab;
