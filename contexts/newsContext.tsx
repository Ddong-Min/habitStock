import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import * as newsService from "../api/newsApi";
import { useAuth } from "./authContext";
import { Alert } from "react-native";
import { useFollow } from "./followContext";
import { auth } from "../config/firebase";

interface NewsContextType {
  currentUserId: string | null;
  myNews: newsService.NewsItem[];
  followingNews: newsService.NewsItem[];
  selectedNews: newsService.NewsItem | null;
  comments: newsService.Comment[];
  loading: boolean;
  selectedYear: number;
  followingSelectedYear: number;
  years: number[];
  myNewsLikes: Record<string, boolean>;
  followingNewsLikes: Record<string, boolean>;

  createNews: (
    taskId: string,
    dueDate: string,
    useAI?: boolean,
    imageURL?: string
  ) => Promise<void>;
  updateNews: (
    newsId: string,
    title: string,
    content: string,
    imageUri?: string
  ) => Promise<void>;
  deleteNews: (newsId: string) => Promise<void>;
  selectNews: (news: newsService.NewsItem | null) => void;
  addComment: (
    newsUserId: string,
    newsId: string,
    content: string
  ) => Promise<void>;
  deleteComment: (
    newsUserId: string,
    newsId: string,
    commentId: string
  ) => Promise<void>;
  setSelectedYear: (year: number) => void;
  setFollowingSelectedYear: (year: number) => void;
  toggleNewsLike: (newsUserId: string, newsId: string) => Promise<void>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [myNews, setMyNews] = useState<newsService.NewsItem[]>([]);
  const [followingNews, setFollowingNews] = useState<newsService.NewsItem[]>(
    []
  );
  const [selectedNews, setSelectedNews] = useState<newsService.NewsItem | null>(
    null
  );
  const [comments, setComments] = useState<newsService.Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [followingSelectedYear, setFollowingSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [myNewsLikes, setMyNewsLikes] = useState<Record<string, boolean>>({});
  const [followingNewsLikes, setFollowingNewsLikes] = useState<
    Record<string, boolean>
  >({});
  const { user } = useAuth();
  const { selectedFollowId, followingIds } = useFollow();

  const years = Array.from([
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  ]);

  useEffect(() => {
    setCurrentUserId(user ? user.uid : null);
    setCurrentUserData(user);
  }, [user]);

  // 내 뉴스 실시간 구독
  useEffect(() => {
    if (!currentUserId) {
      setMyNews([]);
      return;
    }

    setLoading(true);

    const unsubscribe = newsService.subscribeToUserNews(
      currentUserId,
      (news) => {
        // year 필터링
        const filteredNews = news.filter(
          (n: newsService.NewsItem) =>
            new Date(n.fullDate).getFullYear() === selectedYear
        );
        setMyNews(filteredNews);
        setLoading(false);
      },
      (error) => {
        console.error("내 뉴스 구독 실패:", error);
        setLoading(false);
      }
    );

    // cleanup: 구독 해제
    return () => {
      unsubscribe();
    };
  }, [currentUserId, selectedYear]);

  // 팔로잉 뉴스 실시간 구독
  useEffect(() => {
    if (!currentUserId || !followingIds || followingIds.size === 0) {
      setFollowingNews([]);
      return;
    }

    setLoading(true);

    const unsubscribes: (() => void)[] = [];
    const newsMap = new Map<string, newsService.NewsItem[]>();

    // 각 팔로잉 유저의 뉴스를 구독
    Array.from(followingIds).forEach((followId) => {
      const unsubscribe = newsService.subscribeToUserNews(
        followId,
        (news) => {
          // year 필터링
          const filteredNews = news.filter(
            (n: newsService.NewsItem) =>
              new Date(n.fullDate).getFullYear() === followingSelectedYear
          );

          // Map에 저장
          newsMap.set(followId, filteredNews);

          // 모든 뉴스를 합쳐서 업데이트
          const allNews = Array.from(newsMap.values()).flat();
          setFollowingNews(allNews);
          setLoading(false);
        },
        (error) => {
          console.error(`팔로잉 뉴스 구독 실패 (${followId}):`, error);
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // cleanup: 모든 구독 해제
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUserId, followingIds, followingSelectedYear]);

  // 선택된 뉴스의 댓글 실시간 구독
  useEffect(() => {
    if (!selectedNews) {
      setComments([]);
      return;
    }

    const unsubscribe = newsService.subscribeToComments(
      selectedNews.userId,
      selectedNews.id,
      (fetchedComments) => {
        setComments(fetchedComments);
      },
      (error) => {
        console.error("댓글 구독 실패:", error);
      }
    );

    // cleanup: 구독 해제
    return () => {
      unsubscribe();
    };
  }, [selectedNews]);

  const createNews = async (
    taskId: string,
    dueDate: string,
    useAI: boolean = false,
    imageURL: string = ""
  ) => {
    if (!currentUserId) return;
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("오류", "인증 정보를 찾을 수 없습니다");
        return;
      }

      const token = await user.getIdToken();
      await newsService.createNews(
        currentUserId,
        taskId,
        dueDate,
        token,
        imageURL
      );

      Alert.alert("성공", "AI 뉴스가 생성되었습니다!");
      // 구독 방식이므로 자동으로 업데이트됨
    } catch (error) {
      console.error("뉴스 생성 실패:", error);
      throw error;
    }
  };

  const updateNews = useCallback(
    async (
      newsId: string,
      title: string,
      content: string,
      imageUri?: string
    ) => {
      if (!currentUserId) return;

      try {
        await newsService.updateNews(currentUserId, newsId, {
          title,
          content,
          imageUri,
          removeImage: imageUri === null,
        });
        // 구독 방식이므로 자동으로 업데이트됨
      } catch (error) {
        console.error("뉴스 수정 실패:", error);
        throw error;
      }
    },
    [currentUserId]
  );

  const deleteNews = useCallback(
    async (newsId: string) => {
      if (!currentUserId) return;

      try {
        await newsService.deleteNews(currentUserId, newsId);

        // 삭제된 뉴스가 현재 선택된 뉴스라면 선택 해제
        if (selectedNews && selectedNews.id === newsId) {
          setSelectedNews(null);
          setComments([]);
        }
        // 구독 방식이므로 자동으로 업데이트됨
      } catch (error) {
        console.error("뉴스 삭제 실패:", error);
        throw error;
      }
    },
    [currentUserId, selectedNews]
  );

  const selectNews = useCallback((news: newsService.NewsItem | null) => {
    setSelectedNews(news);
    if (!news) {
      setComments([]);
    }
  }, []);

  const addComment = useCallback(
    async (newsUserId: string, newsId: string, content: string) => {
      if (!currentUserId || !currentUserData) return;

      try {
        await newsService.addComment(newsUserId, newsId, {
          userId: currentUserId,
          userName: currentUserData.name,
          userPhotoURL: currentUserData.photoURL,
          content,
        });
        // 구독 방식이므로 자동으로 업데이트됨
      } catch (error) {
        console.error("댓글 작성 실패:", error);
        throw error;
      }
    },
    [currentUserId, currentUserData]
  );

  const deleteComment = useCallback(
    async (newsUserId: string, newsId: string, commentId: string) => {
      try {
        await newsService.deleteComment(newsUserId, newsId, commentId);
        // 구독 방식이므로 자동으로 업데이트됨
      } catch (error) {
        console.error("댓글 삭제 실패:", error);
        throw error;
      }
    },
    []
  );

  const toggleNewsLike = useCallback(
    async (newsUserId: string, newsId: string) => {
      if (!currentUserId) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      try {
        // toggleNewsLike 함수가 있다면 사용
        // await newsService.toggleNewsLike(newsUserId, newsId, currentUserId);
        // 구독 방식이므로 자동으로 업데이트됨
      } catch (error) {
        console.error("뉴스 좋아요 실패:", error);
        Alert.alert("오류", "좋아요 처리에 실패했습니다.");
      }
    },
    [currentUserId]
  );

  const value: NewsContextType = {
    currentUserId,
    myNews,
    followingNews,
    selectedNews,
    comments,
    loading,
    selectedYear,
    followingSelectedYear,
    years,
    myNewsLikes,
    followingNewsLikes,
    createNews,
    updateNews,
    deleteNews,
    selectNews,
    addComment,
    deleteComment,
    setSelectedYear,
    setFollowingSelectedYear,
    toggleNewsLike,
  };

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error("useNews must be used within a NewsProvider");
  }
  return context;
};
