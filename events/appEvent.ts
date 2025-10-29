// 📂 src/api/analytics.ts
import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import { app } from "@/config/firebase";

const analytics = getAnalytics(app);

// ✅ 커스텀 이벤트 로깅
export const customLogEvent = async ({
  eventName = "",
  payload = {},
}: {
  eventName: string;
  payload?: Record<string, any>;
}) => {
  try {
    // 타입 강제 캐스팅으로 string 이벤트 허용
    await logEvent(analytics, eventName as string, payload);
    console.log(`Logged custom event: ${eventName}`, payload);
  } catch (error) {
    console.error("Error logging custom app event:", error);
  }
};

// ✅ 스크린 뷰 로깅 (deprecated logScreenView 대신 logEvent)
export const customLogScreenView = async (screenName: string) => {
  try {
    await logEvent(analytics, "screen_view" as string, {
      screen_name: screenName,
      screen_class: screenName, // optional but recommended
    });
    console.log(`Logged screen view: ${screenName}`);
  } catch (error) {
    console.error("Error logging screen view:", error);
  }
};
