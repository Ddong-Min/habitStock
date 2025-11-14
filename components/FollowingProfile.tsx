import React from "react"; // ❌ useEffect, useState 제거
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";

const FollowingProfile: React.FC = () => {
  const { theme } = useTheme();
  const { friendStockData } = useStock();
  const { today } = useCalendar();
  const { selectedFollowId, followingUsers } = useFollow();

  const followUser = followingUsers.find(
    (user) => user?.uid === selectedFollowId
  );
  const name = followUser?.name || "사용자";
  const image = followUser?.image || "https://via.placeholder.com/100";

  // --- ✅ [수정] 오늘 데이터가 없으면 가장 최근 데이터를 찾도록 로직 변경 ---

  // 1. 친구의 전체 주식 데이터를 가져옵니다.
  const friendsData = selectedFollowId
    ? friendStockData?.[selectedFollowId]
    : undefined;

  // 2. 오늘 날짜의 데이터를 우선적으로 찾습니다.
  let displayStock = friendsData?.[today];

  // 3. 오늘 데이터가 없고(undefined), friendsData가 존재할 경우
  if (!displayStock && friendsData) {
    // 4. 데이터가 있는 모든 날짜의 키를 가져옵니다.
    const availableDates = Object.keys(friendsData);

    if (availableDates.length > 0) {
      // 5. 날짜를 정렬하여 가장 마지막(최신) 날짜를 찾습니다.
      // (날짜 형식이 "YYYY-MM-DD"이므로 문자열 정렬이 가능합니다)
      const mostRecentDate = availableDates.sort().pop();

      if (mostRecentDate) {
        // 6. 가장 최신 날짜의 데이터를 displayStock으로 사용합니다.
        // (이 데이터는 '오늘'의 가격 변동이 아닌, '해당 날짜'의 변동을 보여줍니다)
        displayStock = friendsData[mostRecentDate];
      }
    }
  }
  // --- ✅ 로직 수정 완료 ---

  // 7. 'todayStock' 대신 'displayStock' 변수를 사용합니다.
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
          size={20}
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
            {/* 'displayStock' 사용 */}₩
            {displayStock?.close?.toLocaleString() ?? "0"}
          </Typo>

          <Typo size={15} color={theme.neutral400} fontWeight={"500"}>
            {/* '오늘'이 아닐 수 있으므로 "어제보다" 문구를 "변동"으로 변경하거나 유지 */}
            어제보다{" "}
          </Typo>

          <View
            style={[
              styles.changeBadge,
              { backgroundColor: `${changeColor}15` },
            ]}
          >
            <Typo size={15} fontWeight="500" style={{ color: changeColor }}>
              {/* 'displayStock' 사용 */}
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

// 스타일은 UserProfile과 동일하게 유지
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
