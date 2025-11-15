import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import * as newsService from "../api/newsApi";
import { useAuth } from "./authContext";
import { Alert } from "react-native";
import { auth } from "../config/firebase";
import { customLogEvent } from "@/events/appEvent";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

const newsItemToFeedItem = (
  news: newsService.NewsItem
): newsService.FeedItem => ({
  id: news.id,
  newsUserId: news.userId,
  newsUserName: news.userName,
  newsUserPhotoURL: news.userPhotoURL,
  imageURL: news.imageURL,
  title: news.title,
  content: news.content,
  date: news.date,
  fullDate: news.fullDate,
  createdAt: news.createdAt,
  likesCount: news.likesCount || 0,
  commentsCount: news.commentsCount || 0,
});

interface FeedCacheData {
  items: newsService.FeedItem[];
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
  hasMore: boolean;
}

interface NewsContextType {
  currentUserId: string | null;
  // --- 프로필 탭 (My News) 관련 ---
  myNews: newsService.NewsItem[];
  myNewsLoading: boolean;
  myNewsLoadingMore: boolean;
  myNewsHasMore: boolean;
  selectedYear: number;
  years: number[];
  loadMoreMyNews: () => Promise<void>;
  refreshMyNews: () => Promise<void>;
  setSelectedYear: (year: number) => void;
  initMyNewsTab: () => void; // 👈 [신규] 프로필 탭 초기화 함수

  // --- 뉴스 탭 (Feed) 관련 ---
  feedItems: newsService.FeedItem[];
  feedLoading: boolean;
  feedLoadingMore: boolean;
  feedHasMore: boolean;
  filterUserId: string | null;
  setFilterUserId: (userId: string | null) => void;
  loadMoreFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  initNewsTab: () => void; // 👈 [신규] 뉴스 탭 초기화 함수

  // --- 공용 ---
  selectedNews: newsService.NewsItem | null;
  comments: newsService.Comment[];
  myNewsLikes: Record<string, boolean>;
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
    imageUri?: string | null
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
  toggleNewsLike: (newsUserId: string, newsId: string) => Promise<void>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const [selectedNews, setSelectedNews] = useState<newsService.NewsItem | null>(
    null
  );
  const [comments, setComments] = useState<newsService.Comment[]>([]);
  const [myNewsLikes, setMyNewsLikes] = useState<Record<string, boolean>>({});

  const PAGE_SIZE = 10;
  const years = Array.from([
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  ]);

  // --- 뉴스 탭 (Feed) State ---
  const [feedItems, setFeedItems] = useState<newsService.FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [filterUserId, _setFilterUserId] = useState<string | null>(null);
  const feedLastDocRef =
    useRef<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [feedCache, setFeedCache] = useState<Record<string, FeedCacheData>>({});
  const filterUserIdRef = useRef(filterUserId);

  // --- [신규] 초기화 상태 플래그 ---
  const [isFeedInitialized, setIsFeedInitialized] = useState(false);
  const [isMyNewsInitialized, setIsMyNewsInitialized] = useState(false);
  const [isLikesInitialized, setIsLikesInitialized] = useState(false);
  const likesUnsubscribeRef = useRef<(() => void) | null>(null);

  // --- 프로필 탭 (My News) State ---
  const [myNews, setMyNews] = useState<newsService.NewsItem[]>([]);
  const [myNewsLoading, setMyNewsLoading] = useState(false);
  const [myNewsLoadingMore, setMyNewsLoadingMore] = useState(false);
  const [myNewsHasMore, setMyNewsHasMore] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const myNewsLastDocRef =
    useRef<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);

  useEffect(() => {
    setCurrentUserId(user ? user.uid : null);
    setCurrentUserData(user);
  }, [user]);

  // --- Hoisting 오류 해결을 위해 함수 선언을 useEffect 위로 이동 ---

  // =============================================
  // --- 뉴스 탭 (Feed) 함수들 ---
  // =============================================

  /**
   * 새로고침 함수
   */
  const refreshFeed = useCallback(
    async (forceFilterId?: string | null, isFilterChange = false) => {
      if (!currentUserId) return;

      if (!isFilterChange) {
        setFeedLoading(true);
      }

      const filterToRefresh =
        forceFilterId !== undefined ? forceFilterId : filterUserIdRef.current;
      const cacheKey = filterToRefresh ?? "ALL"; //선택된 ID가 있으면 해당 ID, 없으면 "ALL"

      console.log(`refreshFeed 호출 (필터: ${filterToRefresh})`);

      feedLastDocRef.current = null; // 마지막 문서 초기화

      try {
        let result: {
          feeds?: newsService.FeedItem[];
          news?: newsService.NewsItem[];
          lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
          hasMore: boolean;
        };
        let itemsToCache: newsService.FeedItem[];

        if (filterToRefresh === null) {
          result = await newsService.getFeedWithPagination(
            currentUserId,
            PAGE_SIZE
          );
          itemsToCache = result.feeds || [];
        } else {
          result = await newsService.getNewsWithPagination(
            filterToRefresh,
            PAGE_SIZE
          );
          itemsToCache = (result.news || []).map(newsItemToFeedItem); //map안에 함수넣으면 그 함수로 변환된 값이 나옴
        }

        setFeedItems(itemsToCache);
        feedLastDocRef.current = result.lastDoc;
        setFeedHasMore(result.hasMore);

        setFeedCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: {
            items: itemsToCache,
            lastDoc: result.lastDoc,
            hasMore: result.hasMore,
          },
        }));
      } catch (error) {
        console.error("Feed 새로고침 실패:", error);
      } finally {
        setFeedLoading(false);
      }
    },
    [currentUserId]
  );

  /**
   * [수정] 더보기 함수
   */
  const loadMoreFeed = useCallback(async () => {
    const currentFilter = filterUserIdRef.current;
    const cacheKey = currentFilter ?? "ALL";

    if (!currentUserId || feedLoadingMore || !feedHasMore) return;

    console.log(`loadMoreFeed 호출 (필터: ${currentFilter})`);
    setFeedLoadingMore(true);

    try {
      let newItems: newsService.FeedItem[];
      let newLastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
      let newHasMore: boolean;

      if (currentFilter === null) {
        const result = await newsService.getFeedWithPagination(
          currentUserId,
          PAGE_SIZE,
          feedLastDocRef.current || undefined
        );
        newItems = result.feeds;
        newLastDoc = result.lastDoc;
        newHasMore = result.hasMore;
      } else {
        const result = await newsService.getNewsWithPagination(
          currentFilter,
          PAGE_SIZE,
          feedLastDocRef.current || undefined
        );
        newItems = result.news.map(newsItemToFeedItem);
        newLastDoc = result.lastDoc;
        newHasMore = result.hasMore;
      }

      if (newItems.length > 0) {
        setFeedItems((prev) => [...prev, ...newItems]);
        feedLastDocRef.current = newLastDoc;
        setFeedHasMore(newHasMore);

        setFeedCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: {
            items: [...(prevCache[cacheKey]?.items || []), ...newItems],
            lastDoc: newLastDoc,
            hasMore: newHasMore,
          },
        }));
      } else {
        setFeedHasMore(false);
        setFeedCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: {
            ...prevCache[cacheKey],
            hasMore: false,
          },
        }));
      }
    } catch (error) {
      console.error("Feed 더보기 실패:", error);
    } finally {
      setFeedLoadingMore(false);
    }
  }, [currentUserId, feedLoadingMore, feedHasMore]);

  /**
   * [신규] 필터 변경 함수 (캐시 로직 포함)
   */

  const setFilterUserId = (newFilterId: string | null) => {
    if (newFilterId === filterUserIdRef.current) return;

    console.log(`필터 변경 시도: ${newFilterId}`);
    _setFilterUserId(newFilterId);
    filterUserIdRef.current = newFilterId;

    const cacheKey = newFilterId ?? "ALL";
    if (feedCache[cacheKey]) {
      console.log(`캐시 히트: ${cacheKey}`);
      const cachedData = feedCache[cacheKey];
      setFeedItems(cachedData.items);
      feedLastDocRef.current = cachedData.lastDoc;
      setFeedHasMore(cachedData.hasMore);
    } else {
      console.log(`캐시 미스: ${cacheKey}, DB에서 새로고침`);
      setFeedItems([]);
      feedLastDocRef.current = null;
      refreshFeed(newFilterId, true);
    }
  };

  // =============================================
  // --- 프로필 탭 (My News) 함수들 ---
  // =============================================

  const refreshMyNews = useCallback(
    async (isUserChangeOrInit = false) => {
      if (!currentUserId) return;

      if (!isUserChangeOrInit) {
        // '당겨서 새로고침' 시에만
        setMyNewsLoading(true);
      }

      console.log("refreshMyNews 호출");
      myNewsLastDocRef.current = null;

      try {
        const result = await newsService.getNewsWithPagination(
          currentUserId,
          PAGE_SIZE
        );
        setMyNews(result.news);
        myNewsLastDocRef.current = result.lastDoc;
        setMyNewsHasMore(result.hasMore);
      } catch (error) {
        console.error("My News 새로고침 실패:", error);
      } finally {
        setMyNewsLoading(false);
      }
    },
    [currentUserId]
  );

  const loadMoreMyNews = useCallback(async () => {
    if (!currentUserId || myNewsLoadingMore || !myNewsHasMore) return;

    console.log("loadMoreMyNews 호출");
    setMyNewsLoadingMore(true);

    try {
      const result = await newsService.getNewsWithPagination(
        currentUserId,
        PAGE_SIZE,
        myNewsLastDocRef.current || undefined
      );
      if (result.news.length > 0) {
        setMyNews((prev) => [...prev, ...result.news]);
        myNewsLastDocRef.current = result.lastDoc;
        setMyNewsHasMore(result.hasMore);
      } else {
        setMyNewsHasMore(false);
      }
    } catch (error) {
      console.error("My News 더보기 실패:", error);
    } finally {
      setMyNewsLoadingMore(false);
    }
  }, [currentUserId, myNewsLoadingMore, myNewsHasMore]);

  // --- [신규] '좋아요 목록'을 수동으로 구독하는 함수 ---
  const initLikesSubscription = useCallback(() => {
    if (!currentUserId || isLikesInitialized) return; // 이미 구독 중이면 무시

    console.log("🔥 좋아요 목록 구독 시작...");
    setIsLikesInitialized(true);

    const unsubscribe = newsService.subscribeToMyNewsLikes(
      currentUserId,
      setMyNewsLikes,
      console.error
    );
    likesUnsubscribeRef.current = unsubscribe; // 구독 해제 함수 저장
  }, [currentUserId, isLikesInitialized]);

  /**
   * [신규] 뉴스 탭 초기화 함수 (News 탭이 마운트될 때 호출)
   */
  const initNewsTab = useCallback(() => {
    if (!currentUserId || isFeedInitialized) return;
    console.log("🔥 뉴스 탭 초기화 (피드 로드 + 좋아요 구독)");
    setIsFeedInitialized(true);
    setFeedLoading(true); // 👈 여기서 로딩 시작
    refreshFeed(null, true); // 👈 여기서 또 로딩 + 데이터 로드
    initLikesSubscription();
  }, [currentUserId, isFeedInitialized, refreshFeed, initLikesSubscription]);

  /**
   * [신규] 프로필 탭 초기화 함수 (프로필 탭이 마운트될 때 호출)
   */
  const initMyNewsTab = useCallback(() => {
    if (!currentUserId || isMyNewsInitialized) return; // 이미 초기화됐으면 무시

    console.log("🔥 프로필 탭(My News) 초기화");
    setIsMyNewsInitialized(true);
    setMyNewsLoading(true); // 👈 로딩 시작
    refreshMyNews(true); // '내 뉴스' 1페이지 로드
  }, [currentUserId, isMyNewsInitialized, refreshMyNews]);

  // --- [수정] 유저가 바뀌면 모든 데이터/캐시/플래그 초기화 ---
  useEffect(() => {
    if (currentUserId) {
      console.log("유저 변경, 모든 상태 초기화 (데이터 로드 안 함)");
      // 캐시 및 상태 초기화
      setFeedCache({});
      _setFilterUserId(null);
      filterUserIdRef.current = null;
      setFeedItems([]);
      setMyNews([]);
      setMyNewsLikes({});

      // 플래그 초기화
      setIsFeedInitialized(false);
      setIsMyNewsInitialized(false);
      setIsLikesInitialized(false);

      // 기존 구독 해제
      if (likesUnsubscribeRef.current) {
        likesUnsubscribeRef.current();
        likesUnsubscribeRef.current = null;
      }
    } else {
      // 로그아웃 시
      setFeedItems([]);
      setMyNews([]);
      setFeedCache({});
      setMyNewsLikes({});
      setFeedHasMore(true);
      setMyNewsHasMore(true);
      feedLastDocRef.current = null;
      myNewsLastDocRef.current = null;
      setIsFeedInitialized(false);
      setIsMyNewsInitialized(false);
      setIsLikesInitialized(false);
      if (likesUnsubscribeRef.current) {
        likesUnsubscribeRef.current();
        likesUnsubscribeRef.current = null;
      }
    }
  }, [currentUserId]); // 👈 `refreshFeed`와 `refreshMyNews` 의존성 제거

  // --- [유지] 댓글 구독 (selectedNews 의존성) ---
  useEffect(() => {
    if (!selectedNews) {
      setComments([]);
      return;
    }
    const unsubscribe = newsService.subscribeToComments(
      selectedNews.userId,
      selectedNews.id,
      setComments,
      console.error
    );
    return () => unsubscribe();
  }, [selectedNews]);

  // =============================================
  // --- 공용 함수들 (이하 동일) ---
  // =============================================

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

      setFeedCache({});
      refreshFeed(filterUserIdRef.current);
      refreshMyNews();
    } catch (error) {
      console.error("뉴스 생성 실패:", error);
      throw error;
    }
  };

  const deleteNews = useCallback(
    async (newsId: string) => {
      if (!currentUserId) return;

      const prevFeedItems = feedItems;
      const prevMyNews = myNews;
      const prevCache = feedCache;

      setFeedItems((prev) => prev.filter((item) => item.id !== newsId));
      setMyNews((prev) => prev.filter((item) => item.id !== newsId));

      const newCache = { ...prevCache };
      Object.keys(newCache).forEach((key) => {
        newCache[key] = {
          ...newCache[key],
          items: newCache[key].items.filter((item) => item.id !== newsId),
        };
      });
      setFeedCache(newCache);

      if (selectedNews && selectedNews.id === newsId) {
        setSelectedNews(null);
        setComments([]);
      }

      try {
        customLogEvent({ eventName: "delete_news" });
        await newsService.deleteNews(currentUserId, newsId);
      } catch (error) {
        console.error("뉴스 삭제 실패:", error);
        setFeedItems(prevFeedItems);
        setMyNews(prevMyNews);
        setFeedCache(prevCache);
        throw error;
      }
    },
    [currentUserId, selectedNews, feedItems, myNews, feedCache]
  );

  const updateNews = useCallback(
    async (
      newsId: string,
      title: string,
      content: string,
      imageUri?: string | null
    ) => {
      if (!currentUserId) return;
      try {
        await newsService.updateNews(currentUserId, newsId, {
          title,
          content,
          imageUri,
          removeImage: imageUri === null,
        });

        setFeedCache({});
        refreshFeed(filterUserIdRef.current);
        refreshMyNews();
      } catch (error) {
        console.error("뉴스 수정 실패:", error);
        throw error;
      }
    },
    [currentUserId, refreshFeed, refreshMyNews] // 👈 의존성 다시 추가
  );

  const selectNews = useCallback((news: newsService.NewsItem | null) => {
    const eventName = news ? "select_news" : "disSelect_news";
    customLogEvent({ eventName: eventName });
    setSelectedNews(news);
    if (!news) {
      setComments([]);
    }
  }, []);

  const updateCommentCountInStateAndCache = (
    newsId: string,
    incrementValue: number
  ) => {
    const updateCount = (items: any[]) =>
      items.map((item) =>
        item.id === newsId
          ? {
              ...item,
              commentsCount: Math.max(
                0,
                (item.commentsCount || 0) + incrementValue
              ),
            }
          : item
      );

    setFeedItems(updateCount);
    setMyNews(updateCount);

    const newCache = { ...feedCache };
    Object.keys(newCache).forEach((key) => {
      newCache[key] = {
        ...newCache[key],
        items: updateCount(newCache[key].items),
      };
    });
    setFeedCache(newCache);
  };

  const addComment = useCallback(
    async (newsUserId: string, newsId: string, content: string) => {
      if (!currentUserId || !currentUserData) return;
      try {
        customLogEvent({ eventName: "add_comment" });
        await newsService.addComment(newsUserId, newsId, {
          userId: currentUserId,
          userName: currentUserData.name,
          userPhotoURL: currentUserData.photoURL,
          content,
        });
        updateCommentCountInStateAndCache(newsId, 1);
      } catch (error) {
        console.error("댓글 작성 실패:", error);
        throw error;
      }
    },
    [currentUserId, currentUserData, feedCache]
  );

  const deleteComment = useCallback(
    async (newsUserId: string, newsId: string, commentId: string) => {
      try {
        customLogEvent({ eventName: "delete_comment" });
        await newsService.deleteComment(newsUserId, newsId, commentId);
        updateCommentCountInStateAndCache(newsId, -1);
      } catch (error) {
        console.error("댓글 삭제 실패:", error);
        throw error;
      }
    },
    [feedCache]
  );

  const toggleNewsLike = useCallback(
    async (newsUserId: string, newsId: string) => {
      if (!currentUserId) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const isLiked = !!myNewsLikes[newsId];
      const incrementValue = isLiked ? -1 : 1;

      setMyNewsLikes((prev) => ({ ...prev, [newsId]: !isLiked }));

      const updateCount = (items: any[]) =>
        items.map((item) =>
          item.id === newsId
            ? {
                ...item,
                likesCount: Math.max(
                  0,
                  (item.likesCount || 0) + incrementValue
                ),
              }
            : item
        );

      setFeedItems(updateCount);
      setMyNews(updateCount);

      const newCache = { ...feedCache };
      Object.keys(newCache).forEach((key) => {
        newCache[key] = {
          ...newCache[key],
          items: updateCount(newCache[key].items),
        };
      });
      setFeedCache(newCache);

      try {
        customLogEvent({ eventName: "toggle_news_like" });
        await newsService.toggleNewsLike(newsUserId, newsId, currentUserId);
      } catch (error) {
        console.error("뉴스 좋아요 실패:", error);
        customLogEvent({ eventName: "fail_toggle_news_like" });
        Alert.alert("오류", "좋아요 처리에 실패했습니다.");

        setMyNewsLikes((prev) => ({ ...prev, [newsId]: isLiked }));
        const rollbackCount = (items: any[]) =>
          items.map((item) =>
            item.id === newsId
              ? {
                  ...item,
                  likesCount: Math.max(
                    0,
                    (item.likesCount || 0) - incrementValue
                  ),
                }
              : item
          );
        setFeedItems(rollbackCount);
        setMyNews(rollbackCount);

        const rollbackCache = { ...feedCache };
        Object.keys(rollbackCache).forEach((key) => {
          rollbackCache[key] = {
            ...rollbackCache[key],
            items: rollbackCount(rollbackCache[key].items),
          };
        });
        setFeedCache(rollbackCache);
      }
    },
    [currentUserId, myNewsLikes, feedCache]
  );

  const value: NewsContextType = {
    currentUserId,
    // My News
    myNews,
    myNewsLoading,
    myNewsLoadingMore,
    myNewsHasMore,
    selectedYear,
    years,
    loadMoreMyNews,
    refreshMyNews,
    setSelectedYear,
    initMyNewsTab,
    // Feed
    feedItems,
    feedLoading,
    feedLoadingMore,
    feedHasMore,
    filterUserId: filterUserIdRef.current,
    setFilterUserId,
    loadMoreFeed,
    refreshFeed,
    initNewsTab,
    // 공용
    selectedNews,
    comments,
    myNewsLikes,
    createNews,
    updateNews,
    deleteNews,
    selectNews,
    addComment,
    deleteComment,
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
