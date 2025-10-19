import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import * as newsApi from "../api/newsApi";
import { useAuth } from "./authContext";
import { Alert } from "react-native";
import { getAuth } from "firebase/auth";
import { useFollow } from "./followContext";

interface NewsContextType {
  currentUserId: string | null;
  myNews: newsApi.NewsItem[];
  followingNews: newsApi.NewsItem[];
  selectedNews: newsApi.NewsItem | null;
  comments: newsApi.Comment[];
  loading: boolean;
  selectedYear: number;
  followingSelectedYear: number;
  years: number[];
  myNewsLikes: Record<string, boolean>;
  followingNewsLikes: Record<string, boolean>;

  loadMyNews: (year?: number) => Promise<void>;
  loadFollowingNews: (year?: number) => Promise<void>;
  createNews: (
    taskId: string,
    dueDate: string,
    useAI?: boolean
  ) => Promise<void>;
  updateNews: (newsId: string, title: string, content: string) => Promise<void>;
  deleteNews: (newsId: string) => Promise<void>;
  selectNews: (news: newsApi.NewsItem | null) => void;
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
  loadComments: (newsUserId: string, newsId: string) => Promise<void>;
  setSelectedYear: (year: number) => void;
  setFollowingSelectedYear: (year: number) => void;
  toggleNewsLike: (newsUserId: string, newsId: string) => Promise<void>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); //현재 사용자 ID
  const [currentUserData, setCurrentUserData] = useState<any>(null); //현재 사용자 데이터
  const [myNews, setMyNews] = useState<newsApi.NewsItem[]>([]); //내 뉴스
  const [followingNews, setFollowingNews] = useState<newsApi.NewsItem[]>([]); //팔로잉 뉴스
  const [selectedNews, setSelectedNews] = useState<newsApi.NewsItem | null>(
    null
  ); //세부 보기를 선택한 뉴스
  const [comments, setComments] = useState<newsApi.Comment[]>([]); //선택한 뉴스의 댓글
  const [loading, setLoading] = useState(false); //로딩 상태
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  ); //내 뉴스 선택 연도
  const [followingSelectedYear, setFollowingSelectedYear] = useState<number>(
    new Date().getFullYear()
  ); //팔로잉 뉴스 선택 연도
  const [myNewsLikes, setMyNewsLikes] = useState<Record<string, boolean>>({}); //내 뉴스 좋아요 상태
  const [followingNewsLikes, setFollowingNewsLikes] = useState<
    Record<string, boolean>
  >({}); //팔로잉 뉴스 좋아요 상태
  const { user } = useAuth();
  const { selectedFollowId } = useFollow();

  const years = Array.from([
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  ]);

  useEffect(() => {
    setCurrentUserId(user ? user.uid : null);
    setCurrentUserData(user);
  }, [user]);

  //내 뉴스를 가져옴
  const loadMyNews = useCallback(
    async (year?: number) => {
      if (!currentUserId) return;

      setLoading(true);
      try {
        let news;
        const targetYear = year ?? selectedYear;

        if (targetYear) {
          news = await newsApi.getUserNewsByYear(currentUserId, targetYear);
        } else {
          news = await newsApi.getUserNews(currentUserId);
        }
        setMyNews(news);
        const likes = await newsApi.getUserNewsLikes(
          currentUserId,
          currentUserId
        );
        setMyNewsLikes(likes);
      } catch (error) {
        console.error("내 뉴스 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, selectedYear]
  );

  //처음에 로드할때 일정 개수의 뉴스를 불러옴
  useEffect(() => {
    if (currentUserId) {
      loadMyNews();
    }
  }, [selectedYear, currentUserId]);

  const loadFollowingNews = useCallback(
    async (year?: number) => {
      if (!currentUserId || !selectedFollowId) return;
      setLoading(true);
      try {
        let news;
        const targetYear = year ?? followingSelectedYear;
        if (targetYear) {
          news = await newsApi.getFollowingNewsFeed(
            selectedFollowId,
            targetYear
          );
        } else {
          news = await newsApi.getFollowingNewsFeed(selectedFollowId);
        }

        setFollowingNews(news);
        const likes = await newsApi.getUserNewsLikes(
          selectedFollowId,
          currentUserId
        );
        setFollowingNewsLikes(likes);
      } catch (error) {
        console.error("팔로잉 뉴스 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, followingSelectedYear, selectedFollowId]
  );

  useEffect(() => {
    if (selectedFollowId && currentUserId) {
      loadFollowingNews();
    }
  }, [followingSelectedYear, currentUserId, selectedFollowId]);

  const createNews = useCallback(
    async (taskId: string, dueDate: string, useAI: boolean = false) => {
      if (!currentUserId || !currentUserData) return;

      try {
        if (useAI) {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) {
            Alert.alert("오류", "인증 정보를 찾을 수 없습니다");
            return;
          }

          const token = await user.getIdToken();
          await newsApi.createAiNews(currentUserId, taskId, dueDate, token);

          Alert.alert("성공", "AI 뉴스가 생성되었습니다!");
        } else {
          Alert.alert("오류", "아직 구현되지 않은 기능입니다.");
        }

        await loadMyNews();
      } catch (error) {
        console.error("뉴스 생성 실패:", error);
        throw error;
      }
    },
    [currentUserId, currentUserData, loadMyNews]
  );

  const updateNews = useCallback(
    async (newsId: string, title: string, content: string) => {
      if (!currentUserId) return;

      try {
        await newsApi.updateNews(currentUserId, newsId, {
          title,
          content,
        });
        await loadMyNews();
      } catch (error) {
        console.error("뉴스 수정 실패:", error);
        throw error;
      }
    },
    [currentUserId, loadMyNews]
  );

  const deleteNews = useCallback(
    async (newsId: string) => {
      if (!currentUserId) return;

      try {
        await newsApi.deleteNews(currentUserId, newsId);
        await loadMyNews();
      } catch (error) {
        console.error("뉴스 삭제 실패:", error);
        throw error;
      }
    },
    [currentUserId, loadMyNews]
  );

  const selectNews = useCallback((news: newsApi.NewsItem | null) => {
    setSelectedNews(news);
    if (!news) {
      setComments([]);
    }
  }, []);

  const loadComments = useCallback(
    async (newsUserId: string, newsId: string) => {
      try {
        const fetchedComments = await newsApi.getComments(newsUserId, newsId);
        setComments(fetchedComments);
      } catch (error) {
        console.error("댓글 로드 실패:", error);
      }
    },
    []
  );

  const addComment = useCallback(
    async (newsUserId: string, newsId: string, content: string) => {
      if (!currentUserId || !currentUserData) return;

      try {
        await newsApi.addComment(newsUserId, newsId, {
          userId: currentUserId,
          userName: currentUserData.name,
          userPhotoURL: currentUserData.photoURL,
          content,
        });

        await loadComments(newsUserId, newsId);
      } catch (error) {
        console.error("댓글 작성 실패:", error);
        throw error;
      }
    },
    [currentUserId, currentUserData, loadComments]
  );

  const deleteComment = useCallback(
    async (newsUserId: string, newsId: string, commentId: string) => {
      try {
        await newsApi.deleteComment(newsUserId, newsId, commentId);
        await loadComments(newsUserId, newsId);
      } catch (error) {
        console.error("댓글 삭제 실패:", error);
        throw error;
      }
    },
    [loadComments]
  );

  const toggleNewsLike = useCallback(
    async (newsUserId: string, newsId: string) => {
      if (!currentUserId) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      try {
        await newsApi.toggleNewsLike(newsUserId, newsId, currentUserId);

        if (newsUserId === currentUserId) {
          await loadMyNews();
        } else {
          await loadFollowingNews();
        }
      } catch (error) {
        console.error("뉴스 좋아요 실패:", error);
        Alert.alert("오류", "좋아요 처리에 실패했습니다.");
      }
    },
    [currentUserId, loadMyNews, loadFollowingNews]
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
    loadMyNews,
    loadFollowingNews,
    createNews,
    updateNews,
    deleteNews,
    selectNews,
    addComment,
    deleteComment,
    loadComments,
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
