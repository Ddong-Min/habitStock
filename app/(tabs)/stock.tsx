import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Profile from "@/components/Profile";
import FriendStock from "@/components/FriendStock";
import Typo from "@/components/Typo";
import { colors } from "../../constants/theme";
import { useState } from "react";
import { spacingY, spacingX, radius } from "../../constants/theme";
import { useStock } from "@/contexts/stockContext";

const Stock = () => {
  const { selectedPeriod, changeSelectedPeriod } = useStock();
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Profile type="stock" />
      <CustomChart />
      <View style={styles.periodButtonContainer}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "day" && styles.periodButtonActive,
          ]}
          onPress={() => changeSelectedPeriod("day")}
        >
          <Typo color={selectedPeriod === "day" ? colors.white : colors.text}>
            일
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "week" && styles.periodButtonActive,
          ]}
          onPress={() => changeSelectedPeriod("week")}
        >
          <Typo color={selectedPeriod === "week" ? colors.white : colors.text}>
            주
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "month" && styles.periodButtonActive,
          ]}
          onPress={() => changeSelectedPeriod("month")}
        >
          <Typo color={selectedPeriod === "month" ? colors.white : colors.text}>
            월
          </Typo>
        </TouchableOpacity>
      </View>
      <FriendStock />
    </View>
  );
};

const styles = StyleSheet.create({
  periodButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._25,
    gap: spacingX._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.sub,
  },
  periodButton: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._7,
    borderRadius: radius._10,
    backgroundColor: colors.neutral100,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: colors.blue100,
  },
});
export default Stock;
