// api/newsApi.ts
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
  onSnapshot,
  writeBatch,
} from "@react-native-firebase/firestore";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { AI_FUNCTIONS_URL } from "@/config/firebase";

// (타입 정의 - 변경 없음)
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
  createdAt: any;
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
    // [수정] 타임스탬프(동적) 파일명 대신 'newsId.jpg' (고정) 파일명 사용
    const filename = `${newsId}.jpg`;
    // [수정] '.../newsId/filename.jpg' (3뎁스) 대신 '.../newsId.jpg' (2뎁스) 사용
    const imageRef = storage().ref(`news/${userId}/${filename}`);
    await imageRef.putFile(localUri);
    const url = await imageRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }
};

// --- [!! 여기가 '18연속 상장폐지' (2/2) 해결 지점 !!] ---
// 이미지 삭제
export const deleteNewsImage = async (userId: string, newsId: string) => {
  try {
    // [수정] 'uploadNewsImage'와 '동일한' 경로를 참조
    const filename = `${newsId}.jpg`;
    console.log("Deleting image for newsId:", filename);
    const imageRef = storage().ref(`news/${userId}/${filename}`);
    await imageRef.delete();
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.log("삭제할 이미지를 찾을 수 없음 (정상일 수 있음):", error.code);
      return; // (삭제할 파일이 없어도 오류 아님)
    }
    console.error("이미지 삭제 실패:", error);
    // throw error; (삭제 실패가 앱을 중단시키지 않도록 주석 처리)
  }
};
// --- [!! 해결 끝 !!] ---

// ==================== 뉴스 CRUD ====================

// (뉴스 생성 - 변경 없음)
export const createNews = async (
  userId: string,
  taskId: string,
  dueDate: string,
  token: string,
  imageURL?: string
): Promise<any> => {
  try {
    const now = new Date();
    // [수정] newsId 생성 로직 (doc().id 사용 권장)
    const newsRef = doc(collection(firestore, "users", userId, "news"));
    const newsId = newsRef.id; // (Firestore ID를 미리 생성)

    if (!AI_FUNCTIONS_URL) {
      throw new Error("AI Functions URL is not defined.");
    }

    let uploadedImageURL = "";
    if (imageURL) {
      console.log("Uploading news image...");
      // [수정] (uploadNewsImage가 새 경로를 사용하므로, createNews도 새 경로를 사용)
      const resultURL = await uploadNewsImage(userId, newsId, imageURL);
      if (resultURL) {
        uploadedImageURL = resultURL;
      }
    }

    const params = new URLSearchParams({
      userId,
      taskId,
      date: dueDate,
      imageURL: uploadedImageURL,
      newsId: newsId, // [수정] (AI Function이 ID를 알아야 함)
    });

    const res = await fetch(`${AI_FUNCTIONS_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 429) {
      const errorData = await res.json();
      console.error("뉴스 생성 한도 초과 (서버):", errorData.error);
      throw new Error(
        errorData.error || "하루에 최대 3개의 뉴스만 생성할 수 있습니다."
      );
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AI Functions request failed:", errorText);
      // (이미지 업로드는 성공했으나 AI가 실패한 경우, 이미지 롤백)
      if (uploadedImageURL) {
        await deleteNewsImage(userId, newsId);
      }
      throw new Error(`AI Functions request failed with status ${res.status}`);
    }

    const result = await res.json();
    console.log("AI Functions response:", result);
    return result;
  } catch (error) {
    console.error("뉴스 생성 실패 (createNews):", error);
    throw error;
  }
};

// (뉴스 수정 - 'user_43'의 타입 수정안 반영)
export const updateNews = async (
  userId: string,
  newsId: string,
  updates: {
    title?: string;
    content?: string;
    imageUri?: string | null; // (null 허용)
    removeImage?: boolean;
  }
) => {
  try {
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    const docSnap = await getDoc(newsRef);

    if (!docSnap.exists()) throw new Error("News not found");

    const currentData = docSnap.data() as NewsItem;
    let imageURL = currentData.imageURL || null;

    // '삭제' 플래그가 true이고, '기존' URL이 있을 때
    if (updates.removeImage && imageURL) {
      await deleteNewsImage(userId, newsId); // (수정된 경로로 삭제)
      imageURL = null;
    }
    // '새 이미지'가 'string'으로 들어왔을 때 (신규 또는 변경)
    else if (updates.imageUri) {
      if (imageURL) {
        // (기존 이미지 삭제 - 변경 시 덮어쓰기이므로 사실 필요 없음)
        // await deleteNewsImage(userId, newsId);
      }
      // [수정] '새 이미지' 업로드
      imageURL = await uploadNewsImage(userId, newsId, updates.imageUri);
    }
    // 'imageUri'가 'undefined'면 (건드리지 않음)
    // 'imageUri'가 'null'인데 'removeImage'가 false면 (논리적 오류지만 일단 기존 URL 유지)

    await updateDoc(newsRef, {
      title: updates.title ?? currentData.title,
      content: updates.content ?? currentData.content,
      imageURL, // (null 또는 새 URL 또는 기존 URL)
    });
  } catch (error) {
    console.error("뉴스 수정 실패:", error);
    throw error;
  }
};

// (뉴스 삭제 - deleteNewsImage 경로 수정됨)
export const deleteNews = async (userId: string, newsId: string) => {
  try {
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    const docSnap = await getDoc(newsRef);
    if (!docSnap.exists()) throw new Error("News not found");

    const newsData = docSnap.data() as NewsItem;

    // [수정] 수정된 경로로 이미지 삭제
    if (newsData.imageURL) await deleteNewsImage(userId, newsId);

    await deleteDoc(newsRef);

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

// (뉴스 구독 - 변경 없음)
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

    const unsubscribe = onSnapshot(
      newsCollection,
      (snapshot) => {
        const news: NewsItem[] = [];
        snapshot.forEach(
          (
            docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
          ) => {
            news.push(docSnap.data() as NewsItem);
          }
        );
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
    return unsubscribe;
  } catch (error) {
    console.error("뉴스 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

// (댓글 추가/구독/삭제 - 변경 없음)
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

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const comments: Comment[] = [];
        snapshot.forEach(
          (
            docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
          ) => {
            comments.push(docSnap.data() as Comment);
          }
        );
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
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    await updateDoc(newsRef, {
      commentsCount: increment(-1),
    });
  } catch (error) {
    console.error("댓글 삭제 실패:", error);
    throw error;
  }
};

// (뉴스 좋아요/댓글 반응 - 변경 없음)
export const toggleNewsLike = async (
  newsUserId: string,
  newsId: string,
  currentUserId: string
): Promise<void> => {
  try {
    const batch = writeBatch(firestore);
    const likeRef = doc(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "likes",
      currentUserId
    );
    const myLikeRef = doc(
      firestore,
      "users",
      currentUserId,
      "myNewsLikes",
      newsId
    );
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      batch.delete(likeRef);
      batch.delete(myLikeRef);
      batch.update(newsRef, {
        likesCount: increment(-1),
      });
    } else {
      const likeData = {
        userId: currentUserId,
        likedAt: serverTimestamp(),
      };
      batch.set(likeRef, likeData);
      batch.set(myLikeRef, {
        newsId: newsId,
        newsUserId: newsUserId,
        likedAt: serverTimestamp(),
      });
      batch.update(newsRef, {
        likesCount: increment(1),
      });
    }
    await batch.commit();
  } catch (error) {
    console.error("뉴스 좋아요 토글 실패:", error);
    throw error;
  }
};
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
        await deleteDoc(reactionRef);
        await updateDoc(commentRef, {
          [`${reactionType}sCount`]: increment(-1),
        });
      } else {
        await setDoc(reactionRef, { type: reactionType });
        await updateDoc(commentRef, {
          [`${existingReaction}sCount`]: increment(-1),
          [`${reactionType}sCount`]: increment(1),
        });
      }
    } else {
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

    const unsubscribes: (() => void)[] = [];
    const reactionsMap: Record<string, "like" | "dislike"> = {};

    const commentsUnsubscribe = onSnapshot(
      commentsQuery,
      async (commentsSnapshot) => {
        unsubscribes.forEach((unsub) => unsub());
        unsubscribes.length = 0;
        commentsSnapshot.forEach(
          (
            commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
          ) => {
            const reactionRef = doc(
              firestore,
              "users",
              newsUserId,
              "comments",
              commentDoc.id,
              "reactions",
              currentUserId
            );
            const reactionUnsubscribe = onSnapshot(
              reactionRef,
              (
                reactionSnap: FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
              ) => {
                if (reactionSnap.exists()) {
                  const reactionData = reactionSnap.data() as {
                    type: "like" | "dislike";
                  };
                  reactionsMap[commentDoc.id] = reactionData?.type;
                } else {
                  delete reactionsMap[commentDoc.id];
                }
                onUpdate({ ...reactionsMap });
              },
              (error: Error) => {
                console.error(`댓글 ${commentDoc.id} 반응 구독 실패:`, error);
              }
            );
            unsubscribes.push(reactionUnsubscribe);
          }
        );
      },
      (error) => {
        console.error("댓글 목록 구독 실패:", error);
        if (onError) onError(error);
      }
    );
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
export const subscribeToMyNewsLikes = (
  currentUserId: string,
  onUpdate: (likesMap: Record<string, boolean>) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const myLikesCollection = collection(
      firestore,
      "users",
      currentUserId,
      "myNewsLikes"
    ) as FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>;

    const unsubscribe = onSnapshot(
      myLikesCollection,
      (snapshot) => {
        const likesMap: Record<string, boolean> = {};
        snapshot.forEach(
          (
            docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
          ) => {
            likesMap[docSnap.id] = true;
          }
        );
        onUpdate(likesMap);
      },
      (error) => {
        console.error("내 좋아요 목록 구독 실패:", error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("내 좋아요 목록 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
};
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
