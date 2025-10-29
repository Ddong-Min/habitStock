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
import firebase, { auth, firestore } from "@/config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "@react-native-firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Unsubscribe,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { router } from "expo-router";
import { useNotification } from "./notificationContext";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const authListenerSetup = useRef(false);
  const { expoPushToken } = useNotification();

  //firestore 구독해제(Unsubscribe) 보관함(Ref)
  const firestoreUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        console.log("Auth state changed:", firebaseUser?.uid || "null");

        if (firestoreUnsubRef.current) {
          // 이전 Firestore 리스너가 있으면 구독 해제
          //만약 사용자가 로그아웃하면 onAuthStateChanged가 호출되고
          //이전 리스너를 해제해야함

          console.log("Unsubscribing from previous Firestore listener");
          firestoreUnsubRef.current(); // 이전 Firestore 리스너 구독 해제
          firestoreUnsubRef.current = null; // 참조 초기화
        }
        if (firebaseUser) {
          const docRef = doc(firestore, "users", firebaseUser.uid);
          firestoreUnsubRef.current = onSnapshot(
            //onSnapshot은 캐시우선전략 사용
            docRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const isFromCache = docSnap.metadata.fromCache;
                console.log(
                  `User data loaded from ${
                    isFromCache ? "CACHE ✅" : "SERVER 🌐"
                  }`
                );
                if (!data) {
                  console.log("Document exists but has no data");
                  setUser(null);
                  return;
                }
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
                  expoPushToken: data.expoPushToken || null,
                };
                setUser(userData);
              } else {
                console.log("No user document found for this UID");
                setUser(null);
              }
              setIsAuthLoading(false);
            },
            (error) => {
              console.log("Error in onSnapshot listener:", error.message);
              setUser(null);
              setIsAuthLoading(false);
            }
          );
        } else {
          //로그아웃 또는 아직 로그인 안된 상태
          setUser(null);
          setIsAuthLoading(false);
        }
      }
    );
    // useEffect 클린업: Auth 리스너와 Firestore 리스너 모두 구독 해제
    return () => {
      //앱을 완전히 종료할 때만 실행됨
      console.log("🧹 Cleaning up auth listener...");
      authUnsub();
      if (firestoreUnsubRef.current) {
        console.log("🧹 Cleaning up Firestore listener...");
        firestoreUnsubRef.current();
      }
    };
  }, []);

  // expoPushToken과 DB의 토큰이 다르면 업데이트
  useEffect(() => {
    const updatePushToken = async () => {
      if (!user || !expoPushToken) return;

      // DB의 토큰과 현재 토큰이 다르면 업데이트
      if (user.expoPushToken !== expoPushToken) {
        try {
          const userRef = doc(firestore, "users", user.uid);
          await updateDoc(userRef, {
            expoPushToken: expoPushToken,
          });
          console.log("✅ Push token updated successfully");
        } catch (error) {
          console.log("❌ Failed to update push token:", error);
        }
      }
    };

    updatePushToken();
  }, [expoPushToken, user?.uid]);

  const login = async (email: string, password: string) => {
    try {
      // ✅ Modular API로 로그인
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      // ✅ Modular API로 회원가입
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ✅ Modular API로 사용자 데이터 생성
      const userRef = doc(firestore, "users", response.user.uid);
      await setDoc(userRef, {
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

    // ✅ Modular API로 문서 업데이트
    const userRef = doc(firestore, "users", user.uid);
    try {
      // 서버에 업데이트 (오프라인 시 자동으로 큐에 저장되고 온라인 시 실행됨)
      await updateDoc(userRef, { price });
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
      // ✅ Modular API로 로그아웃
      await signOut(auth);
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
