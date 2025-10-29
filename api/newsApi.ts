// 📂 src/api/newsApi.ts

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
  query,
  where,
} from "@react-native-firebase/firestore";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { AI_FUNCTIONS_URL } from "@/config/firebase";

// ✅ Firestore 평탄화 구조
// news: users/{userId}/news/{newsId}
// comments: users/{userId}/comments/{commentId}
// comment reactions: users/{userId}/comments/{commentId}/reactions/{userId}

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
  taskId: string,
  dueDate: string,
  token: string,
  imageURL?: string
): Promise<string> => {
  try {
    const now = new Date();
    const newsId = `news_${now.getTime()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    if (!AI_FUNCTIONS_URL) {
      throw new Error("AI Functions URL is not defined.");
    }
    console.log("3");
    const params = new URLSearchParams({ userId, taskId, date: dueDate });
    const res = await fetch(`${AI_FUNCTIONS_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("4");
    if (!res.ok) {
      throw new Error(`AI Functions request failed with status ${res.status}`);
    }
    const result = await res.json();
    console.log("AI Functions response:", result);

    if (imageURL) {
      imageURL = await uploadNewsImage(userId, newsId, imageURL);
    }
    return result;
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

    // 해당 뉴스의 모든 댓글 삭제
    const commentsRef = collection(firestore, "users", userId, "comments");
    const commentsQuery = query(commentsRef, where("newsId", "==", newsId));
    const commentsSnap = await getDocs(commentsQuery);

    const deletePromises = commentsSnap.docs.map(
      (commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
        deleteDoc(commentDoc.ref)
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("뉴스 삭제 실패:", error);
    throw error;
  }
};

// 뉴스 가져오기 (일회성)
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

// 뉴스 실시간 구독
export const subscribeToUserNews = (
  userId: string,
  onUpdate: (news: NewsItem[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const newsCollection = collection(
      firestore,
      "users",
      userId,
      "news"
    ) as FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>;

    const unsubscribe = newsCollection.onSnapshot(
      (snapshot) => {
        const news: NewsItem[] = [];
        snapshot.forEach((docSnap) => {
          news.push(docSnap.data() as NewsItem);
        });

        // 최신순 정렬
        const sortedNews = news.sort(
          (a, b) =>
            (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
        );

        onUpdate(sortedNews);
      },
      (error) => {
        console.error("뉴스 구독 실패:", error);
        if (onError) onError(error);
      }
    );

    // 구독 해제 함수 반환
    return unsubscribe;
  } catch (error) {
    console.error("뉴스 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {}; // 빈 함수 반환
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

    // users/{userId}/comments/{commentId} 구조
    const commentRef = doc(
      firestore,
      "users",
      newsUserId,
      "comments",
      commentId
    );

    await setDoc(commentRef, {
      id: commentId,
      newsId,
      userId: commentData.userId,
      userName: commentData.userName,
      userPhotoURL: commentData.userPhotoURL || null,
      content: commentData.content,
      createdAt: serverTimestamp(),
      likesCount: 0,
      dislikesCount: 0,
    });

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

// 댓글 가져오기 (일회성)
export const getComments = async (
  newsUserId: string,
  newsId: string
): Promise<Comment[]> => {
  try {
    const commentsRef = collection(firestore, "users", newsUserId, "comments");
    const commentsQuery = query(commentsRef, where("newsId", "==", newsId));
    const snap = await getDocs(commentsQuery);

    const comments: Comment[] = [];
    snap.forEach((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
      comments.push(docSnap.data() as Comment)
    );

    return comments.sort(
      (a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)
    );
  } catch (error) {
    console.error("댓글 가져오기 실패:", error);
    return [];
  }
};

// 댓글 실시간 구독
export const subscribeToComments = (
  newsUserId: string,
  newsId: string,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const commentsRef = collection(firestore, "users", newsUserId, "comments");
    const commentsQuery = query(
      commentsRef,
      where("newsId", "==", newsId)
    ) as FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>;

    const unsubscribe = commentsQuery.onSnapshot(
      (snapshot) => {
        const comments: Comment[] = [];
        snapshot.forEach((docSnap) => {
          comments.push(docSnap.data() as Comment);
        });

        // 오래된 순 정렬
        const sortedComments = comments.sort(
          (a, b) =>
            (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)
        );

        onUpdate(sortedComments);
      },
      (error) => {
        console.error("댓글 구독 실패:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("댓글 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

// 댓글 삭제
export const deleteComment = async (
  newsUserId: string,
  newsId: string,
  commentId: string
) => {
  try {
    const commentRef = doc(
      firestore,
      "users",
      newsUserId,
      "comments",
      commentId
    );
    await deleteDoc(commentRef);

    // 뉴스 댓글 카운트 업데이트
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    await updateDoc(newsRef, {
      commentsCount: increment(-1),
    });
  } catch (error) {
    console.error("댓글 삭제 실패:", error);
    throw error;
  }
};

// ==================== 댓글 반응 (좋아요/싫어요) ====================

// 댓글 반응 토글
export const toggleCommentReaction = async (
  newsUserId: string,
  newsId: string,
  commentId: string,
  currentUserId: string,
  reactionType: "like" | "dislike"
): Promise<void> => {
  try {
    const reactionRef = doc(
      firestore,
      "users",
      newsUserId,
      "comments",
      commentId,
      "reactions",
      currentUserId
    );
    const commentRef = doc(
      firestore,
      "users",
      newsUserId,
      "comments",
      commentId
    );

    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const existingReaction = reactionSnap.data()?.type;

      if (existingReaction === reactionType) {
        // 같은 반응이면 삭제
        await deleteDoc(reactionRef);
        await updateDoc(commentRef, {
          [`${reactionType}sCount`]: increment(-1),
        });
      } else {
        // 다른 반응이면 변경
        await setDoc(reactionRef, { type: reactionType });
        await updateDoc(commentRef, {
          [`${existingReaction}sCount`]: increment(-1),
          [`${reactionType}sCount`]: increment(1),
        });
      }
    } else {
      // 새로운 반응 추가
      await setDoc(reactionRef, { type: reactionType });
      await updateDoc(commentRef, {
        [`${reactionType}sCount`]: increment(1),
      });
    }
  } catch (error) {
    console.error("댓글 반응 토글 실패:", error);
    throw error;
  }
};

// 댓글 반응들을 실시간으로 구독 (snapshot 방식)
export const subscribeToCommentReactions = (
  newsUserId: string,
  newsId: string,
  currentUserId: string,
  onUpdate: (reactions: Record<string, "like" | "dislike">) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const commentsRef = collection(firestore, "users", newsUserId, "comments");
    const commentsQuery = query(
      commentsRef,
      where("newsId", "==", newsId)
    ) as FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>;

    // 모든 댓글의 reactions를 구독
    const unsubscribes: (() => void)[] = [];
    const reactionsMap: Record<string, "like" | "dislike"> = {};

    // 먼저 댓글 목록을 구독
    const commentsUnsubscribe = commentsQuery.onSnapshot(
      async (commentsSnapshot) => {
        // 기존 reaction 구독 해제
        unsubscribes.forEach((unsub) => unsub());
        unsubscribes.length = 0;

        // 각 댓글의 reaction을 구독
        commentsSnapshot.forEach((commentDoc) => {
          const reactionRef = doc(
            firestore,
            "users",
            newsUserId,
            "comments",
            commentDoc.id,
            "reactions",
            currentUserId
          );

          const reactionUnsubscribe = reactionRef.onSnapshot(
            (reactionSnap) => {
              if (reactionSnap.exists()) {
                const reactionData = reactionSnap.data();
                reactionsMap[commentDoc.id] = reactionData?.type as
                  | "like"
                  | "dislike";
              } else {
                // 반응이 없으면 맵에서 제거
                delete reactionsMap[commentDoc.id];
              }

              // 업데이트 콜백 호출
              onUpdate({ ...reactionsMap });
            },
            (error) => {
              console.error(`댓글 ${commentDoc.id} 반응 구독 실패:`, error);
            }
          );

          unsubscribes.push(reactionUnsubscribe);
        });
      },
      (error) => {
        console.error("댓글 목록 구독 실패:", error);
        if (onError) onError(error);
      }
    );

    // cleanup 함수: 모든 구독 해제
    return () => {
      commentsUnsubscribe();
      unsubscribes.forEach((unsub) => unsub());
    };
  } catch (error) {
    console.error("댓글 반응 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

// 사용자의 댓글 반응 가져오기 (일회성, 호환성 유지)
export const getUserCommentReactions = async (
  newsUserId: string,
  newsId: string,
  currentUserId: string
): Promise<Record<string, "like" | "dislike">> => {
  try {
    const commentsRef = collection(firestore, "users", newsUserId, "comments");
    const commentsQuery = query(commentsRef, where("newsId", "==", newsId));
    const commentsSnap = await getDocs(commentsQuery);

    const reactions: Record<string, "like" | "dislike"> = {};

    // 각 댓글의 반응을 병렬로 가져오기
    const reactionPromises = commentsSnap.docs.map(
      async (commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const reactionRef = doc(
          firestore,
          "users",
          newsUserId,
          "comments",
          commentDoc.id,
          "reactions",
          currentUserId
        );
        const reactionSnap = await getDoc(reactionRef);

        if (reactionSnap.exists()) {
          const reactionData = reactionSnap.data();
          reactions[commentDoc.id] = reactionData?.type as "like" | "dislike";
        }
      }
    );

    await Promise.all(reactionPromises);

    return reactions;
  } catch (error) {
    console.error("사용자 댓글 반응 가져오기 실패:", error);
    return {};
  }
};
