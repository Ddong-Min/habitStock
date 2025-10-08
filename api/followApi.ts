import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  onSnapshot,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { UserType } from "@/types";

// 사용자 검색 (name으로)
export const searchUsersByName = async (
  searchQuery: string,
  currentUserId: string
): Promise<UserType[]> => {
  try {
    const queryLower = searchQuery.toLowerCase();
    const usersRef = collection(firestore, "users");

    const q = query(
      usersRef,
      where("name_lowercase", ">=", queryLower),
      where("name_lowercase", "<=", queryLower + "\uf8ff"), //해당 단어로 시작하는 친구 다 찾아오기
      limit(20)
    );

    const snapshot = await getDocs(q); // this executes the query only once
    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
        } as UserType;
      });
  } catch (error) {
    console.error("Error searching users by name:", error);
    return [];
  }
};

export const searchUsersByEmail = async (
  searchQuery: string,
  currentUserId: string
): Promise<UserType[]> => {
  try {
    const usersRef = collection(firestore, "users");

    const q = query(
      usersRef,
      where("email", ">=", searchQuery),
      where("email", "<=", searchQuery + "\uf8ff"), //해당 단어로 시작하는 친구 다 찾아오기
      limit(20)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
        } as UserType;
      });
  } catch (error) {
    console.error("Error searching users by email:", error);
    return [];
  }
};

// 추천 사용자 가져오기
export const getSuggestedUsers = async (
  currentUserId: string,
  limitCount: number = 10
): Promise<UserType[]> => {
  try {
    const usersRef = collection(firestore, "users");
    const q = query(
      usersRef,
      orderBy("followersCount", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => ({ ...doc.data() } as UserType));
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return [];
  }
};

// 팔로잉 목록 실시간 구독
// 팔로잉 목록 실시간 구독 (UserType 데이터 포함)
export const subscribeToFollowingList = (
  userId: string,
  onUpdate: (followingIds: Set<string>) => void,
  onGetData: (users: UserType[]) => void
) => {
  const followingRef = collection(
    firestore,
    "following",
    userId,
    "userFollowing"
  );

  // 실시간 감시
  return onSnapshot(followingRef, async (snapshot) => {
    // 1️⃣ 팔로잉한 uid 수집
    const ids = new Set(snapshot.docs.map((doc) => doc.id));
    onUpdate(ids);

    if (ids.size === 0) {
      onGetData([]); // 팔로잉이 없으면 빈 배열 전달
      return;
    }

    // 2️⃣ 각 uid의 users 컬렉션 데이터 가져오기
    try {
      const userDocs = await Promise.all(
        Array.from(ids).map(async (id) => {
          const userRef = doc(firestore, "users", id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            return { uid: userSnap.id, ...data } as UserType;
          }
          return null;
        })
      );

      // 3️⃣ 존재하는 유저만 전달
      onGetData(userDocs.filter(Boolean) as UserType[]);
    } catch (error) {
      console.error("Error fetching following user data:", error);
      onGetData([]); // 에러 발생 시 빈 배열 전달
    }
  });
};

// 팔로우하기
export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const batch = writeBatch(firestore); //한번에 여러 쓰기 작업을 수행할 수 있도록 해줌
  try {
    // 현재 유저의 following에 추가
    const followingRef = doc(
      firestore,
      "following",
      currentUserId,
      "userFollowing",
      targetUserId
    );

    //following정보 만들고, follow한 시간 기록
    batch.set(followingRef, {
      followedAt: serverTimestamp(),
    });

    // 타겟 유저의 followers에 추가
    const followersRef = doc(
      firestore,
      "followers",
      targetUserId,
      "userFollowers",
      currentUserId
    );

    //followers정보 만들고, follow한 시간 기록
    batch.set(followersRef, {
      followedAt: serverTimestamp(),
    });

    // 카운트 업데이트user의 정보 data에 들어가서 followingCount, followersCount 업데이트
    const currentUserRef = doc(firestore, "users", currentUserId);
    batch.update(currentUserRef, {
      followingCount: increment(1),
    });

    const targetUserRef = doc(firestore, "users", targetUserId);
    batch.update(targetUserRef, {
      followersCount: increment(1),
    });

    await batch.commit(); // 커밋하여 모든 작업을 한 번에 적용
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

// 언팔로우하기
export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const batch = writeBatch(firestore);

  try {
    // following에서 삭제
    const followingRef = doc(
      firestore,
      "following",
      currentUserId,
      "userFollowing",
      targetUserId
    );
    batch.delete(followingRef);

    // followers에서 삭제
    const followersRef = doc(
      firestore,
      "followers",
      targetUserId,
      "userFollowers",
      currentUserId
    );
    batch.delete(followersRef);

    // 카운트 업데이트
    const currentUserRef = doc(firestore, "users", currentUserId);
    batch.update(currentUserRef, {
      followingCount: increment(-1),
    });

    const targetUserRef = doc(firestore, "users", targetUserId);
    batch.update(targetUserRef, {
      followersCount: increment(-1),
    });

    await batch.commit(); // 커밋하여 모든 작업을 한 번에 적용
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};
