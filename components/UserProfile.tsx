import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useAuth } from "@/contexts/authContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";

const UserProfile: React.FC<{}> = ({}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { stockData } = useStock();
  const { today } = useCalendar();

  const todayStock = stockData?.[today];
  const isPositive = (todayStock?.changePrice ?? 0) > 0;
  const isZero = (todayStock?.changePrice ?? 0) === 0;
  const changeColor = isPositive
    ? theme.red100
    : isZero
    ? theme.neutral500
    : theme.blue100;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: user?.image || "https://via.placeholder.com/100" }}
          style={[styles.avatar, { borderColor: theme.neutral200 }]}
        />
      </View>
      <View style={styles.userInfo}>
        <Typo
          size={18}
          fontWeight="600"
          color={theme.text}
          style={{ lineHeight: verticalScale(24), letterSpacing: -0.3 }}
        >
          {user?.name || "사용자"}
        </Typo>

        <View style={styles.stockInfo}>
          <Typo
            size={18}
            fontWeight="600"
            color={theme.text}
            style={{ marginRight: 6, letterSpacing: -0.2 }}
          >
            ₩{todayStock?.close!}
          </Typo>

          <Typo size={12} color={theme.neutral400} fontWeight={"500"}>
            어제보다{" "}
          </Typo>

          <View
            style={[
              styles.changeBadge,
              { backgroundColor: `${changeColor}15` },
            ]}
          >
            <Typo size={12} fontWeight="500" style={{ color: changeColor }}>
              {isPositive ? "▲" : isZero ? "" : "▼"} {todayStock?.changePrice} (
              {todayStock?.changeRate}%)
            </Typo>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    marginHorizontal: spacingX._10,
    marginVertical: spacingY._7,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    borderRadius: radius._100,
  },
  avatar: {
    width: spacingX._60,
    height: spacingX._60,
    borderRadius: radius._100,
    marginRight: spacingX._15,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

export default UserProfile;
