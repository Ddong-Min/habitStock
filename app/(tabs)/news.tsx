import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
// --- [신규] React와 useEffect import ---
import React, { useState, useEffect } from "react";
import { radius, spacingX, spacingY } from "../../constants/theme";
import Typo from "../../components/Typo";
import { verticalScale } from "@/utils/styling";
import { useNews } from "@/contexts/newsContext";
import NewsDetail from "@/components/NewsDetail";
import { useTheme } from "@/contexts/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { useFollow } from "@/contexts/followContext";

const news = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { followingUsers, followingIds } = useFollow();

  const {
    feedItems,
    selectNews,
    selectedNews,
    toggleNewsLike,
    myNewsLikes,
    feedLoading,
    feedLoadingMore,
    feedHasMore,
    loadMoreFeed,
    refreshFeed,
    filterUserId,
    setFilterUserId,
    initNewsTab, // 👈 [신규] 초기화 함수 가져오기
    currentUserId, // 👈 [신규] 유저 ID 가져오기
  } = useNews();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- [신규] 뉴스 탭이 마운트될 때 데이터 로딩 시작 ---
  useEffect(() => {
    if (currentUserId) {
      initNewsTab(); // "뉴스 탭"이 처음 보일 때 1회 호출
    }
  }, [currentUserId, initNewsTab]); // 유저가 로그인하면 1회 실행

  const formatTime = (createdAt: any) => {
    try {
      if (!createdAt) return "날짜 없음";
      let date: Date;
      if (createdAt.toMillis) {
        date = new Date(createdAt.toMillis());
      } else if (createdAt instanceof Date) {
        date = createdAt;
      } else if (typeof createdAt === "string") {
        date = new Date(createdAt);
      } else if (typeof createdAt === "number") {
        date = new Date(createdAt);
      } else {
        return "날짜 없음";
      }
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "방금 전";
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      const options: Intl.DateTimeFormatOptions = {
        month: "numeric",
        day: "numeric",
      };
      if (date.getFullYear() !== now.getFullYear()) {
        options.year = "numeric";
      }
      return date.toLocaleDateString("ko-KR", options);
    } catch (error) {
      return "날짜 오류";
    }
  };

  const handleNewsPress = (item: any) => {
    selectNews({
      ...item,
      userId: item.newsUserId,
    });
  };

  const handleBack = () => {
    selectNews(null);
  };

  const handleLikePress = async (item: any) => {
    try {
      await toggleNewsLike(item.newsUserId, item.id);
    } catch (error) {
      console.error("좋아요 실패:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFeed();
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!feedLoadingMore && feedHasMore) {
      loadMoreFeed();
    }
  };

  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }

  const renderNewsItem = ({ item }: { item: any }) => {
    const isMyNews = user ? item.newsUserId === user.uid : false;
    const isLiked = myNewsLikes[item.id] || false;

    return (
      <TouchableOpacity
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.95}
        style={styles.cardContainer}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.neutral200,
            },
          ]}
        >
          {/* 왼쪽 컨텐츠 섹션 */}
          <View style={styles.leftContent}>
            {/* 카테고리/출처 태그 */}
            <View style={styles.topRow}>
              <View
                style={[
                  styles.sourceTag,
                  {
                    backgroundColor: theme.blue25,
                  },
                ]}
              >
                <Typo size={11} fontWeight="600" color="#3b82f6">
                  {isMyNews ? "내 뉴스" : item.newsUserName}
                </Typo>
              </View>
              <Typo size={11} color={theme.textLight}>
                {formatTime(item.createdAt)}
              </Typo>
            </View>

            {/* 제목 */}
            <Typo
              size={16}
              fontWeight="700"
              color={theme.text}
              style={styles.cardTitle}
              numberOfLines={3}
            >
              {item.title}
            </Typo>

            {/* 내용 미리보기 */}
            <Typo
              size={13}
              color={theme.textLight}
              style={styles.cardDescription}
              numberOfLines={2}
            >
              {item.content}
            </Typo>

            {/* 하단 인터랙션 영역 */}
            <View style={styles.bottomRow}>
              {/* 액션 버튼들 */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.miniButton}
                  onPress={() => handleLikePress(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={16}
                    color={isLiked ? "#FF4458" : theme.textLight}
                  />
                  <Typo
                    size={12}
                    fontWeight="600"
                    color={isLiked ? "#FF4458" : theme.textLight}
                  >
                    {item.likesCount || 0}
                  </Typo>
                </TouchableOpacity>

                <TouchableOpacity style={styles.miniButton} activeOpacity={0.7}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={15}
                    color={theme.textLight}
                  />
                  <Typo size={12} fontWeight="600" color={theme.textLight}>
                    {item.commentsCount || 0}
                  </Typo>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 오른쪽 이미지 섹션 */}
          {item.imageURL ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageURL }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View
              style={[
                styles.placeholderImage,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            ></View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Typo size={28} fontWeight="800" color={theme.text}>
            TodoStock{" "}
            <Typo size={28} fontWeight="300" color={theme.text}>
              news
            </Typo>
          </Typo>
          <View style={styles.headerDecoration}>
            <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />
            <View style={[styles.dot, { backgroundColor: "#10b981" }]} />
          </View>
        </View>
      </View>

      {/* 유저 필터 스크롤 */}
      <View
        style={[
          styles.userFilterWrapper,
          { backgroundColor: theme.background },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.userFilterContainer}
          style={styles.userFilterScroll}
        >
          {/* 전체 버튼 */}
          <TouchableOpacity
            style={[
              styles.userFilterItem,
              filterUserId === null && styles.userFilterItemActive,
            ]}
            onPress={() => setFilterUserId(null)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.userFilterAvatar,
                {
                  backgroundColor:
                    filterUserId === null ? "#3b82f6" : theme.neutral200,
                },
                filterUserId === null && styles.userFilterAvatarActive,
              ]}
            >
              <Ionicons
                name="apps"
                size={24}
                color={filterUserId === null ? "#fff" : theme.neutral500}
              />
            </View>
            <Typo
              size={11}
              fontWeight={filterUserId === null ? "700" : "500"}
              color={filterUserId === null ? "#3b82f6" : theme.textLight}
              style={styles.filterLabel}
            >
              전체
            </Typo>
          </TouchableOpacity>

          {/* 내 프로필 */}
          {user && user.uid && (
            <TouchableOpacity
              style={[
                styles.userFilterItem,
                filterUserId === user.uid && styles.userFilterItemActive,
              ]}
              onPress={() => setFilterUserId(user.uid)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.userFilterAvatarContainer,
                  filterUserId === user.uid && styles.userFilterAvatarActive,
                ]}
              >
                {user.image ? (
                  <Image
                    source={{ uri: user.image }}
                    style={styles.userFilterAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.userFilterAvatar,
                      { backgroundColor: theme.neutral200 },
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={24}
                      color={theme.neutral500}
                    />
                  </View>
                )}
              </View>
              <Typo
                size={11}
                fontWeight={filterUserId === user.uid ? "700" : "500"}
                color={filterUserId === user.uid ? "#3b82f6" : theme.textLight}
                style={styles.filterLabel}
              >
                나
              </Typo>
            </TouchableOpacity>
          )}

          {/* 팔로잉 유저들 */}
          {followingIds &&
            Array.from(followingIds).map((uid: string, index: number) => {
              const followingUser = Array.isArray(followingUsers)
                ? followingUsers[index]
                : undefined;
              const isSelected = filterUserId === uid;

              return (
                <TouchableOpacity
                  key={uid}
                  style={[
                    styles.userFilterItem,
                    isSelected && styles.userFilterItemActive,
                  ]}
                  onPress={() => setFilterUserId(uid)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.userFilterAvatarContainer,
                      isSelected && styles.userFilterAvatarActive,
                    ]}
                  >
                    {followingUser?.image ? (
                      <Image
                        source={{ uri: followingUser.image }}
                        style={styles.userFilterAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.userFilterAvatar,
                          { backgroundColor: theme.neutral200 },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={24}
                          color={theme.neutral500}
                        />
                      </View>
                    )}
                  </View>
                  <Typo
                    size={11}
                    fontWeight={isSelected ? "700" : "500"}
                    color={isSelected ? "#3b82f6" : theme.textLight}
                    numberOfLines={1}
                    style={styles.userName}
                  >
                    {followingUser?.name || "이름없음"}
                  </Typo>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>
    </>
  );

  const renderListFooter = () => {
    if (!feedLoadingMore) return null;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.text} />
        <Typo size={13} color={theme.textLight} style={styles.footerText}>
          더 불러오는 중...
        </Typo>
      </View>
    );
  };

  const renderListEmpty = () => {
    // [수정] 'feedLoading'은 초기 로드/필터 변경 시에만 true가 됨
    if (feedLoading && feedItems.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      );
    }

    if (feedItems.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="newspaper-outline"
              size={64}
              color={theme.textLight}
            />
          </View>
          <Typo size={18} fontWeight="600" color={theme.text}>
            {filterUserId === null
              ? "아직 뉴스가 없어요"
              : "선택한 사용자의 뉴스가 없어요"}
          </Typo>
          <Typo size={14} color={theme.textLight} style={styles.emptyText}>
            {filterUserId === null
              ? "뉴스를 발행하거나, 친구를 팔로우해보세요"
              : "다른 사용자를 선택해보세요"}
          </Typo>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={feedItems}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.text}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader()}
        ListFooterComponent={renderListFooter()}
        ListEmptyComponent={renderListEmpty()}
        contentContainerStyle={[
          styles.listContent,
          (feedItems.length === 0 ||
            (feedLoading && feedItems.length === 0)) && {
            flexGrow: 1,
          },
        ]}
      />
    </View>
  );
};

export default news;

// --- 스타일은 변경할 필요 없습니다 ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacingY._20,
    paddingHorizontal: spacingX._16,
    paddingBottom: spacingY._12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerDecoration: {
    flexDirection: "row",
    gap: spacingX._6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userFilterWrapper: {
    zIndex: 10,
  },
  userFilterScroll: {
    maxHeight: 110,
    paddingBottom: spacingY._8,
    zIndex: 10,
  },
  userFilterContainer: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._12,
    gap: spacingX._10,
  },
  userFilterItem: {
    alignItems: "center",
  },
  userFilterItemActive: {
    // 활성화 상태
  },
  userFilterAvatarContainer: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 28,
    padding: 2,
  },
  userFilterAvatarActive: {
    borderColor: "#3b82f6",
  },
  userFilterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  filterLabel: {
    marginTop: spacingY._6,
    textAlign: "center",
  },
  userName: {
    maxWidth: 60,
    marginTop: spacingY._6,
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
  },
  emptyIconContainer: {
    marginBottom: spacingY._15,
  },
  emptyText: {
    marginTop: spacingY._8,
    textAlign: "center",
  },
  footerLoading: {
    paddingVertical: spacingY._20,
    alignItems: "center",
  },
  footerText: {
    marginTop: spacingY._8,
  },
  listContent: {
    paddingHorizontal: spacingX._16,
    paddingBottom: spacingY._20,
  },
  cardContainer: {
    marginBottom: spacingY._12,
  },
  card: {
    flexDirection: "row",
    borderRadius: radius._12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    padding: spacingX._16,
    gap: spacingX._12,
  },
  leftContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacingX._15,
    marginBottom: spacingY._8,
  },
  sourceTag: {
    paddingHorizontal: spacingX._8,
    paddingVertical: spacingY._3,
    borderRadius: 4,
  },
  cardTitle: {
    marginBottom: spacingY._6,
    lineHeight: verticalScale(20),
    letterSpacing: -0.3,
  },
  cardDescription: {
    lineHeight: verticalScale(18),
    letterSpacing: -0.1,
    marginBottom: spacingY._10,
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._8,
  },
  miniButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
    paddingHorizontal: spacingX._6,
    paddingVertical: spacingY._3,
  },
  imageContainer: {
    width: spacingX._100,
    height: spacingX._100,
    borderRadius: radius._10,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: spacingX._30,
    height: spacingX._30,
    borderRadius: radius._10,
    justifyContent: "center",
    alignItems: "center",
  },
});
