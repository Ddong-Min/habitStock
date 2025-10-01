import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

interface Friend {
  name: string;
  amount: string;
  percentage: number;
  avatarColor: string;
}

interface FriendStockProps {
  friends?: Friend[];
}

const FriendStock: React.FC<FriendStockProps> = ({ friends }) => {
  const defaultFriends: Friend[] = [
    {
      name: "Ronaldo",
      amount: "5213",
      percentage: 5.12,
      avatarColor: "#E8E8E8",
    },
    {
      name: "Bruno",
      amount: "13242",
      percentage: 6.02,
      avatarColor: "#FFE4E4",
    },
    { name: "Cuna", amount: "4215", percentage: 15.23, avatarColor: "#FFE4F0" },
    {
      name: "Neymar",
      amount: "2314",
      percentage: 3.12,
      avatarColor: "#E8F0FE",
    },
    { name: "Messi", amount: "4213", percentage: 7.32, avatarColor: "#E8FEE8" },
  ];

  const displayFriends = friends || defaultFriends;

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
              <Typo style={styles.amount}>$ {friend.amount}</Typo>
              <Typo style={styles.percentage}>+{friend.percentage}%</Typo>
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
  amount: {
    fontSize: verticalScale(22),
    fontWeight: "700",
    color: colors.text,
  },
  percentage: {
    fontSize: verticalScale(18),
    fontWeight: "500",
    color: "#FF6B6B",
  },
});

export default FriendStock;
