import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";

type NotificationSubscription = ReturnType<
  typeof Notifications.addNotificationReceivedListener
>;

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    // 🔥 STEP 1: Android 채널 먼저 설정 (권한 요청 전에)
    const setupNotifications = async () => {
      if (Platform.OS === "android") {
        console.log("📱 Setting up Android notification channel...");
        await Notifications.setNotificationChannelAsync("default", {
          name: "기본 알림",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
        });
        console.log("✅ Android notification channel created");
      }

      // 🔥 STEP 2: 권한 요청 및 Push token 등록
      try {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        console.log("✅ Push token registered:", token);
      } catch (error) {
        setError(error as Error);
        console.error("❌ Push token registration failed:", error);
      }
    };

    setupNotifications();

    // 🔥 STEP 3: 포그라운드 알림 수신 리스너
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 ========== 알림 수신 ==========");
        console.log("제목:", notification.request.content.title);
        console.log("내용:", notification.request.content.body);
        console.log("데이터:", notification.request.content.data);
        console.log("================================");
        setNotification(notification);
      });

    // 🔥 STEP 4: 알림 클릭/탭 리스너
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 ========== 알림 클릭 ==========");
        console.log("제목:", response.notification.request.content.title);
        console.log("데이터:", response.notification.request.content.data);
        console.log("================================");

        const data = response.notification.request.content.data;

        // 🎯 알림 타입별 네비게이션 처리
        if (data.type === "1hour_before" || data.type === "10min_before") {
          // 할일 화면으로 이동
          console.log("→ 할일 화면으로 이동:", data.date);
          // navigation.navigate('Tasks', { date: data.date });
        } else if (
          data.type === "deadline_passed" ||
          data.type === "no_task_penalty"
        ) {
          // 주가 화면으로 이동
          console.log("→ 주가 화면으로 이동");
          // navigation.navigate('Stock');
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
