import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { radius, spacingX, spacingY } from "../../constants/theme";
import Typo from "../../components/Typo";
import { verticalScale } from "@/utils/styling";
import { useNews } from "@/contexts/newsContext";
import NewsDetail from "@/components/NewsDetail";
import { useTheme } from "@/contexts/themeContext";
import { Ionicons } from "@expo/vector-icons";

const news = () => {
  const { theme } = useTheme();
  const {
    followingNews,
    loadFollowingNews,
    selectNews,
    selectedNews,
    toggleNewsLike,
    followingNewsLikes,
    loading,
    myNews,
    loadMyNews,
    myNewsLikes,
    currentUserId,
  } = useNews();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyNews();
    loadFollowingNews();
  }, []);

  //b가 더 나중에 발행된 뉴스라면 true가 되서순서 변경됌
  const combinedNews = [...(myNews || []), ...(followingNews || [])].sort(
    (a, b) => {
      const timeA =
        a.createdAt?.toMillis?.() || new Date(a.fullDate).getTime() || 0;
      const timeB =
        b.createdAt?.toMillis?.() || new Date(b.fullDate).getTime() || 0;
      return timeB - timeA;
    }
  );

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

      // If the year is not this year, include it
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMyNews(), loadFollowingNews()]);
    setRefreshing(false);
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

  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }

  const renderNewsItem = ({ item }: { item: any }) => {
    const isMyNews = item.userId === currentUserId;
    const isLiked = isMyNews
      ? myNewsLikes[item.id] || false
      : followingNewsLikes[item.id] || false;

    const isDark =
      theme.background === "#0a0a0a" || theme.background === "#1a1a1a";

    return (
      <TouchableOpacity
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.95}
        style={styles.cardTouchable}
      >
        <View
          style={[
            styles.newsCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          {/* 배경 그라데이션 효과 */}
          <View
            style={[
              styles.cardGradient,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.02)",
              },
            ]}
          />

          {/* 헤더: 유저 정보 + 배지 */}
          <View style={styles.header}>
            <View style={styles.userSection}>
              {item.userPhotoURL ? (
                <Image
                  source={{ uri: item.userPhotoURL }}
                  style={styles.userAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.userAvatar,
                    { backgroundColor: isDark ? "#2a2a2a" : "#e8e8e8" },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={isDark ? "#666" : "#ccc"}
                  />
                </View>
              )}
              <View style={styles.userInfo}>
                <View style={styles.nameBadgeRow}>
                  <Typo
                    size={15}
                    fontWeight="700"
                    color={theme.text}
                    //numberOfLines={1}
                  >
                    {item.userName}
                  </Typo>
                  {isMyNews && (
                    <View style={styles.badge}>
                      <Typo size={11} fontWeight="600" color="#fff">
                        나
                      </Typo>
                    </View>
                  )}
                </View>
                <Typo size={12} color={theme.textLight} style={styles.timeText}>
                  {formatTime(item.createdAt)}
                </Typo>
              </View>
            </View>
          </View>

          {/* 메인 컨텐츠 */}
          <View style={styles.contentWrapper}>
            {/* 제목 */}
            <Typo
              size={16}
              fontWeight="700"
              color={theme.text}
              style={styles.title}
              // numberOfLines={2}
            >
              {item.title}
            </Typo>

            {/* 내용 미리보기 */}
            <Typo
              size={14}
              color={theme.textLight}
              style={styles.contentPreview}
              // numberOfLines={3}
            >
              {item.content}
            </Typo>

            {/* 이미지 */}
            {item.imageURL && (
              <Image
                source={{ uri: item.imageURL }}
                style={styles.contentImage}
              />
            )}
          </View>

          {/* 하단: 상호작용 버튼 */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikePress(item)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={18}
                color={isLiked ? "#FF4458" : theme.textLight}
              />
              <Typo
                size={13}
                fontWeight="600"
                color={isLiked ? "#FF4458" : theme.textLight}
              >
                {item.likesCount || 0}
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.textLight}
              />
              <Typo size={13} fontWeight="600" color={theme.textLight}>
                {item.commentsCount || 0}
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading && combinedNews.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      ) : combinedNews.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="newspaper-outline"
              size={64}
              color={theme.textLight}
            />
          </View>
          <Typo size={18} fontWeight="600" color={theme.text}>
            아직 뉴스가 없어요
          </Typo>
          <Typo size={14} color={theme.textLight} style={styles.emptyText}>
            뉴스를 발행하거나, 팔로우한 사람들의 뉴스를 기다려보세요
          </Typo>
        </View>
      ) : (
        <FlatList
          data={combinedNews}
          renderItem={renderNewsItem}
          keyExtractor={(item) => `${item.userId}-${item.id}`}
          scrollEventThrottle={16}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default news;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  listContent: {
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._12,
  },
  cardTouchable: {
    marginBottom: spacingY._12,
  },
  newsCard: {
    borderRadius: radius._15,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: radius._10,
    elevation: 3,
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._12,
    zIndex: 1,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  userAvatar: {
    width: spacingX._40,
    height: spacingX._40,
    borderRadius: radius._20,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._7,
    marginBottom: spacingY._3,
  },
  badge: {
    backgroundColor: "#FF4458",
    paddingHorizontal: spacingX._7,
    paddingVertical: spacingY._2,
    borderRadius: 4,
  },
  timeText: {
    letterSpacing: -0.3,
  },
  contentWrapper: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._8,
    zIndex: 1,
  },
  title: {
    marginBottom: spacingY._7,
    lineHeight: verticalScale(20),
    letterSpacing: -0.4,
  },
  contentPreview: {
    marginBottom: spacingY._10,
    lineHeight: verticalScale(20),
    letterSpacing: -0.2,
  },
  contentImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: spacingY._8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: spacingX._8,
    paddingVertical: spacingY._10,
    borderTopWidth: 1,
    zIndex: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._7,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._8,
    borderRadius: 8,
  },
});
