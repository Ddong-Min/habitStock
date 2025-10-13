import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, View } from "react-native";
import Profile from "@/components/Profile";
import FriendStock from "@/components/FriendStock";
import Typo from "@/components/Typo";
import { useStock } from "@/contexts/stockContext";
import { useFollow } from "@/contexts/followContext";
import FriendStockDetail from "@/components/FriendStockDetail";
import { useTheme } from "@/contexts/themeContext";

const Stock = () => {
  const { theme } = useTheme();
  const { stockData, stockTabType } = useStock();

  const { selectedFollowId, changeSelectedFollowId } = useFollow();

  if (!stockData) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Typo color={theme.text}>No stock data available</Typo>
      </View>
    );
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Profile type={stockTabType} />
      <CustomChart stockData={stockData} />
      <FriendStock />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Stock;
