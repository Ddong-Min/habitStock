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
import { colors } from "@/constants/theme";

const Search = () => {
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
      <TouchableOpacity style={styles.userCard} activeOpacity={0.7}>
        <Image
          source={{
            uri: item.photoURL || "https://via.placeholder.com/60",
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
          <Text style={styles.followers}>
            {item.followersCount || 0} followers
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={() => toggleFollow(item.uid)}
        >
          <Text
            style={[styles.followBtnText, following && styles.followingBtnText]}
          >
            {following ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="이메일과 이름으로 검색하세요."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.main} />
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
            <Text style={styles.sectionTitle}>Suggested for you</Text>
          ) : null
        }
        ListEmptyComponent={
          !loading && searchQuery ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>
                Try searching for different keywords
              </Text>
            </View>
          ) : !loading && !searchQuery ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Discover new friends</Text>
              <Text style={styles.emptySubtext}>
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
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
    color: "#1F2937",
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 20,
    color: "#9CA3AF",
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
    color: "#1F2937",
    marginBottom: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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
    color: "#1F2937",
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  followers: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  followBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  followingBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  followBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  followingBtnText: {
    color: "#6B7280",
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
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
