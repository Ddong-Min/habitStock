// 📂 src/config/firebase.ts

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import analytics from "@react-native-firebase/analytics";

// ✅ Firestore 설정 (오프라인 캐시 활성화)
firestore().settings({
  persistence: true,
  cacheSizeBytes: -1, // -1 = 무제한 캐시
});

// ✅ AI Functions URL (.env 또는 Expo Config에서 주입)
export const AI_FUNCTIONS_URL = process.env.EXPO_PUBLIC_CREATE_NEWS_API_URL;

// ✅ 내보내기
export { auth, firestore, storage, analytics };

// ✅ 선택적 default export
export default {
  auth,
  firestore,
  storage,
  analytics,
};
