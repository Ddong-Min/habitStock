// 📂 src/services/newsService.ts

import { firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { AI_FUNCTIONS_URL } from "@/config/firebase";

// ✅ Firestore Modular API 사용

// ==================== 타입 정의 ====================
export interface NewsItem {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  imageURL?: string | null;
  title: string;
  content: string;
  date: string;
  fullDate: string;
  createdAt: any; // firestore.Timestamp
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  content: string;
  createdAt: any;
  likesCount?: number;
  dislikesCount?: number;
}

// ==================== 이미지 ====================

// 이미지 업로드
export const uploadNewsImage = async (
  userId: string,
  newsId: string,
  localUri: string
): Promise<string> => {
  try {
    const filename = `news_${newsId}_${Date.now()}.jpg`;
    const imageRef = storage().ref(`news/${userId}/${newsId}/${filename}`);
    await imageRef.putFile(localUri); // RN Firebase 방식
    const url = await imageRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }
};

// 이미지 삭제
export const deleteNewsImage = async (userId: string, newsId: string) => {
  try {
    const imageRef = storage().ref(`news/${userId}/${newsId}.jpg`);
    await imageRef.delete();
  } catch (error: any) {
    if (error.code === "storage/object-not-found") return;
    console.error("이미지 삭제 실패:", error);
    throw error;
  }
};

// ==================== 뉴스 CRUD ====================

// 뉴스 생성
export const createNews = async (
  userId: string,
  newsData: {
    title: string;
    content: string;
    userName: string;
    userPhotoURL?: string | null;
    imageUri?: string;
  }
): Promise<string> => {
  try {
    const now = new Date();
    const newsId = `news_${now.getTime()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    let imageURL: string | null = null;
    if (newsData.imageUri) {
      imageURL = await uploadNewsImage(userId, newsId, newsData.imageUri);
    }

    const newsRef = doc(firestore, "users", userId, "news", newsId);

    await setDoc(newsRef, {
      id: newsId,
      userId,
      userName: newsData.userName,
      userPhotoURL: newsData.userPhotoURL || null,
      imageURL,
      title: newsData.title,
      content: newsData.content,
      date: `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`,
      fullDate: now.toISOString().split("T")[0],
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    });

    return newsId;
  } catch (error) {
    console.error("뉴스 생성 실패:", error);
    throw error;
  }
};

// 뉴스 수정
export const updateNews = async (
  userId: string,
  newsId: string,
  updates: {
    title?: string;
    content?: string;
    imageUri?: string;
    removeImage?: boolean;
  }
) => {
  try {
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    const docSnap = await getDoc(newsRef);

    if (!docSnap.exists()) throw new Error("News not found");

    const currentData = docSnap.data() as NewsItem;

    let imageURL = currentData.imageURL || null;

    if (updates.removeImage && imageURL) {
      await deleteNewsImage(userId, newsId);
      imageURL = null;
    } else if (updates.imageUri) {
      if (imageURL) await deleteNewsImage(userId, newsId);
      imageURL = await uploadNewsImage(userId, newsId, updates.imageUri);
    }

    await updateDoc(newsRef, {
      title: updates.title ?? currentData.title,
      content: updates.content ?? currentData.content,
      imageURL,
    });
  } catch (error) {
    console.error("뉴스 수정 실패:", error);
    throw error;
  }
};

// 뉴스 삭제
export const deleteNews = async (userId: string, newsId: string) => {
  try {
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    const docSnap = await getDoc(newsRef);
    if (!docSnap.exists()) throw new Error("News not found");

    const newsData = docSnap.data() as NewsItem;

    if (newsData.imageURL) await deleteNewsImage(userId, newsId);

    // 뉴스 삭제
    await deleteDoc(newsRef);

    // 댓글 삭제
    const commentsRef = doc(firestore, "users", userId, "comments", newsId);
    await deleteDoc(commentsRef);
  } catch (error) {
    console.error("뉴스 삭제 실패:", error);
    throw error;
  }
};

// 뉴스 가져오기
export const getUserNews = async (userId: string): Promise<NewsItem[]> => {
  try {
    const newsCollection = collection(firestore, "users", userId, "news");
    const snap = await getDocs(newsCollection);
    const news: NewsItem[] = [];
    snap.forEach((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
      news.push(docSnap.data() as NewsItem)
    );
    return news.sort(
      (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
    );
  } catch (error) {
    console.error("유저 뉴스 가져오기 실패:", error);
    return [];
  }
};

// ==================== 댓글 ====================

// 댓글 추가
export const addComment = async (
  newsUserId: string,
  newsId: string,
  commentData: {
    userId: string;
    userName: string;
    userPhotoURL?: string | null;
    content: string;
  }
): Promise<string> => {
  try {
    const commentId = `comment_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const commentRef = doc(firestore, "users", newsUserId, "comments", newsId);

    const snap = await getDoc(commentRef);
    const commentsData = snap.exists() ? snap.data() || {} : {};

    commentsData![commentId] = {
      id: commentId,
      newsId,
      userId: commentData.userId,
      userName: commentData.userName,
      userPhotoURL: commentData.userPhotoURL || null,
      content: commentData.content,
      createdAt: serverTimestamp(),
      likesCount: 0,
      dislikesCount: 0,
    };

    await setDoc(commentRef, commentsData, { merge: true });

    // 뉴스 댓글 카운트 업데이트
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    await updateDoc(newsRef, {
      commentsCount: increment(1),
    });

    return commentId;
  } catch (error) {
    console.error("댓글 작성 실패:", error);
    throw error;
  }
};

// 댓글 가져오기
export const getComments = async (
  newsUserId: string,
  newsId: string
): Promise<Comment[]> => {
  try {
    const commentRef = doc(firestore, "users", newsUserId, "comments", newsId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return [];
    const data = snap.data() || {};
    return Object.values(data).sort(
      (a: any, b: any) =>
        (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)
    );
  } catch (error) {
    console.error("댓글 가져오기 실패:", error);
    return [];
  }
};
