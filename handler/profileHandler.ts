import { useState } from "react";
import { Alert, Linking } from "react-native";
import storage from "@react-native-firebase/storage";
import { firestore } from "@/config/firebase";
import { doc, updateDoc } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import { router } from "expo-router";
import { useAuth } from "../contexts/authContext";
import { useNotification } from "../contexts/notificationContext";

// ✅ Firestore Modular API 사용

export const useProfileHandlers = () => {
  const { user, logout } = useAuth();
  const { expoPushToken } = useNotification();

  const [userName, setUserName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [darkMode, setDarkMode] = useState(user?.isDarkMode || false);
  const [notifications, setNotifications] = useState(user?.allowAlarm || false);
  const [deadlineTime, setDeadlineTime] = useState(user?.duetime || "24:00");
  const [words, setWords] = useState(user?.words || "한국어");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(24);
  const [isUploading, setIsUploading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [showBioModal, setShowBioModal] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  /** ✅ Firestore 유저 데이터 업데이트 */
  const updateUserSettings = async (field: string, value: any) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { [field]: value });
      console.log(`✅ ${field} 업데이트 완료:`, value);
    } catch (error) {
      console.error(`❌ ${field} 업데이트 실패:`, error);
      Alert.alert("오류", "설정을 저장하는데 실패했습니다.");
    }
  };

  /** ✅ Firebase Storage 업로드 */
  const uploadImageToFirebase = async (uri: string) => {
    try {
      if (!user) throw new Error("User not logged in.");
      const filename = `profile_${user.uid}_${Date.now()}.jpg`;
      const refPath = storage().ref(`profiles/${filename}`);

      await refPath.putFile(uri);
      const downloadURL = await refPath.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw error;
    }
  };

  const uploadAndUpdateImage = async (uri: string) => {
    try {
      setIsUploading(true);
      const imageUrl = await uploadImageToFirebase(uri);
      await updateUserSettings("image", imageUrl);
      setIsUploading(false);
      Alert.alert("성공", "프로필 사진이 변경되었습니다.");
    } catch (error) {
      setIsUploading(false);
      Alert.alert("오류", "이미지 업로드에 실패했습니다.");
    }
  };

  /** ✅ 카메라 촬영 */
  const handleCamera = async () => {
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
  };

  /** ✅ 갤러리 선택 */
  const handleGallery = async () => {
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
  };

  const handleImagePicker = () => {
    Alert.alert("프로필 사진 변경", "사진을 어떻게 선택하시겠습니까?", [
      { text: "카메라로 촬영", onPress: handleCamera },
      { text: "갤러리에서 선택", onPress: handleGallery },
      { text: "취소", style: "cancel" },
    ]);
  };

  /** ✅ 이름 변경 */
  const handleNameConfirm = async () => {
    if (!tempName.trim()) return Alert.alert("오류", "이름을 입력해주세요.");
    setUserName(tempName);
    await updateUserSettings("name", tempName);
    setShowNameModal(false);
    Alert.alert("성공", "이름이 변경되었습니다.");
  };

  /** ✅ 한 줄 소개 변경 */
  const handleBioConfirm = async () => {
    const trimmedBio = tempBio.substring(0, 150);
    setBio(trimmedBio);
    await updateUserSettings("bio", trimmedBio);
    setShowBioModal(false);
    Alert.alert("성공", "소개가 변경되었습니다.");
  };

  /** ✅ 다크 모드 토글 */
  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    await updateUserSettings("isDarkMode", value);
  };

  /** ✅ 알림 설정 토글 */
  const handleNotificationToggle = async (value: boolean) => {
    if (!user?.uid) return;
    if (value) {
      if (!expoPushToken) {
        const newToken = await registerForPushNotificationsAsync();
        if (newToken) {
          const userRef = doc(firestore, "users", user.uid);
          await updateDoc(userRef, {
            allowAlarm: true,
            expoPushToken: newToken,
          });
          setNotifications(true);
          Alert.alert("성공", "알림이 활성화되었습니다.");
        } else {
          Alert.alert(
            "권한 필요",
            "알림 권한을 허용하려면 기기 설정으로 이동하세요.",
            [
              { text: "취소", style: "cancel" },
              { text: "설정으로 이동", onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        setNotifications(true);
        await updateUserSettings("allowAlarm", true);
      }
    } else {
      setNotifications(false);
      await updateUserSettings("allowAlarm", false);
    }
  };

  /** ✅ 마감시간 설정 */
  const handleDeadlineChange = () => {
    const hour = parseInt(deadlineTime.split(":")[0]);
    setSelectedHour(hour);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = async () => {
    const timeString = `${selectedHour.toString().padStart(2, "0")}:00`;
    setDeadlineTime(timeString);
    await updateUserSettings("duetime", timeString);
    setShowTimePicker(false);
  };

  const handleIncreaseHour = () =>
    setSelectedHour((prev) => (prev === 24 ? 0 : prev + 1));
  const handleDecreaseHour = () =>
    setSelectedHour((prev) => (prev === 0 ? 24 : prev - 1));

  /** ✅ 언어 변경 */
  const handleLanguageChange = () => {
    Alert.alert("언어 선택", "언어를 선택하세요", [
      { text: "한국어", onPress: () => updateUserSettings("words", "한국어") },
      {
        text: "English",
        onPress: () => updateUserSettings("words", "English"),
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  /** ✅ 로그아웃 */
  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  return {
    // States
    userName,
    bio,
    darkMode,
    notifications,
    deadlineTime,
    words,
    showTimePicker,
    selectedHour,
    isUploading,
    showNameModal,
    tempName,
    showBioModal,
    tempBio,
    showDeleteModal,
    deletePassword,
    // Setters
    setShowTimePicker,
    setShowNameModal,
    setTempName,
    setShowBioModal,
    setTempBio,
    // Handlers
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
    handleLogout,
  };
};
