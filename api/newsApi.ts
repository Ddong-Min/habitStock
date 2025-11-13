import { firestore, storage } from "@/config/firebase";
import firestoreModule, {
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
  orderBy,
  limit,
  startAfter,
} from "@react-native-firebase/firestore";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { AI_FUNCTIONS_URL } from "@/config/firebase";

// ==================== 타입 정의 ====================
export interface NewsItem {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null; //프로필 사진url
  imageURL?: string | null; //뉴스 이미지url
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
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  content: string;
  createdAt: any;
  likesCount?: number;
  dislikesCount?: number;
}

export interface FeedItem {
  id: string; // newsId
  newsUserId: string; // 뉴스 작성자
  newsUserName: string;
  newsUserPhotoURL?: string | null;
  imageURL?: string | null;
  title: string;
  content: string;
  date: string;
  fullDate: string;
  createdAt: any;
  likesCount: number;
  commentsCount: number;
}

// ==================== 이미지 관리 ====================
export const uploadNewsImage = async (
  userId: string,
  newsId: string,
  localUri: string
): Promise<string> => {
  try {
    const filename = `${newsId}.jpg`;
    const imageRef = storage.ref(`news/${userId}/${filename}`);
    await imageRef.putFile(localUri); // 이미지 업로드
    const url = await imageRef.getDownloadURL(); // 업로드된 이미지의 다운로드 URL 가져오기
    return url;
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }
};

export const deleteNewsImage = async (userId: string, newsId: string) => {
  try {
    const filename = `${newsId}.jpg`;
    console.log("Deleting image for newsId:", filename);
    const imageRef = storage.ref(`news/${userId}/${filename}`);
    await imageRef.delete();
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.log("삭제할 이미지를 찾을 수 없음 (정상일 수 있음):", error.code);
      return;
    }
    console.error("이미지 삭제 실패:", error);
  }
};

// ==================== 뉴스 생성 ====================
export const createNews = async (
  userId: string,
  taskId: string,
  dueDate: string,
  token: string,
  imageURL?: string
): Promise<any> => {
  try {
    const newsRef = doc(collection(firestore, "users", userId, "news"));
    const newsId = newsRef.id;
    if (!AI_FUNCTIONS_URL) {
      throw new Error("AI Functions URL is not defined.");
    }

    let uploadedImageURL = "";
    if (imageURL) {
      console.log("Uploading news image...");
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
      newsId: newsId,
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
      if (uploadedImageURL) {
        await deleteNewsImage(userId, newsId);
      }
      throw new Error(`AI Functions request failed with status ${res.status}`);
    }

    const result = await res.json();
    console.log("AI Functions response:", result);

    // 🔥 뉴스 생성 후 팔로워들의 Feed에 자동 배포
    const generatedNewsId = result.news?.id || newsId;
    await distributNewsToFollowers(userId, generatedNewsId);

    return result;
  } catch (error) {
    console.error("뉴스 생성 실패 (createNews):", error);
    throw error;
  }
};

// ==================== Feed 배포 시스템 ====================
// 🔥 팔로워들의 Feed에 뉴스 배포
export const distributNewsToFollowers = async (
  newsUserId: string,
  newsId: string
) => {
  try {
    // 1. 뉴스 정보 가져오기
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    const newsSnap = await getDoc(newsRef);

    if (!newsSnap.exists()) {
      console.error("뉴스를 찾을 수 없습니다:", newsId);
      return;
    }

    const newsData = newsSnap.data() as NewsItem;

    // 2. 팔로워 목록 가져오기 (올바른 경로)
    const followersRef = collection(
      firestore,
      "followers",
      newsUserId,
      "userFollowers"
    );
    const followersSnap = await getDocs(followersRef);

    if (followersSnap.empty) {
      console.log("팔로워가 없습니다.");
    }

    // 3. 배치로 팔로워들의 Feed에 추가
    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch]; //첫번째 batch를 미리 담아 놓음

    // 자신의 Feed에도 추가
    const myFeedRef = doc(firestore, "users", newsUserId, "feed", newsId); //쓰기 +1
    batch.set(myFeedRef, {
      id: newsId,
      newsUserId: newsUserId,
      newsUserName: newsData.userName,
      newsUserPhotoURL: newsData.userPhotoURL || null,
      imageURL: newsData.imageURL || null,
      title: newsData.title,
      content: newsData.content,
      date: newsData.date,
      fullDate: newsData.fullDate,
      createdAt: newsData.createdAt || serverTimestamp(),
      likesCount: newsData.likesCount || 0,
      commentsCount: newsData.commentsCount || 0,
    });
    batchCount++;

    followersSnap.forEach(
      (followerDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const followerId = followerDoc.id;

        // 팔로워의 Feed에 추가
        const feedRef = doc(firestore, "users", followerId, "feed", newsId);

        if (batchCount >= 500) {
          batches.push(writeBatch(firestore)); //새 배치 생성 
          batchCount = 0;
        }

        batches[batches.length - 1].set(feedRef, {
          id: newsId,
          newsUserId: newsUserId,
          newsUserName: newsData.userName,
          newsUserPhotoURL: newsData.userPhotoURL || null,
          imageURL: newsData.imageURL || null,
          title: newsData.title,
          content: newsData.content,
          date: newsData.date,
          fullDate: newsData.fullDate,
          createdAt: newsData.createdAt || serverTimestamp(),
          likesCount: newsData.likesCount || 0,
          commentsCount: newsData.commentsCount || 0,
        });
        batchCount++;
      }
    );

    // 모든 배치 커밋
    for (const b of batches) {
      await b.commit();
    }

    console.log(
      `✅ 뉴스 ${newsId}를 ${followersSnap.size}명의 팔로워에게 배포 완료`
    );
  } catch (error) {
    console.error("Feed 배포 실패:", error);
    throw error;
  }
};

// 🔥 새 팔로우 시 기존 뉴스를 Feed에 추가
export const addExistingNewsToFeed = async (
  followerId: string,
  followedUserId: string
) => {
  try {
    // 팔로우한 유저의 모든 뉴스 가져오기
    const newsRef = collection(firestore, "users", followedUserId, "news");
    const newsSnap = await getDocs(newsRef);

    if (newsSnap.empty) {
      console.log("팔로우한 유저의 뉴스가 없습니다.");
      return;
    }

    // 배치로 Feed에 추가
    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch];

    newsSnap.forEach(
      (newsDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const newsData = newsDoc.data() as NewsItem;
        const feedRef = doc(firestore, "users", followerId, "feed", newsDoc.id);

        if (batchCount >= 500) {
          batches.push(writeBatch(firestore));
          batchCount = 0;
        }

        batches[batches.length - 1].set(feedRef, {
          id: newsDoc.id,
          newsUserId: followedUserId,
          newsUserName: newsData.userName,
          newsUserPhotoURL: newsData.userPhotoURL || null,
          imageURL: newsData.imageURL || null,
          title: newsData.title,
          content: newsData.content,
          date: newsData.date,
          fullDate: newsData.fullDate,
          createdAt: newsData.createdAt || serverTimestamp(),
          likesCount: newsData.likesCount || 0,
          commentsCount: newsData.commentsCount || 0,
        });
        batchCount++;
      }
    );

    // 모든 배치 커밋
    for (const b of batches) {
      await b.commit();
    }

    console.log(
      `✅ ${followedUserId}의 기존 뉴스 ${newsSnap.size}개를 Feed에 추가 완료`
    );
  } catch (error) {
    console.error("기존 뉴스 Feed 추가 실패:", error);
    throw error;
  }
};

// 🔥 언팔로우 시 Feed에서 제거
export const removeNewsFromFeed = async (
  unfollowerId: string,
  unfollowedUserId: string
) => {
  try {
    // Feed에서 해당 유저의 모든 뉴스 찾기
    const feedRef = collection(firestore, "users", unfollowerId, "feed");
    const feedQuery = query(
      feedRef,
      where("newsUserId", "==", unfollowedUserId)
    );
    const feedSnap = await getDocs(feedQuery);

    if (feedSnap.empty) {
      console.log("Feed에서 제거할 뉴스가 없습니다.");
      return;
    }

    // 배치로 삭제
    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch];

    feedSnap.forEach(
      (feedDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        if (batchCount >= 500) {
          batches.push(writeBatch(firestore));
          batchCount = 0;
        }

        batches[batches.length - 1].delete(feedDoc.ref);
        batchCount++;
      }
    );

    // 모든 배치 커밋
    for (const b of batches) {
      await b.commit();
    }

    console.log(
      `✅ Feed에서 ${unfollowedUserId}의 뉴스 ${feedSnap.size}개 제거 완료`
    );
  } catch (error) {
    console.error("Feed 뉴스 제거 실패:", error);
    throw error;
  }
};

// ==================== Feed 페이지네이션 ====================
// 🔥 '전체 Feed' 조회 (페이지네이션)
export const getFeedWithPagination = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot
): Promise<{
  feeds: FeedItem[];
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
  hasMore: boolean;
}> => {
  try {
    const feedRef = collection(firestore, "users", userId, "feed");
    let feedQuery = query(
      feedRef,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      feedQuery = query(feedQuery, startAfter(lastDoc));
    }

    const feedSnap = await getDocs(feedQuery); //feedSnap은 querySnapshot

    const feeds: FeedItem[] = [];
    feedSnap.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => { //queryDocumentSnapshot이므로 doc.exists() 체크 불필요
      feeds.push(doc.data() as FeedItem);
    });

    const lastVisible = feedSnap.docs[feedSnap.docs.length - 1] || null; //lastVisible은 queryDocumentSnapshot 또는 null
    const hasMore = feedSnap.docs.length === pageSize;

    return { feeds, lastDoc: lastVisible, hasMore };
  } catch (error) {
    console.error("Feed 조회 실패:", error);
    return { feeds: [], lastDoc: null, hasMore: false };
  }
};

// 🔥 [신규] '특정 유저 News' 조회 (페이지네이션)
// (프로필 탭과 뉴스 탭 필터에서 공용으로 사용)
export const getNewsWithPagination = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot
): Promise<{
  news: NewsItem[];
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
  hasMore: boolean;
}> => {
  try {
    const newsRef = collection(firestore, "users", userId, "news");
    let newsQuery = query(
      newsRef,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      newsQuery = query(newsQuery, startAfter(lastDoc));
    }

    const newsSnap = await getDocs(newsQuery);

    const news: NewsItem[] = [];
    newsSnap.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      news.push(doc.data() as NewsItem);
    });

    const lastVisible = newsSnap.docs[newsSnap.docs.length - 1] || null;
    const hasMore = newsSnap.docs.length === pageSize;

    return { news, lastDoc: lastVisible, hasMore };
  } catch (error) {
    console.error("News 조회 실패:", error);
    return { news: [], lastDoc: null, hasMore: false };
  }
};

// ==================== 뉴스 수정 ====================
export const updateNews = async (
  userId: string,
  newsId: string,
  updates: {
    title?: string;
    content?: string;
    imageUri?: string | null;
    removeImage?: boolean;
  }
) => {
  try {
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    const docSnap = await getDoc(newsRef);

    // 뉴스 존재 여부 확인
    if (!docSnap.exists()) throw new Error("News not found");

    const currentData = docSnap.data() as NewsItem;
    let imageURL = currentData.imageURL || null;

    if (updates.removeImage && imageURL) {
      await deleteNewsImage(userId, newsId); // 기존 이미지 삭제
      imageURL = null;
    } else if (updates.imageUri) {
      imageURL = await uploadNewsImage(userId, newsId, updates.imageUri); // 새 이미지 업로드 
    }

    const updatedData = {
      title: updates.title ?? currentData.title,
      content: updates.content ?? currentData.content,
      imageURL,
    };

    // 1. news 컬렉션 업데이트
    await updateDoc(newsRef, updatedData);

    // 2. 모든 Feed에도 업데이트 (자신 + 팔로워들)
    await updateFeedItems(userId, newsId, updatedData);
  } catch (error) {
    console.error("뉴스 수정 실패:", error);
    throw error;
  }
};

// 🔥 Feed 아이템 일괄 업데이트
const updateFeedItems = async (
  newsUserId: string,
  newsId: string,
  updates: { title?: string; content?: string; imageURL?: string | null }
) => {
  try {
    // 1. 자신의 Feed 업데이트
    const myFeedRef = doc(firestore, "users", newsUserId, "feed", newsId);
    const myFeedSnap = await getDoc(myFeedRef);
    if (myFeedSnap.exists()) {
      await updateDoc(myFeedRef, updates);
    }

    // 2. 팔로워들의 Feed 업데이트 (올바른 경로)
    const followersRef = collection(
      firestore,
      "followers",
      newsUserId,
      "userFollowers"
    );
    const followersSnap = await getDocs(followersRef);

    if (followersSnap.empty) return;

    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch];

    followersSnap.forEach(
      (followerDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const followerId = followerDoc.id;
        const feedRef = doc(firestore, "users", followerId, "feed", newsId);

        if (batchCount >= 500) {
          batches.push(writeBatch(firestore));
          batchCount = 0;
        }

        batches[batches.length - 1].update(feedRef, updates);
        batchCount++;
      }
    );

    for (const b of batches) {
      await b.commit();
    }

    console.log(`✅ Feed 업데이트 완료: ${newsId}`);
  } catch (error) {
    console.error("Feed 업데이트 실패:", error);
  }
};

// ==================== 뉴스 삭제 ====================
export const deleteNews = async (userId: string, newsId: string) => {
  try {
    const newsRef = doc(firestore, "users", userId, "news", newsId);
    const docSnap = await getDoc(newsRef);
    if (!docSnap.exists()) throw new Error("News not found");

    const newsData = docSnap.data() as NewsItem;

    // 1. 이미지 삭제
    if (newsData.imageURL) await deleteNewsImage(userId, newsId);

    // 2. news 삭제
    await deleteDoc(newsRef);

    // 3. 댓글 삭제 (news/{newsId}/comments)
    const commentsRef = collection(newsRef, "comments");
    const commentsSnap = await getDocs(commentsRef);
    const deletePromises = commentsSnap.docs.map(
      (commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
        deleteDoc(commentDoc.ref)
    );
    await Promise.all(deletePromises);

    // 4. 좋아요 삭제 (news/{newsId}/likes)
    const likesRef = collection(newsRef, "likes");
    const likesSnap = await getDocs(likesRef);
    const deleteLikesPromises = likesSnap.docs.map(
      (likeDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
        deleteDoc(likeDoc.ref)
    );
    await Promise.all(deleteLikesPromises);

    // 5. Feed에서 삭제 (자신 + 팔로워들)
    await deleteFeedItems(userId, newsId);
  } catch (error) {
    console.error("뉴스 삭제 실패:", error);
    throw error;
  }
};

// 🔥 Feed 아이템 일괄 삭제
const deleteFeedItems = async (newsUserId: string, newsId: string) => {
  try {
    // 1. 자신의 Feed에서 삭제
    const myFeedRef = doc(firestore, "users", newsUserId, "feed", newsId);
    await deleteDoc(myFeedRef);

    // 2. 팔로워들의 Feed에서 삭제 (올바른 경로)
    const followersRef = collection(
      firestore,
      "followers",
      newsUserId,
      "userFollowers"
    );
    const followersSnap = await getDocs(followersRef);

    if (followersSnap.empty) return;

    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch];

    followersSnap.forEach(
      (followerDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const followerId = followerDoc.id;
        const feedRef = doc(firestore, "users", followerId, "feed", newsId);

        if (batchCount >= 500) {
          batches.push(writeBatch(firestore));
          batchCount = 0;
        }

        batches[batches.length - 1].delete(feedRef);
        batchCount++;
      }
    );

    for (const b of batches) {
      await b.commit();
    }

    console.log(`✅ Feed 삭제 완료: ${newsId}`);
  } catch (error) {
    console.error("Feed 삭제 실패:", error);
  }
};

// ==================== 댓글 관리 (news/{newsId}/comments로 이동) ====================
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

    // news/{newsId}/comments/{commentId}에 저장
    const commentRef = doc(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments",
      commentId
    );

    await setDoc(commentRef, {
      id: commentId,
      userId: commentData.userId,
      userName: commentData.userName,
      userPhotoURL: commentData.userPhotoURL || null,
      content: commentData.content,
      createdAt: serverTimestamp(),
      likesCount: 0,
      dislikesCount: 0,
    });

    // 뉴스의 댓글 수 증가
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    await updateDoc(newsRef, {
      commentsCount: increment(1),
    });

    // Feed의 댓글 수도 업데이트
    await updateFeedCommentCount(newsUserId, newsId, 1);

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
    const commentsRef = collection(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments"
    );
    const commentsQuery = query(
      commentsRef,
      orderBy("createdAt", "asc")
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
        onUpdate(comments);
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
      "news",
      newsId,
      "comments",
      commentId
    );
    await deleteDoc(commentRef);

    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    await updateDoc(newsRef, {
      commentsCount: increment(-1),
    });

    // Feed의 댓글 수도 업데이트
    await updateFeedCommentCount(newsUserId, newsId, -1);
  } catch (error) {
    console.error("댓글 삭제 실패:", error);
    throw error;
  }
};

// 🔥 Feed의 댓글 수 업데이트
const updateFeedCommentCount = async (
  newsUserId: string,
  newsId: string,
  incrementValue: number
) => {
  try {
    // 1. 자신의 Feed
    const myFeedRef = doc(firestore, "users", newsUserId, "feed", newsId);
    const myFeedSnap = await getDoc(myFeedRef);
    if (myFeedSnap.exists()) {
      await updateDoc(myFeedRef, {
        commentsCount: increment(incrementValue),
      });
    }

    // 2. 팔로워들의 Feed (올바른 경로)
    const followersRef = collection(
      firestore,
      "followers",
      newsUserId,
      "userFollowers"
    );
    const followersSnap = await getDocs(followersRef);

    if (followersSnap.empty) return;

    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch];

    followersSnap.forEach(
      (followerDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const followerId = followerDoc.id;
        const feedRef = doc(firestore, "users", followerId, "feed", newsId);

        if (batchCount >= 500) {
          batches.push(writeBatch(firestore));
          batchCount = 0;
        }

        batches[batches.length - 1].update(feedRef, {
          commentsCount: increment(incrementValue),
        });
        batchCount++;
      }
    );

    for (const b of batches) {
      await b.commit();
    }
  } catch (error) {
    console.error("Feed 댓글 수 업데이트 실패:", error);
  }
};

// ==================== 좋아요 관리 (구조 변경) ====================
export const toggleNewsLike = async (
  newsUserId: string,
  newsId: string,
  currentUserId: string
): Promise<void> => {
  try {
    const batch = writeBatch(firestore);

    // 1. 원본 뉴스 좋아요 서브컬렉션 (이건 유지)
    const likeRef = doc(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "likes",
      currentUserId
    );

    // --- 2. 'myNewsLikes' 경로 변경 (요청하신 'users/{id}/userLikes/likes' 구조) ---
    const myLikeRef = doc(
      firestore,
      "users",
      currentUserId,
      "userLikes",
      "likes" // 단일 문서 이름
    );

    // 3. 원본 뉴스 문서 (카운트 업데이트용)
    const newsRef = doc(firestore, "users", newsUserId, "news", newsId);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      // --- 좋아요 취소 ---
      batch.delete(likeRef);

      // --- 4. myLikeRef 로직 변경 (set + merge) ---
      batch.set(
        myLikeRef,
        {
          likedNewsIds: firestoreModule.FieldValue.arrayRemove(newsId),
        },
        { merge: true }
      );

      // --- 5. [BUG FIX] 좋아요 취소 시 카운트를 -1로 수정 ---
      batch.update(newsRef, {
        likesCount: increment(-1), // <-- -1로 수정
      });

      await batch.commit();

      // Feed의 좋아요 수도 업데이트
      await updateFeedLikeCount(newsUserId, newsId, -1); // <-- -1로 수정
    } else {
      // --- 좋아요 추가 ---
      const likeData = {
        userId: currentUserId,
        likedAt: serverTimestamp(),
      };
      batch.set(likeRef, likeData); // 원본 뉴스에 좋아요 기록

      // --- 6. 'myNewsLikes' 로직 (배열에 추가) ---
      batch.set(
        myLikeRef,
        {
          likedNewsIds: firestoreModule.FieldValue.arrayUnion(newsId), //배열에 추가
        },
        { merge: true } // 문서가 없으면 생성, 있으면 필드 병합
      );

      // --- 7. 카운트 +1 ---
      batch.update(newsRef, {
        likesCount: increment(1),
      });

      await batch.commit();

      // Feed의 좋아요 수도 업데이트
      await updateFeedLikeCount(newsUserId, newsId, 1);
    }
  } catch (error) {
    console.error("뉴스 좋아요 토글 실패:", error);
    throw error;
  }
};

// 🔥 Feed의 좋아요 수 업데이트
const updateFeedLikeCount = async (
  newsUserId: string,
  newsId: string,
  incrementValue: number
) => {
  try {
    // 1. 자신의 Feed
    const myFeedRef = doc(firestore, "users", newsUserId, "feed", newsId);
    const myFeedSnap = await getDoc(myFeedRef);
    if (myFeedSnap.exists()) {
      await updateDoc(myFeedRef, {
        likesCount: increment(incrementValue),
      });
    }

    // 2. 팔로워들의 Feed (올바른 경로)
    const followersRef = collection(
      firestore,
      "followers",
      newsUserId,
      "userFollowers"
    );
    const followersSnap = await getDocs(followersRef);

    if (followersSnap.empty) return;

    const batch = writeBatch(firestore);
    let batchCount = 0;
    const batches: ReturnType<typeof writeBatch>[] = [batch];

    followersSnap.forEach(
      (followerDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const followerId = followerDoc.id;
        const feedRef = doc(firestore, "users", followerId, "feed", newsId);

        if (batchCount >= 500) {
          batches.push(writeBatch(firestore));
          batchCount = 0;
        }

        batches[batches.length - 1].update(feedRef, {
          likesCount: increment(incrementValue),
        });
        batchCount++;
      }
    );

    for (const b of batches) {
      await b.commit();
    }
  } catch (error) {
    console.error("Feed 좋아요 수 업데이트 실패:", error);
  }
};

// ==================== 댓글 반응 관리 ====================
export const toggleCommentReaction = async (
  newsUserId: string,
  newsId: string,
  commentId: string,
  currentUserId: string,
  reactionType: "like" | "dislike"
): Promise<void> => {
  try {
    // news/{newsId}/comments/{commentId}/reactions/{userId}에 저장
    const reactionRef = doc(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments",
      commentId,
      "reactions",
      currentUserId
    );
    const commentRef = doc(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments",
      commentId
    );
    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const existingReaction = reactionSnap.data()?.type;
      if (existingReaction === reactionType) {
        // 같은 반응 취소
        await deleteDoc(reactionRef);
        await updateDoc(commentRef, {
          [`${reactionType}sCount`]: increment(-1),
        });
      } else {
        // 다른 반응으로 변경
        await setDoc(reactionRef, { type: reactionType });
        await updateDoc(commentRef, {
          [`${existingReaction}sCount`]: increment(-1),
          [`${reactionType}sCount`]: increment(1),
        });
      }
    } else {
      // 새 반응 추가
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
    const commentsRef = collection(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments"
    );
    const commentsQuery = query(
      commentsRef
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
              "news",
              newsId,
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

// ==================== 내 좋아요 목록 구독 (구조 변경) ====================
export const subscribeToMyNewsLikes = (
  currentUserId: string,
  onUpdate: (likesMap: Record<string, boolean>) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    // --- 6. 구독 경로 변경 (요청하신 'users/{id}/userLikes/likes' 구조) ---
    const myLikesDocRef = doc(
      firestore,
      "users",
      currentUserId,
      "userLikes", // 새 subcollection
      "likes" // 단일 문서
    ) as FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;

    // --- 7. 구독 로직 변경 (단일 문서 구독) ---
    const unsubscribe = onSnapshot(
      myLikesDocRef,
      (docSnap) => {
        const likesMap: Record<string, boolean> = {};

        // 문서가 존재하고, 'likedNewsIds' 배열이 있다면
        if (docSnap.exists()) {
          const data = docSnap.data();
          const likedNewsIds: string[] = data?.likedNewsIds || [];

          // 배열을 맵(Record)으로 변환 (컨텍스트 호환용)
          for (const newsId of likedNewsIds) {
            likesMap[newsId] = true;
          }
        }

        // 컨텍스트에는 { "newsId1": true } 형태의 맵을 전달
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
    const commentsRef = collection(
      firestore,
      "users",
      newsUserId,
      "news",
      newsId,
      "comments"
    );
    const commentsSnap = await getDocs(commentsRef);
    const reactions: Record<string, "like" | "dislike"> = {};
    const reactionPromises = commentsSnap.docs.map(
      async (commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const reactionRef = doc(
          firestore,
          "users",
          newsUserId,
          "news",
          newsId,
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