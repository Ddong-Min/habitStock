import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";

const FollowingProfile: React.FC = () => {
  const { friendStockData } = useStock();
  const { today } = useCalendar();
  const { selectedFollowId, followingUsers } = useFollow();
  const [name, setName] = useState<string>("사용자");
  const [todayStock, setTodayStock] = useState<any>(null);

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
    <View style={[styles.container]}>
      <Image
        source={require("../assets/images/tempProfile.png")}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Typo
          size={22}
          fontWeight="bold"
          style={{ lineHeight: verticalScale(24) }}
        >
          {name}
        </Typo>
        <View style={styles.stockInfo}>
          <Typo size={22} fontWeight="bold" style={{ marginRight: 8 }}>
            ₩{todayStock?.close!}
          </Typo>

          <Typo size={18} style={{ color: changeColor }}>
            {isPositive ? "▲" : isZero ? "-" : "▼"} {todayStock?.changePrice} (
            {todayStock?.changeRate}%)
          </Typo>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacingY._10,
    paddingLeft: spacingX._20,
    backgroundColor: colors.white,
    marginHorizontal: spacingX._10,
  },
  avatar: {
    width: spacingX._50,
    height: spacingX._50,
    borderRadius: radius._30,
    marginRight: spacingX._15,
  },
  userInfo: {
    flex: 1,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});

export default FollowingProfile;
