import { Defs, LinearGradient, Stop } from "react-native-svg";
import {
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import React from "react";
import { useFollow } from "@/contexts/followContext";
import { useTheme } from "@/contexts/themeContext";
import { useStock } from "@/contexts/stockContext";
import { radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { LineChart } from "react-native-chart-kit";
import { verticalScale } from "@/utils/styling";
import { useCalendar } from "@/contexts/calendarContext";

const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth * 0.22; // 화면 너비의 22%로 설정
const chartHeight = spacingY._70;

const FriendStock = ({ item }: { item: any }) => {
  const { theme } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    followingUsers,
    toggleFollow,
    isFollowing,
    selectedFollowId,
    changeSelectedFollowId,
  } = useFollow();
  const { friendStockData, loadAllFriendStocksData } = useStock();
  const { today } = useCalendar();
  const following = isFollowing(item.uid);
  const friendStock = friendStockData[item.uid] || {};
  const closeValues = Object.values(friendStock)
    .sort((a, b) => a.date.localeCompare(b.date))
    .splice(-7) // 최근 7일 데이터
    .map((data) => Number(data?.close) || 0);

  // 기준선이 될 7일 전 날짜 계산
  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - 6);

  const firstDayKey = firstDay.toISOString().split("T")[0];

  // 7일 전 'open' 값이 없으면 100을 기본값으로 사용
  const firstDayOpen = friendStock[firstDayKey]?.open || 100;

  const weeklyChange = (
    ((friendStock[today]?.close - firstDayOpen) / firstDayOpen) *
    100
  ).toFixed(2);
  // --- 그라데이션 로직 시작 ---
  const gradientId = `threshold-gradient-${item.uid}`;
  let thresholdPercent = 0.5;
  if (closeValues.length > 1) {
    const allValues = [...closeValues, firstDayOpen];
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    let dataRange = dataMax - dataMin;
    if (dataRange === 0) {
      dataRange = 1;
    }
    thresholdPercent = 1 - (firstDayOpen - dataMin) / dataRange;
    thresholdPercent = Math.max(0, Math.min(1, thresholdPercent));
  }
  const GradientDecorator = () => (
    <Defs key={gradientId}>
      <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="100%">
        <Stop offset="0%" stopColor={theme.red100} />
        <Stop offset={thresholdPercent} stopColor={theme.red100} />
        <Stop offset={thresholdPercent} stopColor={theme.blue100} />
        <Stop offset="100%" stopColor={theme.blue100} />
      </LinearGradient>
    </Defs>
  );
  // --- 그라데이션 로직 끝 ---

  return (
    <TouchableOpacity
      onPress={() => changeSelectedFollowId(item.uid)}
      activeOpacity={0.7}
      style={[styles.userCard, { backgroundColor: theme.cardBackground }]}
    >
      {/* 왼쪽: 사용자 정보 (flex: 1) */}
      <View style={styles.leftSection}>
        <Image
          source={{
            uri: item.image || "https://via.placeholder.com/60",
          }}
          style={[styles.avatar, { backgroundColor: theme.neutral200 }]}
        />
        <View style={styles.userInfo}>
          <Typo
            color={theme.text}
            style={styles.userName}
            fontWeight={"600"}
            size={20}
            numberOfLines={2}
          >
            {item.name}
          </Typo>
        </View>
      </View>

      {/* 오른쪽: 차트 또는 팔로우 버튼 (flex: 2)
          4. Follow 버튼을 rightSelection 안으로 이동시켜 레이아웃 일관성 유지
        */}
      <View style={styles.rightSelection}>
        {following ? (
          <>
            {closeValues.length > 1 ? (
              <View style={styles.chartSection}>
                <LineChart
                  data={{
                    labels: [],
                    datasets: [
                      {
                        data: closeValues,
                        strokeWidth: 2,
                        color: (opacity = 1) => `url(#${gradientId})`,
                      },
                      {
                        data: Array(closeValues.length).fill(firstDayOpen),
                        color: (opacity = 1) => theme.neutral300,
                        strokeWidth: 1,
                        withDots: false,
                      },
                    ],
                  }}
                  // 5. 계산된 픽셀 값을 prop으로 전달
                  width={chartWidth}
                  height={chartHeight}
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLabels={false}
                  withHorizontalLabels={false}
                  decorator={GradientDecorator}
                  chartConfig={{
                    backgroundGradientFrom: theme.cardBackground,
                    backgroundGradientTo: theme.cardBackground,
                    color: (opacity = 1) => theme.cardBackground,
                    strokeWidth: 2,
                    propsForBackgroundLines: {
                      strokeWidth: 0,
                    },
                  }}
                  bezier
                  style={{
                    marginLeft: -chartWidth * 0.1, // ✅ 좌측 여백 강제로 제거
                    paddingRight: 0,
                  }}
                />
              </View>
            ) : (
              <View style={[styles.chartSection, styles.chartEmpty]}>
                {/* 데이터가 부족하여 차트를 그리지 않음 */}
              </View>
            )}
            <View style={styles.weeklyChange}>
              <Typo
                size={18}
                color={theme.text}
                style={styles.weeklyChangeText}
              >
                {item.price}원
              </Typo>
              <Typo color={theme.textLight} style={styles.weeklyChangeText}>
                7d Change
              </Typo>
              <View
                style={[
                  styles.changeBadge,
                  {
                    backgroundColor:
                      Number(weeklyChange) > 0
                        ? `${theme.red100}20`
                        : Number(weeklyChange) === 0
                        ? `${theme.textLight}20`
                        : `${theme.blue100}20`,
                  },
                ]}
              >
                <Typo
                  size={14}
                  color={
                    Number(weeklyChange) > 0
                      ? theme.red100
                      : Number(weeklyChange) === 0
                      ? theme.text
                      : theme.blue100
                  }
                  style={{ lineHeight: verticalScale(14) }}
                >
                  {weeklyChange}%
                </Typo>
              </View>
            </View>
          </>
        ) : (
          // 팔로우 버튼
          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: theme.blue100 }]}
            onPress={() => toggleFollow(item.uid)}
          >
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default FriendStock;

const styles = StyleSheet.create({
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    //overflow: "hidden",
  },
  avatar: {
    width: spacingX._40,
    height: spacingX._40,
    borderRadius: radius._40,
    marginRight: 12,
  },
  userInfo: {
    //flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  userName: {
    marginRight: spacingX._3,
    lineHeight: verticalScale(20),
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  priceChangeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceChange: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  priceChangePercent: {
    fontSize: 12,
    fontWeight: "600",
  },
  rightSelection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // 컨텐츠를 오른쪽으로 정렬
  },
  chartSection: {
    height: chartHeight,
  },
  chartEmpty: {
    height: chartHeight,
  },
  changeBadge: {
    paddingHorizontal: spacingX._3,
    paddingVertical: spacingY._5,
    borderRadius: radius._10,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    // marginLeft 제거
  },
  followBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  weeklyChange: {
    marginTop: 4,
  },
  weeklyChangeText: {
    marginBottom: verticalScale(6),
  },
});
