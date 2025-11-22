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
import { useAuth } from "@/contexts/authContext"; // ✅ [추가] useAuth 훅 import
// --- [제거] ---
// import { useStock } from "@/contexts/stockContext";
// import { useCalendar } from "@/contexts/calendarContext";
// -------------
import { radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { LineChart } from "react-native-chart-kit";
import { scale, verticalScale } from "@/utils/styling";

const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth * 0.22; // 화면 너비의 22%로 설정
const chartHeight = spacingY._80;

// --- [변경] item: any 타입으로 받음 (Market에서 보낸 확장된 객체) ---
const FriendStock = ({ item }: { item: any }) => {
  const { theme } = useTheme();
  const { user } = useAuth(); // ✅ [추가] 사용자 설정(테마)를 위해 useAuth 호출
  const {
    // Market에서 필요한 컨텍스트만 남김
    toggleFollow,
    isFollowing,
    changeSelectedFollowId,
  } = useFollow();

  // ✅ [추가] CustomChart.tsx와 동일한 색상 설정 로직
  const chartColorScheme = user?.chartColorScheme ?? "red-up";
  const stockColors = {
    up: chartColorScheme === "red-up" ? theme.red100 : theme.green100,
    down: chartColorScheme === "red-up" ? theme.blue100 : theme.red100,
  };
  // ----------------------------------------------------

  // --- [추가] Market에서 계산한 데이터를 props로 받음 ---
  const {
    uid,
    name,
    image,
    price, // 현재 가격
    processedCloseValues, // 차트 데이터
    processedFirstDayOpen, // 7일 전 기준 가격
    processedWeeklyChange, // 변화율 (숫자)
  } = item;

  const following = isFollowing(uid);

  // 변수명 통일 (차트/그라데이션 로직이 그대로 작동하도록)
  const closeValues = processedCloseValues;
  const firstDayOpen = processedFirstDayOpen;

  // 표시에 사용할 문자열 (숫자는 색상 결정에 사용)
  const weeklyChangeString = processedWeeklyChange.toFixed(2);
  // ----------------------------------------------------

  // --- 그라데이션 로직 시작 (uid 사용) ---
  const gradientId = `threshold-gradient-${uid}`;
  let thresholdPercent = 0.5;
  if (closeValues.length > 1) {
    // [수정] firstDayOpen을 사용
    const allValues = [...closeValues, firstDayOpen];
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    let dataRange = dataMax - dataMin;
    if (dataRange === 0) {
      dataRange = 1;
    }
    // [수정] firstDayOpen을 사용
    thresholdPercent = 1 - (firstDayOpen - dataMin) / dataRange;
    thresholdPercent = Math.max(0, Math.min(1, thresholdPercent));
  }
  const GradientDecorator = () => (
    <Defs key={gradientId}>
      <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="100%">
        {/* ✅ [수정] theme.red100 -> stockColors.up */}
        <Stop offset="0%" stopColor={stockColors.up} />
        <Stop offset={thresholdPercent} stopColor={stockColors.up} />
        {/* ✅ [수정] theme.blue100 -> stockColors.down */}
        <Stop offset={thresholdPercent} stopColor={stockColors.down} />
        <Stop offset="100%" stopColor={stockColors.down} />
      </LinearGradient>
    </Defs>
  );
  // --- 그라데이션 로직 끝 ---

  return (
    <TouchableOpacity
      // [수정] uid 사용
      onPress={() => changeSelectedFollowId(uid)}
      activeOpacity={0.7}
      style={[styles.userCard, { backgroundColor: theme.cardBackground }]}
    >
      {/* 왼쪽: 사용자 정보 (flex: 1) */}
      <View style={styles.leftSection}>
        <Image
          source={{
            // [수정] image 사용
            uri: image || "https://via.placeholder.com/60",
          }}
          style={[styles.avatar, { backgroundColor: theme.neutral200 }]}
        />
        <View style={styles.userInfo}>
          <Typo
            color={theme.text}
            style={styles.userName}
            fontWeight={"600"}
            size={16}
            numberOfLines={2}
          >
            {/* [수정] name 사용 */}
            {name}
          </Typo>
        </View>
      </View>

      {/* 오른쪽: 차트 또는 팔로우 버튼 (flex: 2) */}
      <View style={styles.rightSelection}>
        {following ? (
          <>
            {/* [수정] closeValues 사용 */}
            {closeValues.length > 1 ? (
              <View style={styles.chartSection}>
                <LineChart
                  data={{
                    labels: [],
                    datasets: [
                      {
                        data: closeValues, // [수정]
                        strokeWidth: 2,
                        color: (opacity = 1) => `url(#${gradientId})`,
                      },
                      {
                        data: Array(closeValues.length).fill(firstDayOpen), // [수정]
                        color: (opacity = 1) => theme.neutral300,
                        strokeWidth: 1,
                        withDots: false,
                      },
                    ],
                  }}
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
                    marginLeft: -chartWidth * 0.1,
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
                size={14}
                color={theme.text}
                style={styles.weeklyChangeText}
              >
                {/* [수정] price 사용 */}
                {price}원
              </Typo>
              <Typo
                size={10}
                color={theme.textLight}
                style={styles.weeklyChangeText}
              >
                7d Change
              </Typo>
              <View
                style={[
                  styles.changeBadge,
                  {
                    // [수정] 숫자(processedWeeklyChange)로 비교 및 stockColors 적용
                    backgroundColor:
                      processedWeeklyChange > 0
                        ? `${stockColors.up}20` // ✅ [수정]
                        : processedWeeklyChange === 0
                        ? `${theme.textLight}20`
                        : `${stockColors.down}20`, // ✅ [수정]
                  },
                ]}
              >
                <Typo
                  size={12}
                  color={
                    // [수정] 숫자(processedWeeklyChange)로 비교 및 stockColors 적용
                    processedWeeklyChange > 0
                      ? stockColors.up // ✅ [수정]
                      : processedWeeklyChange === 0
                      ? theme.text
                      : stockColors.down // ✅ [수정]
                  }
                  style={{ lineHeight: scale(12) }}
                >
                  {/* [수정] 문자열(weeklyChangeString)로 표시 */}
                  {weeklyChangeString}%
                </Typo>
              </View>
            </View>
          </>
        ) : (
          // 팔로우 버튼
          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: theme.blue100 }]}
            // [수정] uid 사용
            onPress={() => toggleFollow(uid)}
          >
            <Typo size={12} fontWeight={600} color={theme.text}>
              Follow
            </Typo>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default FriendStock;

// --- 스타일은 변경 사항 없음 ---
const styles = StyleSheet.create({
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacingX._12,
    borderRadius: radius._12,
    marginBottom: spacingY._12,
    paddingVertical: spacingY._10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: radius._6,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: spacingX._40,
    height: spacingX._40,
    borderRadius: radius._40,
    marginRight: 12,
  },
  userInfo: {
    flexShrink: 1,
    marginRight: spacingX._8,
  },
  userName: {
    marginRight: spacingX._3,
    lineHeight: verticalScale(20),
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
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._8,
    borderRadius: radius._10,
    minWidth: spacingX._70,
    alignItems: "center",
  },
  weeklyChange: {
    marginTop: spacingY._5,
  },
  weeklyChangeText: {
    marginBottom: verticalScale(6),
  },
});
