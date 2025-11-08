import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
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
    followingNews,
    selectNews,
    selectedNews,
    toggleNewsLike,
    followingNewsLikes,
    loading,
    myNews,
    myNewsLikes,
    currentUserId,
  } = useNews();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]); // 빈 배열 = 전체

  const combinedNews = [...(myNews || []), ...(followingNews || [])].sort(
    (a, b) => {
      const timeA =
        a.createdAt?.toMillis?.() || new Date(a.fullDate).getTime() || 0;
      const timeB =
        b.createdAt?.toMillis?.() || new Date(b.fullDate).getTime() || 0;
      return timeB - timeA;
    }
  );

  // 필터링된 뉴스
  const filteredNews =
    selectedUserIds.length === 0
      ? combinedNews
      : combinedNews.filter((item) => selectedUserIds.includes(item.userId));

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
    selectNews(item);
  };

  const handleBack = () => {
    selectNews(null);
  };

  const handleLikePress = async (item: any) => {
    try {
      await toggleNewsLike(item.userId, item.id);
    } catch (error) {
      console.error("좋아요 실패:", error);
    }
  };

  const handleUserSelect = (userId: string) => {
    if (userId === "all") {
      // 전체 선택
      setSelectedUserIds([]);
    } else {
      // 유저 토글
      setSelectedUserIds((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        } else {
          return [...prev, userId];
        }
      });
    }
  };

  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }

  const renderNewsItem = ({ item }: { item: any }) => {
    const isMyNews = currentUserId ? item.userId === currentUserId : false;
    const isLiked = isMyNews
      ? myNewsLikes[item.id] || false
      : followingNewsLikes[item.id] || false;

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
                  {isMyNews ? "내 뉴스" : item.userName}
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

  // --- 1. 변경점: 헤더를 렌더링하는 함수 생성 ---
  // 기존 return 문 안에 있던 헤더와 유저 필터 부분을 여기로 옮깁니다.
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
              selectedUserIds.length === 0 && styles.userFilterItemActive,
            ]}
            onPress={() => handleUserSelect("all")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.userFilterAvatar,
                {
                  backgroundColor:
                    selectedUserIds.length === 0 ? "#3b82f6" : theme.neutral200,
                },
                selectedUserIds.length === 0 && styles.userFilterAvatarActive,
              ]}
            >
              <Ionicons
                name="apps"
                size={24}
                color={selectedUserIds.length === 0 ? "#fff" : theme.neutral500}
              />
            </View>
            <Typo
              size={11}
              fontWeight={selectedUserIds.length === 0 ? "700" : "500"}
              color={selectedUserIds.length === 0 ? "#3b82f6" : theme.textLight}
              style={styles.filterLabel}
            >
              전체
            </Typo>
          </TouchableOpacity>

          {/* 내 프로필 */}
          {user && currentUserId && (
            <TouchableOpacity
              style={[
                styles.userFilterItem,
                selectedUserIds.includes(currentUserId) &&
                  styles.userFilterItemActive,
              ]}
              onPress={() => handleUserSelect(currentUserId)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.userFilterAvatarContainer,
                  selectedUserIds.includes(currentUserId) &&
                    styles.userFilterAvatarActive,
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
                fontWeight={
                  selectedUserIds.includes(currentUserId) ? "700" : "500"
                }
                color={
                  selectedUserIds.includes(currentUserId)
                    ? "#3b82f6"
                    : theme.textLight
                }
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
              const isSelected = selectedUserIds.includes(uid);

              return (
                <TouchableOpacity
                  key={uid}
                  style={[
                    styles.userFilterItem,
                    isSelected && styles.userFilterItemActive,
                  ]}
                  onPress={() => handleUserSelect(uid)}
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

  // --- 2. 변경점: 로딩 및 빈 목록 상태를 렌더링하는 함수 생성 ---
  // 기존 return 문 안에 있던 조건부 렌더링 로직을 여기로 옮깁니다.
  const renderListEmpty = () => {
    // 로딩 중일 때
    if (loading && combinedNews.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      );
    }

    // 로딩 끝났는데 데이터가 없을 때
    if (filteredNews.length === 0) {
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
            {combinedNews.length === 0
              ? "아직 뉴스가 없어요"
              : "선택한 사용자의 뉴스가 없어요"}
          </Typo>
          <Typo size={14} color={theme.textLight} style={styles.emptyText}>
            {combinedNews.length === 0
              ? "뉴스를 발행하거나, 팔로우한 사람들의 뉴스를 기다려보세요"
              : "다른 사용자를 선택해보세요"}
          </Typo>
        </View>
      );
    }

    return null; // 데이터가 있으면 아무것도 렌더링하지 않음
  };

  // --- 3. 변경점: 메인 return 문 수정 ---
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/*
        기존의 헤더, 유저 필터, 조건부 렌더링 로직 (loading ? ... : ... )을
        모두 제거하고 FlatList 하나만 남깁니다.
      */}
      <FlatList
        data={filteredNews}
        renderItem={renderNewsItem}
        keyExtractor={(item) => `${item.userId}-${item.id}`}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        // --- 4. 변경점: ListHeaderComponent prop 추가 ---
        // 위에서 만든 헤더 + 필터 렌더링 함수를 여기에 전달합니다.
        ListHeaderComponent={renderListHeader()}
        // --- 5. 변경점: ListEmptyComponent prop 추가 ---
        // 위에서 만든 빈 목록 렌더링 함수를 여기에 전달합니다.
        ListEmptyComponent={renderListEmpty()}
        // --- 6. 변경점: contentContainerStyle 수정 ---
        // 목록이 비어있을 때(로딩 포함) centerContainer가
        // 화면 중앙에 올 수 있도록 flexGrow: 1을 추가합니다.
        contentContainerStyle={[
          styles.listContent,
          (filteredNews.length === 0 ||
            (loading && combinedNews.length === 0)) && {
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
    paddingHorizontal: spacingX._10,
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
    // zIndex는 FlatList 내부에서는 큰 의미가 없을 수 있으나,
    // 혹시 모를 오버레이 요소(예: 섀도우)를 위해 유지합니다.
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
    // flex: 1은 ListEmptyComponent 내부에서
    // contentContainerStyle의 flexGrow: 1과 함께
    // 중앙 정렬을 위해 올바르게 동작합니다.
  },
  emptyIconContainer: {
    marginBottom: spacingY._15,
  },
  emptyText: {
    marginTop: spacingY._8,
    textAlign: "center",
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
