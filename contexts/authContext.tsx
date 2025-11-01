import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { AuthContextType, UserType, ChartColorScheme } from "@/types";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { auth, firestore } from "@/config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  signInWithCredential,
  GoogleAuthProvider,
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
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const AuthContext = createContext<AuthContextType | null>(null);
type LoginResponse = {
  success: boolean;
  msg?: string;
  needVerification?: boolean;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { expoPushToken } = useNotification();

  //firestore 구독해제(Unsubscribe) 보관함(Ref)
  const firestoreUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        console.log("Auth state changed:", firebaseUser?.uid || "null");

        if (firestoreUnsubRef.current) {
          console.log("Unsubscribing from previous Firestore listener");
          firestoreUnsubRef.current();
          firestoreUnsubRef.current = null;
        }
        if (firebaseUser) {
          const docRef = doc(firestore, "users", firebaseUser.uid);
          firestoreUnsubRef.current = onSnapshot(
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
                  emailVerified: firebaseUser.emailVerified,

                  // 차트 설정
                  showMovingAverage:
                    data.showMovingAverage === undefined
                      ? true
                      : data.showMovingAverage,
                  chartColorScheme:
                    (data.chartColorScheme as ChartColorScheme) || "red-up",
                  chartLineColor: data.chartLineColor || "#6A8BFF",

                  // ✅ 뉴스 생성 횟수 (기본값 처리)
                  newsGenerationCount: data.newsGenerationCount || 0,
                  newsGenerationLastReset: data.newsGenerationLastReset || null,
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
          setUser(null);
          setIsAuthLoading(false);
        }
      }
    );

    return () => {
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

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 이메일 인증 확인
      if (!userCredential.user.emailVerified) {
        return {
          success: false,
          msg: "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
          needVerification: true,
        };
      }

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
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      auth.languageCode = "ko";
      await sendEmailVerification(response.user);

      // Firestore에 사용자 데이터 생성
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

        // 차트 설정 기본값
        showMovingAverage: true,
        chartColorScheme: "red-up",
        chartLineColor: "#6A8BFF",

        // ✅ 뉴스 생성 횟수 기본값
        newsGenerationCount: 0,
        newsGenerationLastReset: null,
      });

      return {
        success: true,
        msg: "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
      };
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/email-already-in-use")
        msg = "이미 사용 중인 이메일입니다.";
      else if (error.code === "auth/invalid-email")
        msg = "이메일 형식이 올바르지 않습니다.";
      else if (error.code === "auth/weak-password")
        msg = "비밀번호는 최소 6자 이상이어야 합니다.";
      return { success: false, msg };
    }
  };

  // 이메일 인증 재발송
  const resendVerificationEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, msg: "사용자 정보를 찾을 수 없습니다." };
      }

      if (currentUser.emailVerified) {
        return { success: false, msg: "이미 이메일 인증이 완료되었습니다." };
      }

      auth.languageCode = "ko";
      await sendEmailVerification(currentUser);
      return { success: true, msg: "인증 이메일이 재발송되었습니다." };
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/too-many-requests") {
        msg = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
      return { success: false, msg };
    }
  };

  // 이메일 인증 상태 확인
  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      await currentUser.reload();
      return currentUser.emailVerified;
    } catch (error) {
      console.log("Error checking email verification:", error);
      return false;
    }
  };

  // 네이티브 Google Sign-In
  const googleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) {
        throw new Error("No ID token present!");
      }

      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

      const userRef = doc(firestore, "users", userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: userCredential.user.displayName || "사용자",
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          image: userCredential.user.photoURL || null,
          price: 100,
          quantity: 1,
          lastUpdated: new Date().toISOString(),
          name_lower: (
            userCredential.user.displayName || "사용자"
          ).toLowerCase(),
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

          // 차트 설정 기본값
          showMovingAverage: true,
          chartColorScheme: "red-up",
          chartLineColor: "#6A8BFF",

          // ✅ 뉴스 생성 횟수 기본값
          newsGenerationCount: 0,
          newsGenerationLastReset: null,
        });
      }

      router.replace("/(tabs)");
      return { success: true };
    } catch (error: any) {
      let msg = "구글 로그인에 실패했습니다.";
      if (error.code === "7" || error.code === "SIGN_IN_CANCELLED") {
        msg = "구글 로그인이 취소되었습니다.";
      } else if (error.code === "IN_PROGRESS") {
        msg = "이미 로그인 진행 중입니다.";
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        msg = "Google Play Services를 사용할 수 없습니다.";
      }
      console.log("Google Sign-In Error:", error);
      return { success: false, msg };
    }
  };

  const changeUserStock = async (price: number) => {
    if (!user) return { success: false, msg: "User not logged in." };

    setUser((prevUser) => (prevUser ? { ...prevUser, price } : null));

    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, { price });
      console.log("✅ User stock updated successfully");
      return { success: true };
    } catch (error: any) {
      console.log("❌ Failed to update user stock:", error);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, price: user.price } : null
      );
      if (error.code === "unavailable") {
        console.log("📴 Offline: Update will sync when online");
        setUser((prevUser) => (prevUser ? { ...prevUser, price } : null));
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
      try {
        await GoogleSignin.signOut();
        console.log("✅ Google signed out");
      } catch (googleError) {
        console.log("Google sign out skipped:", googleError);
      }
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
    resendVerificationEmail,
    googleSignIn,
    checkEmailVerification,
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
