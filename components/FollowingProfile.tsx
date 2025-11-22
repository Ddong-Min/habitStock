import React from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";

interface FollowingProfileProps {
  followId?: string; // props로 받을 수 있도록 추가
}

const FollowingProfile: React.FC<FollowingProfileProps> = ({
  followId: propFollowId,
}) => {
  const { theme } = useTheme();
  const { friendStockData } = useStock();
  const { today } = useCalendar();
  const { selectedFollowId, followingUsers } = useFollow();

  // props로 받은 followId를 우선 사용, 없으면 context에서 가져오기
  const followId = propFollowId || selectedFollowId;

  // followId가 없으면 기본 UI 표시
  if (!followId) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.cardBackground }]}
      >
        <Typo color={theme.textLight}>사용자 정보를 불러올 수 없습니다</Typo>
      </View>
    );
  }

  // today가 없거나 유효하지 않으면 기본 UI 표시
  if (!today || typeof today !== "string") {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.cardBackground }]}
      >
        <Typo color={theme.textLight}>날짜 정보를 불러올 수 없습니다</Typo>
      </View>
    );
  }

  const followUser = followingUsers.find((user) => user?.uid === followId);
  const name = followUser?.name || "사용자";
  const image = followUser?.image || "https://via.placeholder.com/100";

  // 친구의 전체 주식 데이터를 가져옵니다.
  const friendsData = friendStockData?.[followId];

  // 오늘 날짜의 데이터를 우선적으로 찾습니다.
  let displayStock = friendsData?.[today];

  // 오늘 데이터가 없고, friendsData가 존재할 경우
  if (!displayStock && friendsData) {
    const availableDates = Object.keys(friendsData);

    if (availableDates.length > 0) {
      // 날짜를 정렬하여 가장 마지막(최신) 날짜를 찾습니다.
      const mostRecentDate = availableDates.sort().pop();

      if (mostRecentDate) {
        displayStock = friendsData[mostRecentDate];
      }
    }
  }

  const isPositive = (displayStock?.changePrice ?? 0) > 0;
  const isZero = (displayStock?.changePrice ?? 0) === 0;

  const changeColor = isPositive
    ? theme.red100
    : isZero
    ? theme.neutral500
    : theme.blue100;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: image }}
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
          {name}
        </Typo>

        <View style={styles.stockInfo}>
          <Typo
            size={18}
            fontWeight="600"
            color={theme.text}
            style={{ marginRight: 6, letterSpacing: -0.2 }}
          >
            ₩{displayStock?.close?.toLocaleString() ?? "0"}
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
              {isPositive ? "▲" : isZero ? "" : "▼"}{" "}
              {displayStock?.changePrice?.toLocaleString() ?? 0} (
              {displayStock?.changeRate ?? 0}%)
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

export default FollowingProfile;
