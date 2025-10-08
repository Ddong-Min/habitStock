import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  addDoc,
  orderBy,
  limit,
  getDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";

export interface NewsItemType {
  id?: string; // Firestore will auto-generate this
  title: string;
  content: string;
  date: string; // ISO date string
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
    const newsRef = collection(firestore, "users", userId, "news");

    const newNews = {
      userId,
      userName: newsData.userName,
      userPhotoURL: newsData.userPhotoURL || null,
      title: newsData.title,
      content: newsData.content,
      date: `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`,
      fullDate: now.toISOString().split("T")[0],
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    };

    const docRef = await addDoc(newsRef, newNews);
    console.log("✅ 뉴스 생성 완료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ 뉴스 생성 실패:", error);
    throw error;
  }
};

// 특정 유저의 뉴스 전체 가져오기
export const getUserNews = async (userId: string): Promise<NewsItem[]> => {
  try {
    const newsRef = collection(firestore, "users", userId, "news");
    const q = query(newsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as NewsItem[];
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
    const newsRef = collection(firestore, "users", userId, "news");
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const q = query(
      newsRef,
      where("fullDate", ">=", startDate),
      where("fullDate", "<=", endDate),
      orderBy("fullDate", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as NewsItem[];
  } catch (error) {
    console.error("❌ 연도별 뉴스 가져오기 실패:", error);
    return [];
  }
};

// 팔로우한 유저들의 최신 뉴스 가져오기 (피드)
export const getFollowingNewsFeed = async (
  currentUserId: string,
  limitCount: number = 50
): Promise<NewsItem[]> => {
  try {
    // 1. 팔로잉 목록 가져오기
    const followingRef = collection(
      firestore,
      "following",
      currentUserId,
      "userFollowing"
    );
    const followingSnapshot = await getDocs(followingRef);
    const followingIds = followingSnapshot.docs.map((doc) => doc.id);

    if (followingIds.length === 0) {
      return [];
    }

    // 2. 각 팔로우 유저의 뉴스 가져오기
    const allNews: NewsItem[] = [];

    for (const followingId of followingIds) {
      const newsRef = collection(firestore, "users", followingId, "news");
      const q = query(newsRef, orderBy("createdAt", "desc"), limit(10));
      const newsSnapshot = await getDocs(q);

      const news = newsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsItem[];

      allNews.push(...news);
    }

    // 3. 시간순 정렬 및 제한
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
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    await deleteDoc(newsRef);
    console.log("✅ 뉴스 삭제 완료:", newsId);
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
    const commentsRef = collection(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments"
    );

    const newComment = {
      newsId,
      userId: commentData.userId,
      userName: commentData.userName,
      userPhotoURL: commentData.userPhotoURL || null,
      content: commentData.content,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(commentsRef, newComment);

    // 댓글 카운트 증가
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    await setDoc(
      newsRef,
      {
        commentsCount: (await getDoc(newsRef)).data()?.commentsCount || 0 + 1,
      },
      { merge: true }
    );

    console.log("✅ 댓글 작성 완료:", docRef.id);
    return docRef.id;
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
    const commentsRef = collection(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments"
    );
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
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
  const commentsRef = collection(
    firestore,
    "users",
    newsUserId,
    "news",
    newsId,
    "comments"
  );
  const q = query(commentsRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
    onUpdate(comments);
  });
};

// 댓글 삭제
export const deleteComment = async (
  newsUserId: string,
  newsId: string,
  commentId: string
): Promise<void> => {
  try {
    const commentRef = doc(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments",
      commentId
    );
    await deleteDoc(commentRef);

    // 댓글 카운트 감소
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    const newsDoc = await getDoc(newsRef);
    const currentCount = newsDoc.data()?.commentsCount || 0;

    await setDoc(
      newsRef,
      {
        commentsCount: Math.max(0, currentCount - 1),
      },
      { merge: true }
    );

    console.log("✅ 댓글 삭제 완료:", commentId);
  } catch (error) {
    console.error("❌ 댓글 삭제 실패:", error);
    throw error;
  }
};
