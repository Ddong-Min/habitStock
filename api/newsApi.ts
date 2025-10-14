import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";

export interface NewsItemType {
  id?: string;
  title: string;
  content: string;
  date: string;
}

export interface NewsItem {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  content: string;
  date: string; // "06-30" 형식
  fullDate: string; // "2025-06-30" 형식
  createdAt: Timestamp;
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
}

// 새로운 구조:
// users/{userId}/data/news (문서)
// 문서 내부: { "newsId1": { ...newsData }, "newsId2": { ...newsData } }
// users/{userId}/data/comments (문서)
// 문서 내부: { "newsId1": { "commentId1": {...}, "commentId2": {...} } }

// 뉴스 생성
export const createNews = async (
  userId: string,
  newsData: {
    title: string;
    content: string;
    userName: string;
    userPhotoURL?: string;
  }
): Promise<string> => {
  try {
    const now = new Date();
    const newsId = `news_${now.getTime()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const docRef = doc(firestore, "users", userId, "data", "news");
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};

    const newNews = {
      id: newsId,
      userId,
      userName: newsData.userName,
      userPhotoURL: newsData.userPhotoURL || null,
      title: newsData.title,
      content: newsData.content,
      date: `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`,
      fullDate: now.toISOString().split("T")[0],
      createdAt: Timestamp.now(),
      likesCount: 0,
      commentsCount: 0,
    };

    currentData[newsId] = newNews;
    await setDoc(docRef, currentData, { merge: true });

    console.log("✅ 뉴스 생성 완료:", newsId);
    return newsId;
  } catch (error) {
    console.error("❌ 뉴스 생성 실패:", error);
    throw error;
  }
};

// 특정 유저의 뉴스 전체 가져오기
export const getUserNews = async (userId: string): Promise<NewsItem[]> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "news");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return [];
    }

    const allData = docSnap.data();
    const newsArray = Object.values(allData) as NewsItem[];

    // createdAt 기준 내림차순 정렬
    return newsArray.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("❌ 유저 뉴스 가져오기 실패:", error);
    return [];
  }
};

// 특정 연도의 뉴스만 가져오기
export const getUserNewsByYear = async (
  userId: string,
  year: number
): Promise<NewsItem[]> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "news");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return [];
    }

    const allData = docSnap.data();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const newsArray = Object.values(allData).filter((news: any) => {
      return news.fullDate >= startDate && news.fullDate <= endDate;
    }) as NewsItem[];

    // fullDate 기준 내림차순 정렬
    return newsArray.sort((a, b) => b.fullDate.localeCompare(a.fullDate));
  } catch (error) {
    console.error("❌ 연도별 뉴스 가져오기 실패:", error);
    return [];
  }
};

// 팔로우한 유저들의 최신 뉴스 가져오기 (피드)
export const getFollowingNewsFeed = async (
  followingId: string,
  limitCount: number = 50
): Promise<NewsItem[]> => {
  try {
    console.log("Fetching news for following IDs:", followingId);

    const allNews: NewsItem[] = [];

    const docRef = doc(firestore, "users", followingId, "data", "news");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const newsArray = Object.values(userData) as NewsItem[];
      allNews.push(...newsArray);
    }

    // 시간순 정렬 및 제한
    return allNews
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error("❌ 팔로잉 뉴스 피드 가져오기 실패:", error);
    return [];
  }
};

// 뉴스 삭제
export const deleteNews = async (
  userId: string,
  newsId: string
): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "news");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("News document not found");
    }

    const currentData = docSnap.data();

    if (currentData[newsId]) {
      delete currentData[newsId];
      await setDoc(docRef, currentData);

      // 해당 뉴스의 댓글도 삭제
      const commentsDocRef = doc(
        firestore,
        "users",
        userId,
        "data",
        "comments"
      );
      const commentsSnap = await getDoc(commentsDocRef);

      if (commentsSnap.exists()) {
        const commentsData = commentsSnap.data();
        if (commentsData[newsId]) {
          delete commentsData[newsId];
          await setDoc(commentsDocRef, commentsData);
        }
      }

      console.log("✅ 뉴스 삭제 완료:", newsId);
    }
  } catch (error) {
    console.error("❌ 뉴스 삭제 실패:", error);
    throw error;
  }
};

// ============================================
// 댓글 CRUD
// ============================================

// 댓글 작성
export const addComment = async (
  newsUserId: string,
  newsId: string,
  commentData: {
    userId: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
  }
): Promise<string> => {
  try {
    const commentId = `comment_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // 댓글 추가
    const commentsDocRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "comments"
    );
    const commentsSnap = await getDoc(commentsDocRef);
    const commentsData = commentsSnap.exists() ? commentsSnap.data() : {};

    if (!commentsData[newsId]) {
      commentsData[newsId] = {};
    }

    const newComment = {
      id: commentId,
      newsId,
      userId: commentData.userId,
      userName: commentData.userName,
      userPhotoURL: commentData.userPhotoURL || null,
      content: commentData.content,
      createdAt: Timestamp.now(),
    };

    commentsData[newsId][commentId] = newComment;
    await setDoc(commentsDocRef, commentsData, { merge: true });

    // 댓글 카운트 증가
    const newsDocRef = doc(firestore, "users", newsUserId, "data", "news");
    const newsSnap = await getDoc(newsDocRef);

    if (newsSnap.exists()) {
      const newsData = newsSnap.data();
      if (newsData[newsId]) {
        newsData[newsId].commentsCount =
          (newsData[newsId].commentsCount || 0) + 1;
        await setDoc(newsDocRef, newsData, { merge: true });
      }
    }

    console.log("✅ 댓글 작성 완료:", commentId);
    return commentId;
  } catch (error) {
    console.error("❌ 댓글 작성 실패:", error);
    throw error;
  }
};

// 댓글 가져오기
export const getComments = async (
  newsUserId: string,
  newsId: string
): Promise<Comment[]> => {
  try {
    const docRef = doc(firestore, "users", newsUserId, "data", "comments");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || !docSnap.data()[newsId]) {
      return [];
    }

    const newsComments = docSnap.data()[newsId];
    const commentsArray = Object.values(newsComments) as Comment[];

    // createdAt 기준 오름차순 정렬
    return commentsArray.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeA - timeB;
    });
  } catch (error) {
    console.error("❌ 댓글 가져오기 실패:", error);
    return [];
  }
};

// 댓글 실시간 구독
export const subscribeToComments = (
  newsUserId: string,
  newsId: string,
  onUpdate: (comments: Comment[]) => void
) => {
  const docRef = doc(firestore, "users", newsUserId, "data", "comments");

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists() || !docSnap.data()[newsId]) {
      onUpdate([]);
      return;
    }

    const newsComments = docSnap.data()[newsId];
    const commentsArray = Object.values(newsComments) as Comment[];

    // createdAt 기준 오름차순 정렬
    const sortedComments = commentsArray.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeA - timeB;
    });

    onUpdate(sortedComments);
  });
};

// 댓글 삭제
export const deleteComment = async (
  newsUserId: string,
  newsId: string,
  commentId: string
): Promise<void> => {
  try {
    // 댓글 삭제
    const commentsDocRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "comments"
    );
    const commentsSnap = await getDoc(commentsDocRef);

    if (commentsSnap.exists()) {
      const commentsData = commentsSnap.data();

      if (commentsData[newsId] && commentsData[newsId][commentId]) {
        delete commentsData[newsId][commentId];

        // 해당 뉴스에 댓글이 더 이상 없으면 newsId 키도 삭제
        if (Object.keys(commentsData[newsId]).length === 0) {
          delete commentsData[newsId];
        }

        await setDoc(commentsDocRef, commentsData);
      }
    }

    // 댓글 카운트 감소
    const newsDocRef = doc(firestore, "users", newsUserId, "data", "news");
    const newsSnap = await getDoc(newsDocRef);

    if (newsSnap.exists()) {
      const newsData = newsSnap.data();
      if (newsData[newsId]) {
        const currentCount = newsData[newsId].commentsCount || 0;
        newsData[newsId].commentsCount = Math.max(0, currentCount - 1);
        await setDoc(newsDocRef, newsData, { merge: true });
      }
    }

    console.log("✅ 댓글 삭제 완료:", commentId);
  } catch (error) {
    console.error("❌ 댓글 삭제 실패:", error);
    throw error;
  }
};
