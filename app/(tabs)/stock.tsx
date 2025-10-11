import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import Profile from "@/components/Profile";
import FriendStock from "@/components/FriendStock";
import Typo from "@/components/Typo";
import { colors } from "../../constants/theme";
import { useState, useEffect } from "react";
import { spacingY, spacingX, radius } from "../../constants/theme";
import { useStock } from "@/contexts/stockContext";
import ToggleStockTab from "@/components/ToggleStockTab";
import NewsDetail from "@/components/NewsDetail";
import YearHeader from "@/components/YearHeader";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import FriendStockDetail from "@/components/FriendStockDetail";
import { useNews } from "@/contexts/newsContext";

const Stock = () => {
  const {
    stockData,
    selectedPeriod,
    changeSelectedPeriod,
    stockTabType,
  } = useStock();

  const { selectedFollowId, changeSelectedFollowId } = useFollow();

  if (!stockData) {
    return <Typo>No stock data available</Typo>;
  }

  if (selectedFollowId) {
    return (
      <FriendStockDetail
        followId={selectedFollowId}
        onBack={() => changeSelectedFollowId(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral50 }}>
      <Profile type={stockTabType} />
      {/* <ToggleStockTab /> */}

      {stockTabType === "stocks" && (
        <>
          <CustomChart stockData={stockData} />
          <View style={styles.periodContainer}>
            <View style={styles.periodButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "day" && styles.periodButtonActive,
                ]}
                onPress={() => changeSelectedPeriod("day")}
                activeOpacity={0.7}
              >
                <Typo
                  size={14}
                  fontWeight="600"
                  color={
                    selectedPeriod === "day" ? colors.white : colors.neutral500
                  }
                  style={{ letterSpacing: -0.2 }}
                >
                  일
                </Typo>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "week" && styles.periodButtonActive,
                ]}
                onPress={() => changeSelectedPeriod("week")}
                activeOpacity={0.7}
              >
                <Typo
                  size={14}
                  fontWeight="600"
                  color={
                    selectedPeriod === "week" ? colors.white : colors.neutral500
                  }
                  style={{ letterSpacing: -0.2 }}
                >
                  주
                </Typo>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "month" && styles.periodButtonActive,
                ]}
                onPress={() => changeSelectedPeriod("month")}
                activeOpacity={0.7}
              >
                <Typo
                  size={14}
                  fontWeight="600"
                  color={
                    selectedPeriod === "month"
                      ? colors.white
                      : colors.neutral500
                  }
                  style={{ letterSpacing: -0.2 }}
                >
                  월
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
          <FriendStock />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  periodContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._12,
  },
  periodButtonContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral100,
    borderRadius: 10,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacingY._7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
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
export default Stock;
