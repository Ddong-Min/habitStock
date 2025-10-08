import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useAuth } from "@/contexts/authContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useFollow } from "@/contexts/followContext";
interface ProfileProps {
  type: "todo" | "stocks" | "news";
}

const Profile: React.FC<ProfileProps> = ({ type }) => {
  const { user } = useAuth();
  const { stockData, friendStockData } = useStock();
  const { today } = useCalendar();
  const { selectedFollowId, followingUsers } = useFollow();
  const [todayStock, setTodayStock] = useState(stockData?.[today]);
  const [name, setName] = useState(user?.name || "사용자");

  // selectedFollowId가 변경될 때마다 stockData와 user정보 업데이트
  useEffect(() => {
    if (selectedFollowId) {
      // 팔로우된 사용자의 stockData로 업데이트
      const followStock = friendStockData?.[selectedFollowId][today];
      const followUser = followingUsers.find(
        (user) => user?.uid === selectedFollowId
      );
      setName(followUser?.name || "사용자");
      setTodayStock(followStock);
    } else {
      // selectedFollowId가 없다면 기본 user 정보로 돌아가기
      setTodayStock(stockData?.[today]);
      setName(user?.name || "사용자");
    }
  }, [selectedFollowId, stockData, today]);

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
          size={type === "news" ? 28 : 22}
          fontWeight="bold"
          style={{ lineHeight: verticalScale(24) }}
        >
          {name}
        </Typo>
        {type !== "news" && (
          <View style={styles.stockInfo}>
            <Typo size={22} fontWeight="bold" style={{ marginRight: 8 }}>
              ₩{todayStock?.close!}
            </Typo>

            {type === "stocks" && (
              <Typo size={16} color={colors.neutral400} fontWeight={"500"}>
                어제보다{" "}
              </Typo>
            )}

            <Typo size={18} style={{ color: changeColor }}>
              {isPositive ? "▲" : isZero ? "-" : "▼"} {todayStock?.changePrice}{" "}
              ({todayStock?.changeRate}%)
            </Typo>
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

export default Profile;
