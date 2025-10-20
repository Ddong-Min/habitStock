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

  if (selectedFollowId) {
    return (
      <FriendStockDetail
        followId={selectedFollowId}
        onBack={() => changeSelectedFollowId(null)}
      />
    );
  }

  useEffect(() => {
    if (displayUsers.length > 0) {
      const followIds = displayUsers.map((user) => user!.uid);
      loadAllFriendStocksData(followIds);
    }
  }, [displayUsers]);

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
