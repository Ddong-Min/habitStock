// src/config/firebaseConfig.ts
import { getApp } from "@react-native-firebase/app";
import { getFirestore } from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import { getStorage } from "@react-native-firebase/storage";

// ✅ 앱 인스턴스 가져오기
const app = getApp();

// ✅ Firestore 인스턴스 가져오기
const firestore = getFirestore(app);

// ✅ 오프라인 캐시 설정 (React Native에서는 이 방식 사용)
firestore.settings({
  persistence: true,
  cacheSizeBytes: -1, // -1 = 무제한 캐시
});

// ✅ 다른 서비스들
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ AI Functions URL
export const AI_FUNCTIONS_URL = process.env.EXPO_PUBLIC_CREATE_NEWS_API_URL;

// ✅ 내보내기
export { app, firestore, auth, storage };

export default {
  app,
  firestore,
  auth,
  storage,
};
