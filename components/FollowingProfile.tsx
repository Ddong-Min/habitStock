import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";

const FollowingProfile: React.FC = () => {
  const { friendStockData } = useStock();
  const { today } = useCalendar();
  const { selectedFollowId, followingUsers } = useFollow();
  const [name, setName] = useState<string>("사용자");
  const [todayStock, setTodayStock] = useState<any>(null);
  const { theme } = useTheme();
  // 팔로워 프로필 정보 업데이트
  useEffect(() => {
    if (selectedFollowId) {
      const followStock = friendStockData?.[selectedFollowId]?.[today];
      const followUser = followingUsers.find(
        (user) => user?.uid === selectedFollowId
      );
      setName(followUser?.name || "사용자");
      setTodayStock(followStock);
    }
  }, [selectedFollowId, friendStockData, today, followingUsers]);

  const isPositive = (todayStock?.changePrice ?? 0) > 0;
  const isZero = (todayStock?.changePrice ?? 0) === 0;
  const changeColor = isPositive
    ? colors.red100
    : isZero
    ? colors.neutral500
    : colors.blue100;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.avatarContainer}>
        <Image
          source={require("../assets/images/tempProfile.png")}
          style={[styles.avatar, { borderColor: theme.neutral200 }]}
        />
      </View>
      <View style={styles.userInfo}>
        <Typo
          size={26}
          fontWeight="600"
          color={theme.text}
          style={{ lineHeight: verticalScale(24), letterSpacing: -0.3 }}
        >
          {name || "사용자"}
        </Typo>

        <View style={styles.stockInfo}>
          <Typo
            size={20}
            fontWeight="600"
            color={theme.text}
            style={{ marginRight: 6, letterSpacing: -0.2 }}
          >
            ₩{todayStock?.close!}
          </Typo>

          <Typo size={15} color={theme.neutral400} fontWeight={"500"}>
            어제보다{" "}
          </Typo>

          <View
            style={[
              styles.changeBadge,
              { backgroundColor: `${changeColor}15` },
            ]}
          >
            <Typo size={15} fontWeight="500" style={{ color: changeColor }}>
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

export default FollowingProfile;
