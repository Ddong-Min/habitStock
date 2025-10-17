import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import { colors, radius, spacingX, spacingY } from "../../constants/theme";
import { ScrollView } from "react-native-gesture-handler";
import YearHeader from "../../components/YearHeader";
import Typo from "../../components/Typo";
import { verticalScale, scale } from "@/utils/styling";
import { useNews } from "@/contexts/newsContext";
import NewsDetail from "@/components/NewsDetail";
import UserProfile from "@/components/UserProfile";
import { useTheme } from "@/contexts/themeContext";
import { NewsItem } from "../../api/newsApi";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
} from "lucide-react-native";

const news = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"my" | "following">("my");
  const [selectedYear] = useState(new Date().getFullYear());
  const {
    myNews,
    followingNews,
    loadMyNews,
    loadFollowingNews,
    selectNews,
    selectedNews,
    toggleNewsLike,
    myNewsLikes,
    followingNewsLikes,
    currentUserId,
  } = useNews();
  const [likedNews, setLikedNews] = useState<Set<string>>(new Set());
  const [savedNews, setSavedNews] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMyNews(selectedYear);
    loadFollowingNews(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    const myLikes = Object.entries(myNewsLikes)
      .filter(([_, isLiked]) => isLiked)
      .map(([id]) => id);
    setLikedNews(new Set(myLikes));
  }, [myNewsLikes]);

  useEffect(() => {
    const followingLikes = Object.entries(followingNewsLikes)
      .filter(([_, isLiked]) => isLiked)
      .map(([id]) => id);
    setLikedNews(new Set(followingLikes));
  }, [followingNewsLikes]);

  const handleNewsPress = (item: NewsItem) => {
    selectNews(item);
  };

  const handleBack = () => {
    selectNews(null);
  };

  const handleToggleLike = async (item: NewsItem) => {
    try {
      await toggleNewsLike(item.userId, item.id);
    } catch (error) {
      console.error("좋아요 실패:", error);
    }
  };

  const toggleSave = (newsId: string) => {
    setSavedNews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const getInitial = (name: string) => {
    return name?.charAt(0).toUpperCase() || "📰";
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const diff = today.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return date;
  };

  const NewsCard = ({ item }: { item: NewsItem }) => (
    <View style={[styles.newsPost, { backgroundColor: theme.cardBackground }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {item.userPhotoURL ? (
            <Image
              source={{ uri: item.userPhotoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View
              style={[styles.profileImage, { backgroundColor: theme.main }]}
            >
              <Typo size={14} fontWeight="700" color={theme.white}>
                {getInitial(item.userName)}
              </Typo>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Typo size={14} fontWeight="600" color={theme.text}>
              {item.userName}
            </Typo>
            <Typo size={12} color={theme.textLight}>
              {formatDate(item.date)}
            </Typo>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={18} color={theme.textLight} />
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      <TouchableOpacity
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.contentWrapper}>
          <Typo
            size={16}
            fontWeight="700"
            style={styles.newsTitle}
            color={theme.text}
            //numberOfLines={3}
          >
            {item.title}
          </Typo>
          <Typo
            size={13}
            style={styles.newsContent}
            color={theme.textLight}
            //numberOfLines={3}
          >
            {item.content}
          </Typo>
        </View>
      </TouchableOpacity>

      {/* 통계 */}
      {(item.likesCount || item.commentsCount) && (
        <View style={[styles.stats, { borderTopColor: theme.neutral200 }]}>
          {item.likesCount ? (
            <Typo size={12} color={theme.textLight}>
              ❤️ {item.likesCount}
            </Typo>
          ) : null}
          {item.commentsCount ? (
            <Typo size={12} color={theme.textLight}>
              💬 {item.commentsCount}
            </Typo>
          ) : null}
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={[styles.actions, { borderTopColor: theme.neutral200 }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleLike(item)}
        >
          <Heart
            size={18}
            color={likedNews.has(item.id) ? "#d17069" : theme.textLight}
            fill={likedNews.has(item.id) ? "#d17069" : "none"}
          />
          <Typo
            size={13}
            color={likedNews.has(item.id) ? "#d17069" : theme.textLight}
          >
            좋아요
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleNewsPress(item)}
        >
          <MessageCircle size={18} color={theme.textLight} />
          <Typo size={13} color={theme.textLight}>
            댓글
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleSave(item.id)}
        >
          <Bookmark
            size={18}
            color={savedNews.has(item.id) ? theme.main : theme.textLight}
            fill={savedNews.has(item.id) ? theme.main : "none"}
          />
          <Typo
            size={13}
            color={savedNews.has(item.id) ? theme.main : theme.textLight}
          >
            저장
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={18} color={theme.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }

  const displayNews = activeTab === "my" ? myNews : followingNews;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 탭 네비게이션 */}
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.neutral200,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "my" && [
              styles.activeTab,
              { borderBottomColor: theme.main },
            ],
          ]}
          onPress={() => setActiveTab("my")}
        >
          <Typo
            size={14}
            fontWeight={activeTab === "my" ? "700" : "500"}
            color={activeTab === "my" ? theme.text : theme.textLight}
          >
            나의 뉴스
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "following" && [
              styles.activeTab,
              { borderBottomColor: theme.main },
            ],
          ]}
          onPress={() => setActiveTab("following")}
        >
          <Typo
            size={14}
            fontWeight={activeTab === "following" ? "700" : "500"}
            color={activeTab === "following" ? theme.text : theme.textLight}
          >
            피드
          </Typo>
        </TouchableOpacity>
      </View>

      {activeTab === "my" ? (
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <YearHeader year={selectedYear.toString()} />

            {displayNews.length === 0 ? (
              <View
                style={{
                  paddingVertical: verticalScale(60),
                  alignItems: "center",
                }}
              >
                <Typo color={theme.textLight} size={15}>
                  아직 뉴스가 없습니다
                </Typo>
              </View>
            ) : (
              displayNews.map((item) => <NewsCard key={item.id} item={item} />)
            )}
            <View style={{ height: spacingY._20 }} />
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={displayNews}
          renderItem={({ item }) => <NewsCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedContent}
          scrollIndicatorInsets={{ right: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typo color={theme.textLight} size={15}>
                팔로우 중인 사용자가 없거나 뉴스가 없습니다
              </Typo>
            </View>
          }
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacingY._15,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  content: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._12,
  },
  section: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._12,
  },
  newsPost: {
    borderRadius: radius._12,
    marginVertical: spacingY._8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    flex: 1,
  },
  profileImage: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    gap: spacingY._2,
  },
  moreButton: {
    padding: spacingX._8,
    marginRight: scale(-8),
  },
  contentWrapper: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._12,
    gap: spacingY._8,
  },
  newsTitle: {
    lineHeight: verticalScale(22),
    letterSpacing: -0.3,
  },
  newsContent: {
    lineHeight: verticalScale(18),
    letterSpacing: -0.2,
  },
  stats: {
    flexDirection: "row",
    gap: spacingX._15,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderTopWidth: 0.5,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacingX._5,
    paddingVertical: spacingY._10,
  },
  emptyContainer: {
    paddingVertical: verticalScale(100),
    alignItems: "center",
  },
});
