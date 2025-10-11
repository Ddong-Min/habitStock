import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useAuth } from "@/contexts/authContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";

interface ProfileProps {
  type: "todo" | "stocks" | "news";
}

const Profile: React.FC<ProfileProps> = ({ type }) => {
  const { user } = useAuth();
  const { stockData } = useStock();
  const { today } = useCalendar();

  const todayStock = stockData?.[today];
  const isPositive = (todayStock?.changePrice ?? 0) > 0;
  const isZero = (todayStock?.changePrice ?? 0) === 0;
  const changeColor = isPositive
    ? colors.red100
    : isZero
    ? colors.neutral500
    : colors.blue100;

  return (
    <View style={[styles.container]}>
      <View style={styles.avatarContainer}>
        <Image
          source={require("../assets/images/tempProfile.png")}
          style={styles.avatar}
        />
      </View>
      <View style={styles.userInfo}>
        <Typo
          size={type === "news" ? 26 : 20}
          fontWeight="600"
          style={{ lineHeight: verticalScale(24), letterSpacing: -0.3 }}
        >
          {user?.name || "사용자"}
        </Typo>
        {type !== "news" && (
          <View style={styles.stockInfo}>
            <Typo
              size={20}
              fontWeight="600"
              style={{ marginRight: 6, letterSpacing: -0.2 }}
            >
              ₩{todayStock?.close!}
            </Typo>

            {type === "stocks" && (
              <Typo size={15} color={colors.neutral400} fontWeight={"500"}>
                어제보다{" "}
              </Typo>
            )}

            <View
              style={[
                styles.changeBadge,
                { backgroundColor: `${changeColor}15` },
              ]}
            >
              <Typo size={15} fontWeight="500" style={{ color: changeColor }}>
                {isPositive ? "▲" : isZero ? "" : "▼"} {todayStock?.changePrice}{" "}
                ({todayStock?.changeRate}%)
              </Typo>
            </View>
          </View>
        )}
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
    backgroundColor: colors.white,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: radius._30,
  },
  avatar: {
    width: spacingX._50,
    height: spacingX._50,
    borderRadius: radius._30,
    marginRight: spacingX._15,
    borderWidth: 2,
    borderColor: colors.neutral100,
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

export default Profile;
