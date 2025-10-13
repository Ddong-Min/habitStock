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
} from "react-native";
import React from "react";
import { useFollow } from "../../contexts/followContext";
import { useTheme } from "@/contexts/themeContext";

const Search = () => {
  const { theme } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    suggestedUsers,
    loading,
    toggleFollow,
    isFollowing,
  } = useFollow();

  // 렌더링할 사용자 목록
  const displayUsers = searchQuery ? searchResults : suggestedUsers;

  // 사용자 카드 렌더링
  const renderUserCard = ({ item }: { item: any }) => {
    const following = isFollowing(item.uid);

    return (
      <TouchableOpacity
        style={[styles.userCard, { backgroundColor: theme.cardBackground }]}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.photoURL || "https://via.placeholder.com/60",
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text
            style={[styles.userName, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.username, { color: theme.textLight }]}
            numberOfLines={1}
          >
            @{item.email}
          </Text>
          {item.bio && (
            <Text
              style={[styles.bio, { color: theme.textLighter }]}
              numberOfLines={1}
            >
              {item.bio}
            </Text>
          )}
          <Text style={[styles.followers, { color: theme.textLighter }]}>
            {item.followersCount || 0} followers
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.followBtn,
            { backgroundColor: theme.blue100 },
            following && [
              styles.followingBtn,
              {
                backgroundColor: theme.neutral100,
                borderColor: theme.neutral300,
              },
            ],
          ]}
          onPress={() => toggleFollow(item.uid)}
        >
          <Text
            style={[
              styles.followBtnText,
              following && [
                styles.followingBtnText,
                { color: theme.textLight },
              ],
            ]}
          >
            {following ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
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
              Suggested for you
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

export default Search;

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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    marginBottom: 4,
  },
  followers: {
    fontSize: 12,
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  followingBtn: {
    borderWidth: 1,
  },
  followBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  followingBtnText: {
    // color는 인라인으로 적용
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
