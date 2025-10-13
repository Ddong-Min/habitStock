import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthContextType, UserType } from "@/types";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User, // Firebase User 타입을 import하는 것이 좋습니다.
} from "firebase/auth";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  // 1. 초기 인증 상태를 확인하는 동안 사용할 로딩 상태를 추가합니다.
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        console.log("Auth State Changed: ", firebaseUser);
        if (firebaseUser) {
          // Firestore에서 최신 사용자 정보를 가져옵니다.
          await updateUserData(firebaseUser.uid);
          // 라우팅은 _layout.tsx에서 처리하므로 여기서는 주석 처리합니다.
          // router.replace("/(tabs)");
        } else {
          setUser(null);
          // 라우팅은 _layout.tsx에서 처리하므로 여기서는 주석 처리합니다.
          // router.replace("/(auth)/welcome");
        }
        // 2. 사용자 인증 상태 확인이 완료되면 로딩 상태를 false로 변경합니다.
        setIsAuthLoading(false);
      }
    );

    // 컴포넌트가 언마운트될 때 구독을 해제합니다.
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        allowAlarm: true,
        duetime: "00:00",
        words: "한국어",
        registerDate: new Date().toISOString().split("T")[0],
      });
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

  const updateUserData = async (uid: string) => {
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
        };
        setUser(userData);
      }
    } catch (error: any) {
      console.log("Error fetching user data:", error.message);
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
      // setUser(null); // onAuthStateChanged가 자동으로 처리해줍니다.
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
    // 3. isAuthLoading을 context 값에 추가합니다.
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
