import {
  getAnalytics,
  logEvent,
  logScreenView,
} from "@react-native-firebase/analytics";
import { app } from "@/config/firebase";

const analytics = getAnalytics(app);

//payload is simply an object containing additional data(parameters) you want to send along with the event
export const customLogEvent = async ({
  eventName = "",
  payload = {},
}: {
  eventName: string;
  payload?: Record<string, any>;
}) => {
  try {
    // ✅ 첫 번째 인자로 analytics 인스턴스 전달
    await logEvent(analytics, eventName, payload);
    console.log(`Logged custom event: ${eventName}`, payload);
  } catch (error) {
    console.error("Error logging custom app event:", error);
  }
};

export const customLogScreenView = async (screenName: string) => {
  try {
    await logScreenView(analytics, { screen_name: screenName });
    console.log(`Logged screen view: ${screenName}`);
  } catch (error) {
    console.error("Error logging screen view:", error);
  }
};
