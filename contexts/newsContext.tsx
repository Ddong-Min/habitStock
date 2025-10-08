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
interface NewsContextType {
  // 상태
  currentUserId: string | null;
  myNews: newsApi.NewsItem[];
  followingNews: newsApi.NewsItem[];
  selectedNews: newsApi.NewsItem | null;
  comments: newsApi.Comment[];
  loading: boolean;

  // 함수
  loadMyNews: (year?: number) => Promise<void>;
  loadFollowingNews: () => Promise<void>;
  createNews: (title: string, content: string) => Promise<void>;
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
  const { user } = useAuth();

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
        if (year) {
          news = await newsApi.getUserNewsByYear(currentUserId, year);
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
    [currentUserId]
  );

  // 팔로잉 뉴스 로드
  const loadFollowingNews = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const news = await newsApi.getFollowingNewsFeed(currentUserId, 50);
      setFollowingNews(news);
    } catch (error) {
      console.error("팔로잉 뉴스 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // 뉴스 생성
  const createNews = useCallback(
    async (title: string, content: string) => {
      if (!currentUserId || !currentUserData) return;

      try {
        await newsApi.createNews(currentUserId, {
          title,
          content,
          userName: currentUserData.name,
          userPhotoURL: currentUserData.photoURL,
        });

        // 뉴스 목록 새로고침
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

        // 댓글 목록 새로고침
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
    loadMyNews,
    loadFollowingNews,
    createNews,
    deleteNews,
    selectNews,
    addComment,
    deleteComment,
    loadComments,
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
