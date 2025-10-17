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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { router } from "expo-router";
import { useNotification } from "./notificationContext";
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const authListenerSetup = useRef(false); // 중복 실행 방지

  const updateUserData = useCallback(async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
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
        setUser(userData);
      }
    } catch (error: any) {
      console.log("Error fetching user data:", error.message);
    }
  }, []);

  useEffect(() => {
    // 이미 설정되었으면 무시
    if (authListenerSetup.current) return;

    console.log("🔧 Setting up auth listener...");
    authListenerSetup.current = true;

    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
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
  }, [updateUserData]); // updateUserData를 dependency에 추가

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateUserData(userCredential.user.uid);
      router.replace("/(tabs)");
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)"))
        msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      else if (msg.includes("(auth/invalid-email)"))
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

      const { expoPushToken, notification, error } = useNotification();

      await setDoc(doc(firestore, "users", response.user.uid), {
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
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "이미 사용 중인 이메일입니다.";
      else if (msg.includes("(auth/invalid-email)"))
        msg = "이메일 형식이 올바르지 않습니다.";
      return { success: false, msg };
    }
  };

  const changeUserStock = async (price: number) => {
    if (!user) return { success: false, msg: "User not logged in." };
    setUser({ ...user, price });
    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, { price });
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, msg: "Failed to change user stock." };
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      router.replace("/(auth)/welcome");
    } catch (error) {
      console.log("Logout Error: ", error);
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
