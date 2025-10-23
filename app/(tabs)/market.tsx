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
  Touchable,
} from "react-native";
// --- [변경] ---
import React, { useEffect, useMemo, useState } from "react";
// -------------
import { useFollow } from "../../contexts/followContext";
import { useTheme } from "@/contexts/themeContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { LineChart } from "react-native-chart-kit";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { verticalScale } from "@/utils/styling";
import FriendStockDetail from "@/components/FriendStockDetail";
import FriendStock from "@/components/FriendStock";

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
    selectedFollowId,
    changeSelectedFollowId,
  } = useFollow();
  const { friendStockData, loadAllFriendStocksData } = useStock();
  const { today } = useCalendar();
  const displayUsers = searchQuery ? searchResults : followingUsers;

  // --- [추가] 정렬 상태 관리 ---
  const [sortConfig, setSortConfig] = useState({
    key: "default", // 'default', 'price', 'changePercent'
    order: "desc", // 'asc', 'desc'
  });

  // 정렬 버튼 클릭 핸들러
  const handleSort = (newKey: "default" | "price" | "changePercent") => {
    setSortConfig((prevConfig) => {
      if (newKey === "default") {
        return { key: "default", order: "desc" };
      }
      if (prevConfig.key === newKey) {
        // 같은 키: 순서 변경
        return {
          key: newKey,
          order: prevConfig.order === "desc" ? "asc" : "desc",
        };
      }
      // 새로운 키: 내림차순 기본
      return { key: newKey, order: "desc" };
    });
  };
  // -------------------------

  // 데이터 로딩 (종속성 배열에서 loadAllFriendStocksData 제거)
  useEffect(() => {
    if (displayUsers.length > 0) {
      const followIds = displayUsers.map((user) => user!.uid);
      loadAllFriendStocksData(followIds);
    }
  }, [displayUsers]);

  // --- [추가] 1. 데이터 계산 로직 (useMemo) ---
  const processedUsers = useMemo(() => {
    return displayUsers
      .map((user) => {
        if (!user) return null;

        const friendStock = friendStockData[user.uid] || {};

        // 차트 데이터 계산
        const closeValues = Object.values(friendStock)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7) // non-mutating slice
          .map((data) => Number(data?.close) || 0);

        // 7일 전 기준 가격 계산
        const firstDay = new Date(today);
        firstDay.setDate(firstDay.getDate() - 6);
        const firstDayKey = firstDay.toISOString().split("T")[0];
        const firstDayOpen = friendStock[firstDayKey]?.open || 100;

        // 변화율 계산 (숫자형으로)
        const currentPrice = user.price || 0;
        const weeklyChange =
          firstDayOpen === 0
            ? 0 // 0으로 나누기 방지
            : ((currentPrice - firstDayOpen) / firstDayOpen) * 100;

        // FriendStock에 전달할 객체 반환
        return {
          ...user, // uid, name, image, price 포함
          // 정렬 및 표시에 사용할 추가 데이터
          processedCloseValues: closeValues,
          processedFirstDayOpen: firstDayOpen,
          processedWeeklyChange: weeklyChange, // 정렬에 사용될 숫자
        };
      })
      .filter(Boolean); // null 값 제거
  }, [displayUsers, friendStockData, today]);
  // -----------------------------------------

  // --- [추가] 2. 데이터 정렬 로직 (useMemo) ---
  const sortedUsers = useMemo(() => {
    const { key, order } = sortConfig;

    if (key === "default") {
      return processedUsers; // 기본 순서
    }

    // 정렬을 위해 배열 복사
    const sortable = [...processedUsers];

    sortable.sort((a, b) => {
      let valA: number;
      let valB: number;

      if (key === "price") {
        valA = a?.price ?? 0; // 유저 객체의 기본 price, 기본값 0
        valB = b?.price ?? 0;
      } else {
        // 'changePercent'
        valA = a?.processedWeeklyChange ?? 0; // 위에서 계산한 변화율, 기본값 0
        valB = b?.processedWeeklyChange ?? 0;
      }

      return order === "desc" ? valB - valA : valA - valB;
    });

    return sortable;
  }, [processedUsers, sortConfig]);
  // ---------------------------------------

  if (selectedFollowId) {
    return (
      <FriendStockDetail
        followId={selectedFollowId}
        onBack={() => changeSelectedFollowId(null)}
      />
    );
  }

  // --- [추가] 정렬 버튼 UI 렌더링 함수 ---
  const renderSortButtons = () => {
    // 현재 정렬 상태에 따라 아이콘 표시
    const getSortIndicator = (key: string) => {
      if (sortConfig.key !== key) return "";
      return sortConfig.order === "desc" ? " ▼" : " ▲";
    };

    return (
      <View
        style={[styles.sortContainer, { borderBottomColor: theme.neutral200 }]}
      >
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme.neutral100 },
            sortConfig.key === "default" && [
              styles.sortButtonActive,
              { borderColor: theme.blue100 },
            ],
          ]}
          onPress={() => handleSort("default")}
        >
          <Typo
            size={13}
            color={
              sortConfig.key === "default" ? theme.blue100 : theme.textLight
            }
            fontWeight={sortConfig.key === "default" ? "600" : "500"}
          >
            기본
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme.neutral100 },
            sortConfig.key === "price" && [
              styles.sortButtonActive,
              { borderColor: theme.blue100 },
            ],
          ]}
          onPress={() => handleSort("price")}
        >
          <Typo
            size={13}
            color={sortConfig.key === "price" ? theme.blue100 : theme.textLight}
            fontWeight={sortConfig.key === "price" ? "600" : "500"}
          >
            가격순{getSortIndicator("price")}
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme.neutral100 },
            sortConfig.key === "changePercent" && [
              styles.sortButtonActive,
              { borderColor: theme.blue100 },
            ],
          ]}
          onPress={() => handleSort("changePercent")}
        >
          <Typo
            size={13}
            color={
              sortConfig.key === "changePercent"
                ? theme.blue100
                : theme.textLight
            }
            fontWeight={sortConfig.key === "changePercent" ? "600" : "500"}
          >
            변화율순{getSortIndicator("changePercent")}
          </Typo>
        </TouchableOpacity>
      </View>
    );
  };
  // ---------------------------------------

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

      {/* --- [추가] --- */}
      {/* 검색 중이 아닐 때만 정렬 버튼 표시 */}
      {!searchQuery && renderSortButtons()}
      {/* ------------- */}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.blue100} />
        </View>
      )}

      {/* User List */}
      <FlatList
        // --- [변경] data prop 수정 ---
        data={sortedUsers}
        // -------------------------
        renderItem={({ item }) => <FriendStock item={item} />}
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
  // --- [추가] 정렬 버튼 스타일 ---
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: "transparent", // Market 배경색과 동일하게
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent", // 기본
  },
  sortButtonActive: {
    borderWidth: 1,
    // borderColor는 theme을 사용하므로 JSX에서 인라인으로 적용
  },
  // -------------------------
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
});
