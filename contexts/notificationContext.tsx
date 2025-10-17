import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";

// 🔥 FIX: expo-notifications에서 Subscription 타입 가져오기
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

  // 🔥 FIX: null로 초기화 (더 간단한 방법)
  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    // Push token 등록
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token);
        console.log("✅ Push token registered:", token);
      })
      .catch((error) => {
        setError(error);
        console.error("❌ Push token registration failed:", error);
      });

    // 포그라운드 알림 수신 리스너
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
      });

    // 알림 클릭/탭 리스너
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("🔔 Notification Response: ", response);
        console.log(
          "📦 Notification Data: ",
          response.notification.request.content.data
        );

        // 🎯 여기서 알림 클릭 시 네비게이션 처리
        // const data = response.notification.request.content.data;
        // if (data.screen) {
        //   navigation.navigate(data.screen, data.params);
        // }
      });

    return () => {
      // 🔥 FIX: remove() 메서드 직접 호출
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
