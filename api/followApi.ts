// src/services/usersService.ts
import { firestore } from "@/config/firebase"; // config에서 내보낸 모듈(react-native-firebase 기본 export)
import firebaseFirestore from "@react-native-firebase/firestore";
import { UserType } from "@/types";

/**
 * NOTE:
 * - firestore() 형태로 호출해야 합니다.
 * - FieldValue 등은 firebaseFirestore.FieldValue 로 사용합니다.
 */

// 사용자 검색 (name으로, name_lower 필드 필요)
export const searchUsersByName = async (
  searchQuery: string,
  currentUserId: string
): Promise<UserType[]> => {
  try {
    const queryLower = searchQuery.toLowerCase();
    console.log("Searching users by name with query:", queryLower);

    const snapshot = await firestore()
      .collection("users")
      .where("name_lower", ">=", queryLower)
      .where("name_lower", "<=", queryLower + "\uf8ff")
      .limit(20)
      .get();

    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => {
        const data = doc.data() || {};
        return {
          uid: doc.id,
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
    const snapshot = await firestore()
      .collection("users")
      .where("email", ">=", searchQuery)
      .where("email", "<=", searchQuery + "\uf8ff")
      .limit(20)
      .get();

    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => {
        const data = doc.data() || {};
        return {
          uid: doc.id,
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
    const snapshot = await firestore()
      .collection("users")
      .orderBy("followersCount", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => {
        return {
          uid: doc.id,
          ...(doc.data() || {}),
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
  const collRef = firestore()
    .collection("following")
    .doc(userId)
    .collection("userFollowing");

  // onSnapshot은 unsubscribe 함수를 반환하므로 그대로 반환
  return collRef.onSnapshot(
    async (snapshot) => {
      try {
        // 1) 팔로잉 id 수집
        const ids = new Set(snapshot.docs.map((doc) => doc.id));
        onUpdate(ids);

        if (ids.size === 0) {
          onGetData([]);
          return;
        }

        // 2) 각 uid의 users 컬렉션에서 데이터 가져오기 (병렬)
        const userDocs = await Promise.all(
          Array.from(ids).map(async (id) => {
            const userSnap = await firestore()
              .collection("users")
              .doc(id)
              .get();
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
  const batch = firestore().batch();

  try {
    // following 문서
    const followingRef = firestore()
      .collection("following")
      .doc(currentUserId)
      .collection("userFollowing")
      .doc(targetUserId);

    batch.set(followingRef, {
      followedAt: firebaseFirestore.FieldValue.serverTimestamp(),
    });

    // followers 문서
    const followersRef = firestore()
      .collection("followers")
      .doc(targetUserId)
      .collection("userFollowers")
      .doc(currentUserId);

    batch.set(followersRef, {
      followedAt: firebaseFirestore.FieldValue.serverTimestamp(),
    });

    // counts 업데이트
    const currentUserRef = firestore().collection("users").doc(currentUserId);
    batch.update(currentUserRef, {
      followingCount: firebaseFirestore.FieldValue.increment(1),
    });

    const targetUserRef = firestore().collection("users").doc(targetUserId);
    batch.update(targetUserRef, {
      followersCount: firebaseFirestore.FieldValue.increment(1),
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
  const batch = firestore().batch();

  try {
    // following에서 삭제
    const followingRef = firestore()
      .collection("following")
      .doc(currentUserId)
      .collection("userFollowing")
      .doc(targetUserId);

    batch.delete(followingRef);

    // followers에서 삭제
    const followersRef = firestore()
      .collection("followers")
      .doc(targetUserId)
      .collection("userFollowers")
      .doc(currentUserId);

    batch.delete(followersRef);

    // counts 업데이트 (감소)
    const currentUserRef = firestore().collection("users").doc(currentUserId);
    batch.update(currentUserRef, {
      followingCount: firebaseFirestore.FieldValue.increment(-1),
    });

    const targetUserRef = firestore().collection("users").doc(targetUserId);
    batch.update(targetUserRef, {
      followersCount: firebaseFirestore.FieldValue.increment(-1),
    });

    await batch.commit();
    console.log(`✅ ${currentUserId} unfollowed ${targetUserId}`);
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};
