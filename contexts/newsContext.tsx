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
  // 상태
  currentUserId: string | null;
  myNews: newsApi.NewsItem[];
  followingNews: newsApi.NewsItem[];
  selectedNews: newsApi.NewsItem | null;
  comments: newsApi.Comment[];
  loading: boolean;
  selectedYear: number;
  followingSelectedYear: number; // 팔로잉 뉴스용 년도
  years: number[];

  // 함수
  loadMyNews: (year?: number) => Promise<void>;
  loadFollowingNews: (year?: number) => Promise<void>;
  createNews: (
    taskId: string,
    dueDate: string,
    useAI?: boolean
  ) => Promise<void>;
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
  setFollowingSelectedYear: (year: number) => void; // 팔로잉 년도 선택
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [myNews, setMyNews] = useState<newsApi.NewsItem[]>([]);
  const [followingNews, setFollowingNews] = useState<newsApi.NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<newsApi.NewsItem | null>(
    null
  );
  const [comments, setComments] = useState<newsApi.Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [followingSelectedYear, setFollowingSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const { user } = useAuth();
  const { selectedFollowId } = useFollow();

  const years = Array.from([
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  ]);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    setCurrentUserId(user ? user.uid : null);
    setCurrentUserData(user);
  }, [user]);

  // 내 뉴스 로드
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
      } catch (error) {
        console.error("내 뉴스 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, selectedYear]
  );

  // selectedYear가 변경되면 자동으로 뉴스 로드
  useEffect(() => {
    if (currentUserId) {
      loadMyNews();
    }
  }, [selectedYear, currentUserId]);

  // 팔로잉 뉴스 로드 (년도 지원)
  const loadFollowingNews = useCallback(
    async (year?: number) => {
      if (!currentUserId) return;
      if (!selectedFollowId) return;
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
      } catch (error) {
        console.error("팔로잉 뉴스 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, followingSelectedYear, selectedFollowId]
  );

  // followingSelectedYear가 변경되면 자동으로 팔로잉 뉴스 로드
  useEffect(() => {
    if (selectedFollowId && currentUserId) {
      loadFollowingNews();
    }
  }, [followingSelectedYear, currentUserId, selectedFollowId]);

  // 뉴스 생성
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
          const functionsUrl = `https://asia-northeast3-habitstock-618dd.cloudfunctions.net/manualGenerateNews`;
          const params = new URLSearchParams({
            userId: currentUserId,
            taskId: taskId,
            date: dueDate,
          });

          const response = await fetch(`${functionsUrl}?${params.toString()}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "AI 뉴스 생성 실패");
          }

          const result = await response.json();
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

  // 뉴스 삭제
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

  // 뉴스 선택
  const selectNews = useCallback((news: newsApi.NewsItem | null) => {
    setSelectedNews(news);
    if (!news) {
      setComments([]);
    }
  }, []);

  // 댓글 로드
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

  // 댓글 작성
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

  // 댓글 삭제
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
    loadMyNews,
    loadFollowingNews,
    createNews,
    deleteNews,
    selectNews,
    addComment,
    deleteComment,
    loadComments,
    setSelectedYear,
    setFollowingSelectedYear,
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
