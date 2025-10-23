import { doc, getDoc, setDoc, Timestamp, onSnapshot } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
} from "firebase/storage";
import { firestore, storage, AI_FUNCTIONS_URL } from "@/config/firebase";

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
  imageURL?: string;
  title: string;
  content: string;
  date: string;
  fullDate: string;
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
  likesCount?: number;
  dislikesCount?: number;
}

// ==================== 이미지 관련 함수 ====================

// 이미지 업로드
export const uploadNewsImage = async (
  userId: string,
  newsId: string,
  imageUri: string
): Promise<string> => {
  try {
    console.log("이미지 업로드 시작:", imageUri);
    // React Native의 경우 fetch로 blob 가져오기
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storage = getStorage();
    const filename = `news_${newsId}_${Date.now()}.jpg`;
    // Storage 경로: news/{userId}/{newsId}.jpg
    const imageRef = ref(storage, `news/${userId}/${newsId}/${filename}`);

    // 업로드
    await uploadBytes(imageRef, blob);

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(imageRef);

    console.log("✅ 이미지 업로드 완료:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("❌ 이미지 업로드 실패:", error);
    throw error;
  }
};

// 이미지 삭제
export const deleteNewsImage = async (
  userId: string,
  newsId: string
): Promise<void> => {
  try {
    const imageRef = ref(storage, `news/${userId}/${newsId}.jpg`);
    await deleteObject(imageRef);
    console.log("✅ 이미지 삭제 완료");
  } catch (error) {
    // 이미지가 없는 경우는 무시
    if ((error as any).code === "storage/object-not-found") {
      console.log("ℹ️ 삭제할 이미지가 없음");
      return;
    }
    console.error("❌ 이미지 삭제 실패:", error);
    throw error;
  }
};

// ==================== 뉴스 관련 함수 ====================

// 뉴스 생성 (이미지 포함)
export const createNews = async (
  userId: string,
  newsData: {
    title: string;
    content: string;
    userName: string;
    userPhotoURL?: string;
    imageUri?: string; // 이미지 URI 추가
  }
): Promise<string> => {
  try {
    const now = new Date();
    const newsId = `news_${now.getTime()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    let imageURL: string | undefined;

    // 이미지가 있으면 먼저 업로드
    if (newsData.imageUri) {
      imageURL = await uploadNewsImage(userId, newsId, newsData.imageUri);
    }

    const docRef = doc(firestore, "users", userId, "data", "news");
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};

    const newNews = {
      id: newsId,
      userId,
      userName: newsData.userName,
      userPhotoURL: newsData.userPhotoURL || null,
      imageURL: imageURL || null, // 이미지 URL 추가
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

// AI 뉴스 생성
export const createAiNews = async (
  userId: string,
  taskId: string,
  dueDate: string,
  token: string,
  imageUri?: string // 이미지 URI 추가
) => {
  if (!AI_FUNCTIONS_URL) {
    throw new Error("Functions URL not defined in Expo config.extra");
  } // GET 쿼리 파라미터 생성
  const params = new URLSearchParams({ userId, taskId, date: dueDate });

  const res = await fetch(`${AI_FUNCTIONS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "AI 뉴스 생성 실패");
  }

  const result = await res.json();
  console.log("AI 뉴스 생성 응답:", result);
  // AI 뉴스가 생성된 후 이미지가 있으면 업로드
  if (imageUri !== "" && result.news.id) {
    console.log("imageUri:", imageUri);

    try {
      const imageURL = imageUri
        ? await uploadNewsImage(userId, result.news.id, imageUri)
        : undefined;

      // 뉴스에 이미지 URL 업데이트
      const docRef = doc(firestore, "users", userId, "data", "news");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const newsData = docSnap.data();
        console.log("newsData before image update:", newsData);
        if (newsData[result.news.id]) {
          newsData[result.news.id].imageURL = imageURL;
          await setDoc(docRef, newsData, { merge: true });
          console.log("✅ AI 뉴스 이미지 URL 업데이트 완료", imageURL);
        }
      }
    } catch (error) {
      console.error("❌ AI 뉴스 이미지 업로드 실패:", error);
      // 이미지 업로드 실패해도 뉴스는 생성됨
    }
  }

  console.log("✅ AI 뉴스 생성 성공", result);
  return result;
};

// 뉴스 수정 (이미지 포함)
export const updateNews = async (
  userId: string,
  newsId: string,
  updates: {
    title?: string;
    content?: string;
    imageUri?: string; // 새 이미지 URI
    removeImage?: boolean; // 이미지 삭제 플래그
  }
): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "news");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("News document not found");
    }

    const currentData = docSnap.data();

    if (!currentData[newsId]) {
      throw new Error("News item not found");
    }

    // 이미지 처리
    let imageURL = currentData[newsId].imageURL;

    if (updates.removeImage) {
      // 이미지 삭제
      if (imageURL) {
        await deleteNewsImage(userId, newsId);
        imageURL = null;
      }
    } else if (updates.imageUri) {
      // 기존 이미지가 있으면 삭제 후 새 이미지 업로드
      if (imageURL) {
        await deleteNewsImage(userId, newsId);
      }
      imageURL = await uploadNewsImage(userId, newsId, updates.imageUri);
    }

    currentData[newsId] = {
      ...currentData[newsId],
      title: updates.title ?? currentData[newsId].title,
      content: updates.content ?? currentData[newsId].content,
      imageURL,
    };

    await setDoc(docRef, currentData, { merge: true });
    console.log("✅ 뉴스 수정 완료:", newsId);
  } catch (error) {
    console.error("❌ 뉴스 수정 실패:", error);
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

    return newsArray.sort((a, b) => b.fullDate.localeCompare(a.fullDate));
  } catch (error) {
    console.error("❌ 연도별 뉴스 가져오기 실패:", error);
    return [];
  }
};

// 팔로우한 유저들의 최신 뉴스 가져오기
export const getFollowingNewsFeed = async (
  followingId: string,
  year?: number,
  limitCount: number = 50
): Promise<NewsItem[]> => {
  try {
    const allNews: NewsItem[] = [];

    const docRef = doc(firestore, "users", followingId, "data", "news");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      let newsArray = Object.values(userData) as NewsItem[];

      // 연도 필터링
      if (year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        newsArray = newsArray.filter((news) => {
          return news.fullDate >= startDate && news.fullDate <= endDate;
        });
      }

      allNews.push(...newsArray);
    }

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

// 뉴스 삭제 (이미지도 함께 삭제)
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
      // 이미지가 있으면 삭제
      if (currentData[newsId].imageURL) {
        await deleteNewsImage(userId, newsId);
      }

      // 뉴스 삭제
      delete currentData[newsId];
      await setDoc(docRef, currentData);

      // 댓글도 삭제
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

// ==================== 좋아요 관련 함수 ====================

// 뉴스 좋아요 토글
export const toggleNewsLike = async (
  newsUserId: string,
  newsId: string,
  likingUserId: string
): Promise<void> => {
  try {
    const newsLikesDocRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "newsLikes"
    );
    const newsLikesSnap = await getDoc(newsLikesDocRef);
    const newsLikesData = newsLikesSnap.exists() ? newsLikesSnap.data() : {};

    if (!newsLikesData[newsId]) {
      newsLikesData[newsId] = {};
    }

    const newsDocRef = doc(firestore, "users", newsUserId, "data", "news");
    const newsSnap = await getDoc(newsDocRef);

    if (!newsSnap.exists()) {
      throw new Error("News document not found");
    }
    const newsData = newsSnap.data();

    if (!newsData[newsId]) {
      throw new Error("News item not found");
    }

    const isLiked = newsLikesData[newsId][likingUserId];

    if (isLiked) {
      // 좋아요 취소
      delete newsLikesData[newsId][likingUserId];
      newsData[newsId].likesCount = Math.max(
        0,
        (newsData[newsId].likesCount || 0) - 1
      );
      console.log(`✅ 뉴스 좋아요 취소: ${newsId} by ${likingUserId}`);
    } else {
      // 좋아요
      newsLikesData[newsId][likingUserId] = true;
      newsData[newsId].likesCount = (newsData[newsId].likesCount || 0) + 1;
      console.log(`✅ 뉴스 좋아요 완료: ${newsId} by ${likingUserId}`);
    }

    await setDoc(newsLikesDocRef, newsLikesData, { merge: true });
    await setDoc(newsDocRef, newsData, { merge: true });
  } catch (error) {
    console.error("❌ 뉴스 좋아요 토글 실패:", error);
    throw error;
  }
};

// 특정 유저가 좋아요한 뉴스 목록 가져오기
export const getUserNewsLikes = async (
  newsUserId: string,
  likingUserId: string
): Promise<Record<string, boolean>> => {
  try {
    const newsLikesDocRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "newsLikes"
    );
    const newsLikesSnap = await getDoc(newsLikesDocRef);

    if (!newsLikesSnap.exists()) {
      return {};
    }

    const newsLikesData = newsLikesSnap.data();
    const userLikes: Record<string, boolean> = {};

    Object.keys(newsLikesData).forEach((newsId) => {
      if (newsLikesData[newsId][likingUserId]) {
        userLikes[newsId] = true;
      }
    });

    return userLikes;
  } catch (error) {
    console.error("❌ 유저의 뉴스 좋아요 가져오기 실패:", error);
    return {};
  }
};

// ==================== 댓글 관련 함수 ====================

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
      likesCount: 0,
      dislikesCount: 0,
    };

    commentsData[newsId][commentId] = newComment;
    await setDoc(commentsDocRef, commentsData, { merge: true });

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

        if (Object.keys(commentsData[newsId]).length === 0) {
          delete commentsData[newsId];
        }

        await setDoc(commentsDocRef, commentsData);
      }
    }

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

// 댓글 좋아요/싫어요 토글
export const toggleCommentReaction = async (
  newsUserId: string,
  newsId: string,
  commentId: string,
  userId: string,
  reactionType: "like" | "dislike"
): Promise<void> => {
  try {
    const reactionsDocRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "commentReactions"
    );
    const reactionsSnap = await getDoc(reactionsDocRef);
    const reactionsData = reactionsSnap.exists() ? reactionsSnap.data() : {};

    if (!reactionsData[newsId]) {
      reactionsData[newsId] = {};
    }
    if (!reactionsData[newsId][commentId]) {
      reactionsData[newsId][commentId] = {};
    }

    const userReaction = reactionsData[newsId][commentId][userId];
    const commentsDocRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "comments"
    );
    const commentsSnap = await getDoc(commentsDocRef);
    const commentsData = commentsSnap.data() || {};

    if (!commentsData[newsId] || !commentsData[newsId][commentId]) {
      throw new Error("Comment not found");
    }

    const comment = commentsData[newsId][commentId];

    if (userReaction === reactionType) {
      delete reactionsData[newsId][commentId][userId];
      if (reactionType === "like") {
        comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
      } else {
        comment.dislikesCount = Math.max(0, (comment.dislikesCount || 0) - 1);
      }
    } else {
      if (userReaction) {
        if (userReaction === "like") {
          comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
        } else {
          comment.dislikesCount = Math.max(0, (comment.dislikesCount || 0) - 1);
        }
      }

      reactionsData[newsId][commentId][userId] = reactionType;
      if (reactionType === "like") {
        comment.likesCount = (comment.likesCount || 0) + 1;
      } else {
        comment.dislikesCount = (comment.dislikesCount || 0) + 1;
      }
    }

    await setDoc(reactionsDocRef, reactionsData, { merge: true });
    await setDoc(commentsDocRef, commentsData, { merge: true });

    console.log("✅ 댓글 반응 업데이트 완료");
  } catch (error) {
    console.error("❌ 댓글 반응 업데이트 실패:", error);
    throw error;
  }
};

// 사용자의 댓글 반응 가져오기
export const getUserCommentReactions = async (
  newsUserId: string,
  newsId: string,
  userId: string
): Promise<Record<string, "like" | "dislike">> => {
  try {
    const docRef = doc(
      firestore,
      "users",
      newsUserId,
      "data",
      "commentReactions"
    );
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || !docSnap.data()[newsId]) {
      return {};
    }

    const newsReactions = docSnap.data()[newsId];
    const userReactions: Record<string, "like" | "dislike"> = {};

    Object.keys(newsReactions).forEach((commentId) => {
      if (newsReactions[commentId][userId]) {
        userReactions[commentId] = newsReactions[commentId][userId];
      }
    });

    return userReactions;
  } catch (error) {
    console.error("❌ 사용자 댓글 반응 가져오기 실패:", error);
    return {};
  }
};
