// src/services/usersService.ts
import { firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
} from "@react-native-firebase/firestore";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { UserType } from "@/types";

// ✅ Firestore Modular API 사용

// 사용자 검색 (name으로, name_lower 필드 필요)
export const searchUsersByName = async (
  searchQuery: string,
  currentUserId: string
): Promise<UserType[]> => {
  try {
    const queryLower = searchQuery.toLowerCase();
    console.log("Searching users by name with query:", queryLower);

    const usersCollection = collection(firestore, "users");
    const q = query(
      usersCollection,
      where("name_lower", ">=", queryLower),
      where("name_lower", "<=", queryLower + "\uf8ff"),
      limit(20)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .filter(
        (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          docSnap.id !== currentUserId
      )
      .map((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = docSnap.data() || {};
        return {
          uid: docSnap.id,
          ...data,
        } as UserType;
      });
  } catch (error) {
    console.error("Error searching users by name:", error);
    return [];
  }
};

// 사용자 검색 (email으로)
export const searchUsersByEmail = async (
  searchQuery: string,
  currentUserId: string
): Promise<UserType[]> => {
  try {
    const usersCollection = collection(firestore, "users");
    const q = query(
      usersCollection,
      where("email", ">=", searchQuery),
      where("email", "<=", searchQuery + "\uf8ff"),
      limit(20)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .filter(
        (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          docSnap.id !== currentUserId
      )
      .map((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = docSnap.data() || {};
        return {
          uid: docSnap.id,
          ...data,
        } as UserType;
      });
  } catch (error) {
    console.error("Error searching users by email:", error);
    return [];
  }
};

// 추천 사용자 가져오기 (followersCount로 정렬)
export const getSuggestedUsers = async (
  currentUserId: string,
  limitCount: number = 10
): Promise<UserType[]> => {
  try {
    const usersCollection = collection(firestore, "users");
    const q = query(
      usersCollection,
      orderBy("followersCount", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .filter(
        (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          docSnap.id !== currentUserId
      )
      .map((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        return {
          uid: docSnap.id,
          ...(docSnap.data() || {}),
        } as UserType;
      });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return [];
  }
};

// 팔로잉 목록 실시간 구독
export const subscribeToFollowingList = (
  userId: string,
  onUpdate: (followingIds: Set<string>) => void,
  onGetData: (users: UserType[]) => void
) => {
  const collRef = collection(firestore, "following", userId, "userFollowing");

  return onSnapshot(
    collRef,
    async (snapshot) => {
      try {
        // 1) 팔로잉 id 수집
        const ids = new Set<string>(
          snapshot.docs.map(
            (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
              docSnap.id as string
          )
        );
        onUpdate(ids);

        if (ids.size === 0) {
          onGetData([]);
          return;
        }

        // 2) 각 uid의 users 컬렉션에서 데이터 가져오기 (병렬)
        const userDocs = await Promise.all(
          Array.from(ids).map(async (id) => {
            const userRef = doc(firestore, "users", id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              return {
                uid: userSnap.id,
                ...(userSnap.data() || {}),
              } as UserType;
            }
            return null;
          })
        );

        // 3) 존재하는 유저만 전달
        onGetData(userDocs.filter(Boolean) as UserType[]);
      } catch (error) {
        console.error(
          "Error in subscribeToFollowingList snapshot handler:",
          error
        );
        onGetData([]);
      }
    },
    (err) => {
      console.error("subscribeToFollowingList onSnapshot error:", err);
      onGetData([]);
    }
  );
};

// 팔로우하기 (batch 사용)
export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const batch = writeBatch(firestore);

  try {
    // following 문서
    const followingRef = doc(
      firestore,
      "following",
      currentUserId,
      "userFollowing",
      targetUserId
    );

    batch.set(followingRef, {
      followedAt: serverTimestamp(),
    });

    // followers 문서
    const followersRef = doc(
      firestore,
      "followers",
      targetUserId,
      "userFollowers",
      currentUserId
    );

    batch.set(followersRef, {
      followedAt: serverTimestamp(),
    });

    // counts 업데이트
    const currentUserRef = doc(firestore, "users", currentUserId);
    batch.update(currentUserRef, {
      followingCount: increment(1),
    });

    const targetUserRef = doc(firestore, "users", targetUserId);
    batch.update(targetUserRef, {
      followersCount: increment(1),
    });

    await batch.commit();
    console.log(`✅ ${currentUserId} followed ${targetUserId}`);
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

// 언팔로우하기 (batch 사용)
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

    // counts 업데이트 (감소)
    const currentUserRef = doc(firestore, "users", currentUserId);
    batch.update(currentUserRef, {
      followingCount: increment(-1),
    });

    const targetUserRef = doc(firestore, "users", targetUserId);
    batch.update(targetUserRef, {
      followersCount: increment(-1),
    });

    await batch.commit();
    console.log(`✅ ${currentUserId} unfollowed ${targetUserId}`);
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};
