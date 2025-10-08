import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
const FriendStock: React.FC<{}> = () => {
  const { followingUsers } = useFollow();
  const { friendStockData } = useStock();
  const { today } = useCalendar();
  const friends = followingUsers.map((user) => ({
    name: user!.name || "Unknown",
    price: user!.price || 0, // 임의의 금액
    percentage: friendStockData[user!.uid][today].changeRate || 0,
    avatarColor: "#E8E8E8", // 기본 색상
    changePrice: friendStockData[user!.uid][today].changePrice || 0,
  }));
  const displayFriends = friends;
  console.log("Displaying friends:", displayFriends);
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {displayFriends.map((friend, index) => (
          <TouchableOpacity key={index} style={styles.friendItem}>
            <View style={styles.leftSection}>
              <View
                style={[styles.avatar, { backgroundColor: friend.avatarColor }]}
              ></View>
              <Typo style={styles.name}>{friend.name}</Typo>
            </View>

            <View style={styles.rightSection}>
              <Typo style={styles.price}>$ {friend.price}</Typo>
              <Typo
                color={
                  friend.changePrice > 0
                    ? colors.red100
                    : friend.changePrice === 0
                    ? colors.neutral500
                    : colors.blue100
                }
                style={styles.percentage}
              >
                {friend.changePrice > 0
                  ? "▲"
                  : friend.changePrice === 0
                  ? "-"
                  : "▼"}{" "}
                {friend.percentage ? friend.percentage : 0}%
              </Typo>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._12,
    marginHorizontal: spacingX._25,
    borderBottomWidth: 2,
    borderBottomColor: colors.sub,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  avatar: {
    width: spacingX._40,
    height: spacingX._40,
    borderRadius: radius._30,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: verticalScale(24),
    fontWeight: "600",
    color: colors.text,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: spacingY._5,
  },
  price: {
    fontSize: verticalScale(22),
    fontWeight: "700",
    color: colors.text,
  },
  percentage: {
    fontSize: verticalScale(18),
    fontWeight: "500",
  },
});

export default FriendStock;
