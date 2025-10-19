import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import React, { useEffect } from "react";
import { useFollow } from "../../contexts/followContext";
import { useTheme } from "@/contexts/themeContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { LineChart } from "react-native-chart-kit";
// react-native-svg에서 그라데이션을 위한 컴포넌트 import
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { verticalScale } from "@/utils/styling";
const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth * 0.22; // 화면 너비의 22%로 설정
const chartHeight = spacingY._70;
const Market = () => {
  const { theme } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    followingUsers,
    toggleFollow,
    isFollowing,
  } = useFollow();
  const { friendStockData, loadAllFriendStocksData } = useStock();
  const { today } = useCalendar();
  const displayUsers = searchQuery ? searchResults : followingUsers;

  useEffect(() => {
    if (displayUsers.length > 0) {
      const followIds = displayUsers.map((user) => user!.uid);
      loadAllFriendStocksData(followIds);
    }
  }, [displayUsers]);

  const renderUserCard = ({ item }: { item: any }) => {
    const following = isFollowing(item.uid);
    const friendStock = friendStockData[item.uid] || {};
    const priceChange = friendStock[today]?.changePrice || 0;
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
      <View
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
                <Text
                  style={[
                    styles.weeklyChangeText,
                    { fontSize: verticalScale(18), color: theme.text },
                  ]}
                >
                  {item.price}원
                </Text>
                <Text
                  style={[styles.weeklyChangeText, { color: theme.textLight }]}
                >
                  7d Change
                </Text>
                <Text style={[styles.weeklyChangeText, { color: theme.text }]}>
                  {weeklyChange}%
                </Text>
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
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.neutral200,
          },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: theme.neutral100 }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="이메일과 이름으로 검색하세요."
            placeholderTextColor={theme.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={[styles.clearBtn, { color: theme.textLight }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.blue100} />
        </View>
      )}

      {/* User List */}
      <FlatList
        data={displayUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => (item ? item.uid : "")}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          !searchQuery ? (
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today Market Info
            </Text>
          ) : null
        }
        ListEmptyComponent={
          !loading && searchQuery ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No users found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textLight }]}>
                Try searching for different keywords
              </Text>
            </View>
          ) : !loading && !searchQuery ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Discover new friends
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textLight }]}>
                Search for users to follow
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Market;

// 6. StyleSheet 스타일 수정
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 20,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    paddingVertical: 32,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  weeklyChange: {
    marginTop: 4,
  },
  weeklyChangeText: {
    fontSize: verticalScale(12),
    fontWeight: "500",
    marginBottom: verticalScale(4),
  },
});
