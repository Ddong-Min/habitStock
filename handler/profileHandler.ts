import { useState, useEffect, useCallback } from "react"; // ✅ useCallback 임포트
import { Alert, Linking } from "react-native";
import storage from "@react-native-firebase/storage";
import { firestore } from "@/config/firebase";
import { doc, updateDoc, deleteDoc } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import { router } from "expo-router";
import { useAuth } from "../contexts/authContext";
import { useNotification } from "../contexts/notificationContext";
import { ChartColorScheme } from "@/types";
import { customLogEvent } from "../events/appEvent";

export const useProfileHandlers = () => {
  const { user, logout } = useAuth();
  const { expoPushToken } = useNotification();

  // --- Local State ---
  // (authContext의 user가 변경될 때마다 이 state들도 동기화됩니다)
  const [userName, setUserName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [darkMode, setDarkMode] = useState(user?.isDarkMode || false);
  const [notifications, setNotifications] = useState(user?.allowAlarm || false);
  const [deadlineTime, setDeadlineTime] = useState(user?.duetime || "00:00");
  const [words, setWords] = useState(user?.words || "한국어");
  // ✅ 차트 설정 Local State 추가
  const [showMovingAverage, setShowMovingAverage] = useState(
    user?.showMovingAverage ?? true
  );
  const [chartColorScheme, setChartColorScheme] = useState(
    user?.chartColorScheme ?? "red-up"
  );
  const [chartLineColor, setChartLineColor] = useState(
    user?.chartLineColor ?? "#6A8BFF"
  );

  // Modals
  const [isUploading, setIsUploading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState(user?.name || "");
  const [showBioModal, setShowBioModal] = useState(false);
  const [tempBio, setTempBio] = useState(user?.bio || "");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(
    parseInt(user?.duetime?.split(":")[0] || "0")
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /** ✅ user 객체(from authContext)가 변경될 때 로컬 상태 동기화 */
  useEffect(() => {
    if (user) {
      setUserName(user.name || "");
      setBio(user.bio || "");
      setDarkMode(user.isDarkMode || false);
      setNotifications(user.allowAlarm || false);
      setDeadlineTime(user.duetime || "00:00");
      setWords(user.words || "한국어");
      setSelectedHour(parseInt(user.duetime?.split(":")[0] || "0"));

      // ✅ 차트 설정 동기화
      setShowMovingAverage(user.showMovingAverage ?? true);
      setChartColorScheme(user.chartColorScheme ?? "red-up");
      setChartLineColor(user.chartLineColor ?? "#6A8BFF");
    }
  }, [user]); // (authContext의 user가 바뀔 때마다 실행)

  /** ✅ Firestore 유저 데이터 업데이트 (useCallback) */
  const updateUserSettings = useCallback(
    async (field: string, value: any) => {
      if (!user?.uid) return;
      try {
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, { [field]: value });
        console.log(`✅ ${field} 업데이트 완료:`, value);

        await customLogEvent({
          eventName: "profile_setting_update",
          payload: {
            uid: user.uid,
            field: field,
            value: String(value),
          },
        });
      } catch (error) {
        console.error(`❌ ${field} 업데이트 실패:`, error);
        Alert.alert("오류", "설정을 저장하는데 실패했습니다.");
      }
    },
    [user]
  ); // ✅ user가 바뀔 때만 함수 재생성

  /** ✅ Firebase Storage 업로드 (useCallback) */
  const uploadImageToFirebase = useCallback(
    async (uri: string) => {
      if (!user) throw new Error("User not logged in.");
      const filename = `profile_${user.uid}_${Date.now()}.jpg`;
      const refPath = storage().ref(`profiles/${filename}`);

      await refPath.putFile(uri);
      const downloadURL = await refPath.getDownloadURL();
      return downloadURL;
    },
    [user]
  );

  const uploadAndUpdateImage = useCallback(
    async (uri: string) => {
      try {
        setIsUploading(true);
        const imageUrl = await uploadImageToFirebase(uri);
        await updateUserSettings("image", imageUrl); // (await 유지)
        setIsUploading(false);
        Alert.alert("성공", "프로필 사진이 변경되었습니다.");
      } catch (error) {
        setIsUploading(false);
        Alert.alert("오류", "이미지 업로드에 실패했습니다.");
      }
    },
    [uploadImageToFirebase, updateUserSettings]
  );

  /** ✅ 카메라 촬영 (useCallback) */
  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAndUpdateImage(result.assets[0].uri);
    }
  }, [uploadAndUpdateImage]);

  /** ✅ 갤러리 선택 (useCallback) */
  const handleGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert(
        "권한 필요",
        "사진 라이브러리 접근 권한이 필요합니다."
      );

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAndUpdateImage(result.assets[0].uri);
    }
  }, [uploadAndUpdateImage]);

  const handleImagePicker = useCallback(() => {
    Alert.alert("프로필 사진 변경", "사진을 어떻게 선택하시겠습니까?", [
      { text: "카메라로 촬영", onPress: handleCamera },
      { text: "갤러리에서 선택", onPress: handleGallery },
      { text: "취소", style: "cancel" },
    ]);
  }, [handleCamera, handleGallery]);

  /** ✅ 이름 변경 (useCallback + await 제거) */
  const handleNameConfirm = useCallback(() => {
    if (!tempName.trim()) return Alert.alert("오류", "이름을 입력해주세요.");
    setUserName(tempName); // ✅ 1. 로컬 상태 즉시 변경
    updateUserSettings("name", tempName); // ✅ 2. DB 업데이트 (await 없음)
    setShowNameModal(false);
    Alert.alert("성공", "이름이 변경되었습니다.");
  }, [tempName, updateUserSettings]);

  /** ✅ 한 줄 소개 변경 (useCallback + await 제거) */
  const handleBioConfirm = useCallback(() => {
    const trimmedBio = tempBio.substring(0, 150);
    setBio(trimmedBio); // ✅ 1. 로컬 상태 즉시 변경
    updateUserSettings("bio", trimmedBio); // ✅ 2. DB 업데이트 (await 없음)
    setShowBioModal(false);
    Alert.alert("성공", "소개가 변경되었습니다.");
  }, [tempBio, updateUserSettings]);

  /** ✅ 다크 모드 토글 (useCallback + await 제거) */
  const handleDarkModeToggle = useCallback(
    (value: boolean) => {
      setDarkMode(value); // ✅ 1. 로컬 상태 즉시 변경
      updateUserSettings("isDarkMode", value); // ✅ 2. DB 업데이트 (await 없음)
    },
    [updateUserSettings]
  );

  /** ✅ 알림 설정 토글 (useCallback + await 최적화) */
  const handleNotificationToggle = useCallback(
    async (value: boolean) => {
      if (!user?.uid) return;

      // (이벤트 로깅은 즉시 실행)
      customLogEvent({
        eventName: "setting_notification_toggle",
        payload: { uid: user.uid, value },
      });

      setNotifications(value); // ✅ 1. 로컬 상태 즉시 변경

      if (value) {
        if (!expoPushToken) {
          const newToken = await registerForPushNotificationsAsync();
          if (newToken) {
            const userRef = doc(firestore, "users", user.uid);
            // (이 로직은 토큰 등록이 선행되어야 하므로 await 유지)
            await updateDoc(userRef, {
              allowAlarm: true,
              expoPushToken: newToken,
            });
            Alert.alert("성공", "알림이 활성화되었습니다.");
          } else {
            setNotifications(false); // (권한 실패 시 로컬 상태 롤백)
            Alert.alert(
              "권한 필요",
              "알림 권한을 허용하려면 기기 설정으로 이동하세요.",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "설정으로 이동",
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
        } else {
          updateUserSettings("allowAlarm", true); // ✅ 2. DB 업데이트 (await 없음)
        }
      } else {
        updateUserSettings("allowAlarm", false); // ✅ 2. DB 업데이트 (await 없음)
      }
    },
    [user, expoPushToken, updateUserSettings]
  );

  /** ✅ 마감시간 설정 (useCallback + await 제거) */
  const handleDeadlineChange = useCallback(() => {
    setSelectedHour(parseInt(user?.duetime?.split(":")[0] || "0"));
    setShowTimePicker(true);
  }, [user]);

  const handleTimeConfirm = useCallback(() => {
    const timeString = `${selectedHour.toString().padStart(2, "0")}:00`;
    setDeadlineTime(timeString); // ✅ 1. 로컬 상태 즉시 변경
    updateUserSettings("duetime", timeString); // ✅ 2. DB 업데이트 (await 없음)
    setShowTimePicker(false);
  }, [selectedHour, updateUserSettings]);

  const handleIncreaseHour = useCallback(
    () => setSelectedHour((prev) => (prev >= 23 ? 0 : prev + 1)),
    []
  );
  const handleDecreaseHour = useCallback(
    () => setSelectedHour((prev) => (prev <= 0 ? 23 : prev - 1)),
    []
  );

  /** ✅ 언어 변경 (useCallback) */
  const handleLanguageChange = useCallback(() => {
    Alert.alert("언어 선택", "언어를 선택하세요", [
      {
        text: "한국어",
        onPress: () => {
          setWords("한국어"); // ✅ 1. 로컬 상태 즉시 변경
          updateUserSettings("words", "한국어"); // ✅ 2. DB 업데이트 (await 없음)
        },
      },
      {
        text: "English",
        onPress: () => {
          setWords("English"); // ✅ 1. 로컬 상태 즉시 변경
          updateUserSettings("words", "English"); // ✅ 2. DB 업데이트 (await 없음)
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  }, [updateUserSettings]);

  /** ✅ 비밀번호 변경 (useCallback, 내부 await는 유지) */
  const handlePasswordChange = useCallback(() => {
    setShowPasswordModal(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, []);

  const handlePasswordConfirm = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("오류", "모든 필드를 입력해주세요.");
    }
    if (newPassword.length < 6) {
      return Alert.alert("오류", "새 비밀번호는 최소 6자 이상이어야 합니다.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("오류", "새 비밀번호가 일치하지 않습니다.");
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email) {
        return Alert.alert("오류", "로그인 정보를 찾을 수 없습니다.");
      }

      const credential = auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await currentUser.reauthenticateWithCredential(credential);
      await currentUser.updatePassword(newPassword);

      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await customLogEvent({
        eventName: "profile_password_update_success",
        payload: { uid: user!.uid },
      });

      Alert.alert("성공", "비밀번호가 변경되었습니다.");
    } catch (error: any) {
      console.error("비밀번호 변경 실패:", error);

      await customLogEvent({
        eventName: "profile_password_update_fail",
        payload: { uid: user?.uid, error: error.code },
      });

      if (error.code === "auth/wrong-password") {
        Alert.alert("오류", "현재 비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("오류", "새 비밀번호가 너무 약합니다.");
      } else if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "재로그인 필요",
          "보안을 위해 다시 로그인한 후 시도해주세요."
        );
      } else {
        Alert.alert("오류", "비밀번호 변경에 실패했습니다.");
      }
    }
  }, [user, currentPassword, newPassword, confirmPassword]);

  /** ✅ 회원탈퇴 (useCallback, 내부 await는 유지) */
  const handleDeleteAccount = useCallback(() => {
    setShowDeleteModal(true);
    setDeletePassword("");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletePassword.trim()) {
      return Alert.alert("오류", "비밀번호를 입력해주세요.");
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email || !user?.uid) {
        return Alert.alert("오류", "로그인 정보를 찾을 수 없습니다.");
      }

      const uid = user.uid;

      const credential = auth.EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      );
      await currentUser.reauthenticateWithCredential(credential);

      const userRef = doc(firestore, "users", user.uid);
      await deleteDoc(userRef);

      await currentUser.delete();

      setShowDeleteModal(false);

      await customLogEvent({
        eventName: "profile_account_delete_success",
        payload: { uid: uid },
      });

      Alert.alert("탈퇴 완료", "회원탈퇴가 완료되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]);
    } catch (error: any) {
      console.error("회원탈퇴 실패:", error);

      await customLogEvent({
        eventName: "profile_account_delete_fail",
        payload: { uid: user?.uid, error: error.code },
      });

      if (error.code === "auth/wrong-password") {
        Alert.alert("오류", "비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "재로그인 필요",
          "보안을 위해 다시 로그인한 후 시도해주세요."
        );
      } else {
        Alert.alert("오류", "회원탈퇴에 실패했습니다.");
      }
    }
  }, [user, deletePassword, logout]);

  /** ✅ 로그아웃 (useCallback) */
  const handleLogout = useCallback(() => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await customLogEvent({
            eventName: "profile_logout",
            payload: { uid: user?.uid },
          });

          logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  }, [user, logout]);

  // --- ✅ 차트 설정 핸들러 (useCallback + await 제거) ---

  const handleMovingAverageToggle = useCallback(
    (value: boolean) => {
      setShowMovingAverage(value); // ✅ 1. 로컬 상태 즉시 변경
      updateUserSettings("showMovingAverage", value); // ✅ 2. DB 업데이트 (await 없음)
    },
    [updateUserSettings]
  );

  const handleChartColorSchemeChange = useCallback(
    (value: ChartColorScheme) => {
      setChartColorScheme(value); // ✅ 1. 로컬 상태 즉시 변경
      updateUserSettings("chartColorScheme", value); // ✅ 2. DB 업데이트 (await 없음)
    },
    [updateUserSettings]
  );

  const handleChartLineColorChange = useCallback(
    (value: string) => {
      setChartLineColor(value); // ✅ 1. 로컬 상태 즉시 변경
      updateUserSettings("chartLineColor", value); // ✅ 2. DB 업데이트 (await 없음)
    },
    [updateUserSettings]
  );

  return {
    // States (로컬 상태 반환)
    userName,
    bio,
    darkMode,
    notifications,
    deadlineTime,
    words,
    showMovingAverage,
    chartColorScheme,
    chartLineColor,

    // Modals
    isUploading,
    showNameModal,
    tempName,
    showBioModal,
    tempBio,
    showTimePicker,
    selectedHour,
    showDeleteModal,
    deletePassword,
    showPasswordModal,
    currentPassword,
    newPassword,
    confirmPassword,

    // Setters
    setShowTimePicker,
    setShowNameModal,
    setTempName,
    setShowBioModal,
    setTempBio,
    setShowDeleteModal,
    setDeletePassword,
    setShowPasswordModal,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setSelectedHour,

    // Handlers (모두 useCallback으로 메모이제이션됨)
    handleImagePicker,
    handleNameConfirm,
    handleBioConfirm,
    handleDarkModeToggle,
    handleNotificationToggle,
    handleDeadlineChange,
    handleTimeConfirm,
    handleIncreaseHour,
    handleDecreaseHour,
    handleLanguageChange,
    handlePasswordChange,
    handlePasswordConfirm,
    handleDeleteAccount,
    handleDeleteConfirm,
    handleLogout,
    handleMovingAverageToggle,
    handleChartColorSchemeChange,
    handleChartLineColorChange,
  };
};
