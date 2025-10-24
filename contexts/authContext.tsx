import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { AuthContextType, UserType } from "@/types";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { auth, firestore } from "@/config/firebase";
import { router } from "expo-router";
import { useNotification } from "./notificationContext";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const authListenerSetup = useRef(false);
  const { expoPushToken, notification, error } = useNotification();

  const updateUserData = useCallback(async (uid: string) => {
    try {
      const docRef = firestore.collection("users").doc(uid);

      // 📌 캐시 우선 전략:
      // 1. 먼저 캐시에서 데이터를 가져옴 (빠른 로딩)
      // 2. 그 다음 서버에서 최신 데이터를 확인
      // 3. 변경사항이 있으면 자동으로 업데이트됨

      // 'default' 옵션: 캐시 우선, 그 다음 서버 확인 (권장)
      // 'server': 항상 서버에서 가져옴 (오프라인에서 실패)
      // 'cache': 캐시에서만 가져옴 (서버 확인 안함)
      const docSnap = await docRef.get({ source: "default" });

      if (docSnap.exists()) {
        const data = docSnap.data();
        // data()는 항상 객체를 반환하거나 undefined를 반환함
        if (data) {
          const userData: UserType = {
            uid: data.uid,
            email: data.email || null,
            name: data.name || null,
            image: data.image || null,
            price: data.price,
            quantity: data.quantity,
            lastUpdated: data.lastUpdated,
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            bio: data.bio || "",
            isDarkMode: data.isDarkMode || false,
            allowAlarm: data.allowAlarm || false,
            duetime: data.duetime || "00:00",
            words: data.words || "korean",
            registerDate: data.registerDate || null,
          };

          // 캐시된 데이터인지 확인 (디버깅용)
          const isFromCache = docSnap.metadata.fromCache;
          console.log(
            `📦 User data loaded from ${isFromCache ? "CACHE" : "SERVER"}`
          );

          setUser(userData);
        }
      }
    } catch (error: any) {
      console.log("❌ Error fetching user data:", error.message);

      // 오프라인 상태에서도 캐시된 데이터를 사용하려고 시도
      if (error.code === "unavailable") {
        console.log("📴 Device is offline, trying to use cached data");
        try {
          const docRef = firestore.collection("users").doc(uid);
          const docSnap = await docRef.get({ source: "cache" });
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              const userData: UserType = {
                uid: data.uid,
                email: data.email || null,
                name: data.name || null,
                image: data.image || null,
                price: data.price,
                quantity: data.quantity,
                lastUpdated: data.lastUpdated,
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
                bio: data.bio || "",
                isDarkMode: data.isDarkMode || false,
                allowAlarm: data.allowAlarm || false,
                duetime: data.duetime || "00:00",
                words: data.words || "korean",
                registerDate: data.registerDate || null,
              };
              console.log("✅ Successfully loaded user data from cache");
              setUser(userData);
            }
          }
        } catch (cacheError: any) {
          console.log("❌ No cached data available:", cacheError.message);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (authListenerSetup.current) return;
    console.log("🔧 Setting up auth listener...");
    authListenerSetup.current = true;

    const unsub = auth.onAuthStateChanged(
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        console.log("🔐 Auth State Changed:", firebaseUser?.uid || "null");

        if (firebaseUser) {
          await updateUserData(firebaseUser.uid);
        } else {
          setUser(null);
        }
        setIsAuthLoading(false);
      }
    );

    return () => {
      console.log("🧹 Cleaning up auth listener");
      authListenerSetup.current = false;
      unsub();
    };
  }, [updateUserData]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );
      await updateUserData(userCredential.user.uid);
      router.replace("/(tabs)");
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      )
        msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      else if (error.code === "auth/invalid-email")
        msg = "이메일 형식이 올바르지 않습니다.";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      // 새로운 사용자 데이터 생성 시 서버에 직접 씀 (캐시 무시)
      await firestore
        .collection("users")
        .doc(response.user.uid)
        .set({
          name,
          email,
          uid: response.user.uid,
          image: null,
          price: 100,
          quantity: 1,
          lastUpdated: new Date().toISOString(),
          name_lower: name.toLowerCase(),
          followersCount: 0,
          followingCount: 0,
          bio: "",
          isDarkMode: false,
          allowAlarm: expoPushToken ? true : false,
          duetime: "00:00",
          words: "한국어",
          registerDate: new Date().toISOString().split("T")[0],
          expoPushToken: expoPushToken || null,
          consecutiveNoTaskDays: 0,
        });

      await updateUserData(response.user.uid);
      router.replace("/(tabs)");
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/email-already-in-use")
        msg = "이미 사용 중인 이메일입니다.";
      else if (error.code === "auth/invalid-email")
        msg = "이메일 형식이 올바르지 않습니다.";
      return { success: false, msg };
    }
  };

  const changeUserStock = async (price: number) => {
    if (!user) return { success: false, msg: "User not logged in." };

    // 🔄 낙관적 업데이트: UI를 먼저 업데이트
    setUser({ ...user, price });

    const userRef = firestore.collection("users").doc(user.uid);
    try {
      // 서버에 업데이트 (오프라인 시 자동으로 큐에 저장되고 온라인 시 실행됨)
      await userRef.update({ price });
      console.log("✅ User stock updated successfully");
      return { success: true };
    } catch (error: any) {
      console.log("❌ Failed to update user stock:", error);

      // 실패 시 원래 값으로 롤백
      setUser(user);

      // 오프라인 상태라면 성공으로 처리 (나중에 동기화됨)
      if (error.code === "unavailable") {
        console.log("📴 Offline: Update will sync when online");
        setUser({ ...user, price }); // 다시 업데이트
        return {
          success: true,
          msg: "오프라인 상태입니다. 온라인 시 자동 동기화됩니다.",
        };
      }

      return { success: false, msg: "주식 변경에 실패했습니다." };
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      router.replace("/(auth)/welcome");
    } catch (error) {
      console.log("❌ Logout Error: ", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthLoading,
    login,
    register,
    updateUserData,
    changeUserStock,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};
