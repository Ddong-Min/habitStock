import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, UserType } from "@/types";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { router } from "expo-router";
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth State Changed: ", firebaseUser);
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        });
        updateUserData(firebaseUser.uid);

        router.replace("/(tabs)");
      } else {
        setUser(null);
        router.replace("/(auth)/welcome");
      }
    });

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
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        email,
        uid: response?.user?.uid,
        image: null,
        price: 100,
        quantity: 1,
        lastUpdated: new Date().toISOString(),
        name_lower: name.toLowerCase(),
        followersCount: 0,
        followingCount: 0,
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
      const docRef = doc(firestore, "users", uid); // users 컬렉션에서 uid 문서 참조 (즉, 주소를 받아오는거)
      const docSnap = await getDoc(docRef); // 스냅샷 받아오기
      if (docSnap.exists()) {
        const data = docSnap.data(); // 스냅샷에서 데이터 꺼내기 (실제 데이터를 받아오는 부분)
        const userData: UserType = {
          uid: data?.uid,
          email: data?.email || null,
          name: data?.name || null,
          image: data.image || null,
          price: data?.price,
          quantity: data?.quantity,
          lastUpdated: data?.lastUpdated,
          followersCount: data?.followersCount || 0,
          followingCount: data?.followingCount || 0,
        };
        setUser({ ...userData });
      }
    } catch (error: any) {
      let msg = error.message;
      console.log(msg);
    }
  };

  const changeUserStock = async (price: number) => {
    if (user) {
      setUser({ ...user, price });
    }
    const userRef = doc(firestore, "users", user?.uid!);
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
      console.log("Logging out...");
      await auth.signOut();
      setUser(null);
      router.replace("/(auth)/welcome");
    } catch (error) {
      console.log("Logout Error: ", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
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
