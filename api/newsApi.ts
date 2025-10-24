// 📂 src/services/newsService.ts

import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { AI_FUNCTIONS_URL } from "@/config/firebase";

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

    const newsRef = firestore()
      .collection("users")
      .doc(userId)
      .collection("news")
      .doc(newsId);

    await newsRef.set({
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
      createdAt: firestore.FieldValue.serverTimestamp(),
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
    const newsRef = firestore()
      .collection("users")
      .doc(userId)
      .collection("news")
      .doc(newsId);
    const docSnap = await newsRef.get();

    if (!docSnap.exists) throw new Error("News not found");

    const currentData = docSnap.data() as NewsItem;

    let imageURL = currentData.imageURL || null;

    if (updates.removeImage && imageURL) {
      await deleteNewsImage(userId, newsId);
      imageURL = null;
    } else if (updates.imageUri) {
      if (imageURL) await deleteNewsImage(userId, newsId);
      imageURL = await uploadNewsImage(userId, newsId, updates.imageUri);
    }

    await newsRef.update({
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
    const newsRef = firestore()
      .collection("users")
      .doc(userId)
      .collection("news")
      .doc(newsId);
    const docSnap = await newsRef.get();
    if (!docSnap.exists) throw new Error("News not found");

    const newsData = docSnap.data() as NewsItem;

    if (newsData.imageURL) await deleteNewsImage(userId, newsId);

    // 뉴스 삭제
    await newsRef.delete();

    // 댓글 삭제
    const commentsRef = firestore()
      .collection("users")
      .doc(userId)
      .collection("comments")
      .doc(newsId);
    await commentsRef.delete();
  } catch (error) {
    console.error("뉴스 삭제 실패:", error);
    throw error;
  }
};

// 뉴스 가져오기
export const getUserNews = async (userId: string): Promise<NewsItem[]> => {
  try {
    const snap = await firestore()
      .collection("users")
      .doc(userId)
      .collection("news")
      .get();
    const news: NewsItem[] = [];
    snap.forEach((doc) => news.push(doc.data() as NewsItem));
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
    const commentRef = firestore()
      .collection("users")
      .doc(newsUserId)
      .collection("comments")
      .doc(newsId);

    const snap = await commentRef.get();
    const commentsData = snap.exists() ? snap.data() || {} : {};

    commentsData![commentId] = {
      id: commentId,
      newsId,
      userId: commentData.userId,
      userName: commentData.userName,
      userPhotoURL: commentData.userPhotoURL || null,
      content: commentData.content,
      createdAt: firestore.FieldValue.serverTimestamp(),
      likesCount: 0,
      dislikesCount: 0,
    };

    await commentRef.set(commentsData, { merge: true });

    // 뉴스 댓글 카운트 업데이트
    const newsRef = firestore()
      .collection("users")
      .doc(newsUserId)
      .collection("news")
      .doc(newsId);
    await newsRef.update({
      commentsCount: firestore.FieldValue.increment(1),
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
    const snap = await firestore()
      .collection("users")
      .doc(newsUserId)
      .collection("comments")
      .doc(newsId)
      .get();
    if (!snap.exists) return [];
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
