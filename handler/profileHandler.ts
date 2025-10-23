import { useState } from "react";
import { Alert, Linking } from "react-native";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { firestore, auth } from "../config/firebase";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import { router } from "expo-router";
import { useAuth } from "../contexts/authContext";
import { useNotification } from "../contexts/notificationContext";

export const useProfileHandlers = () => {
  const { user, updateUserData, logout } = useAuth();
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

  // user의 prop을 수정할때 사용하는 함수
  const updateUserSettings = async (field: string, value: any) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { [field]: value });
      await updateUserData(user.uid);
      console.log(`✅ ${field} 업데이트 완료:`, value);
    } catch (error) {
      console.error(`❌ ${field} 업데이트 실패:`, error);
      Alert.alert("오류", "설정을 저장하는데 실패했습니다.");
    }
  };

  // Firebase에 이미지 업로드
  const uploadImageToFirebase = async (uri: string) => {
    try {
      if (!user) throw new Error("User not logged in.");
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const filename = `profile_${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profiles/${filename}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw error;
    }
  };

  // 이미지 업로드 및 업데이트 공통 로직
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
      console.error(error);
    }
  };

  // 카메라로 촬영
  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndUpdateImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("오류", "사진 촬영에 실패했습니다.");
      console.error(error);
    }
  };

  // 갤러리에서 선택
  const handleGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "사진 라이브러리 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndUpdateImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("오류", "이미지 선택에 실패했습니다.");
      console.error(error);
    }
  };

  // 이미지 선택 방법 선택
  const handleImagePicker = () => {
    const options = [
      { text: "카메라로 촬영", onPress: () => handleCamera() },
      { text: "갤러리에서 선택", onPress: () => handleGallery() },
      { text: "취소", style: "cancel" as const },
    ];
    Alert.alert("프로필 사진 변경", "사진을 어떻게 선택하시겠습니까?", options);
  };

  //이름 설정 알람창
  const handleNameConfirm = async () => {
    if (!tempName.trim()) {
      Alert.alert("오류", "이름을 입력해주세요.");
      return;
    }
    setUserName(tempName);
    await updateUserSettings("name", tempName);
    setShowNameModal(false);
    Alert.alert("성공", "이름이 변경되었습니다.");
  };

  //한줄소개 알람창
  const handleBioConfirm = async () => {
    const trimmedBio = tempBio.substring(0, 150);
    setBio(trimmedBio);
    await updateUserSettings("bio", trimmedBio);
    setShowBioModal(false);
    Alert.alert("성공", "소개가 변경되었습니다.");
  };

  //다크모드 화이트 모드 관리
  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    await updateUserSettings("isDarkMode", value);
  };

  //알림 설정 관리
  const handleNotificationToggle = async (value: boolean) => {
    if (value === true) {
      if (!expoPushToken) {
        const newPushToken = await registerForPushNotificationsAsync();
        if (newPushToken) {
          setNotifications(true);
          const userRef = doc(firestore, "users", user!.uid);
          await updateDoc(userRef, {
            allowAlarm: true,
            expoPushToken: newPushToken,
          });
          await updateUserData(user!.uid);
          Alert.alert("성공", "알림 설정이 켜졌습니다.");
        } else {
          Alert.alert(
            "알림을 켤 수 없음",
            "알림을 받으려면 기기의 설정 메뉴에서 알림 권한을 직접 허용해주셔야 합니다.",
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

  //마감 시간 변경 화면 키기
  const handleDeadlineChange = () => {
    const hour = parseInt(deadlineTime.split(":")[0]);
    setSelectedHour(hour);
    setShowTimePicker(true);
  };

  //마감 시간 변경 확정
  const handleTimeConfirm = async () => {
    const timeString = `${selectedHour.toString().padStart(2, "0")}:00`;
    setDeadlineTime(timeString);
    await updateUserSettings("duetime", timeString);
    setShowTimePicker(false);
  };

  //마감 시간 시간 올리기
  const handleIncreaseHour = () => {
    setSelectedHour((prev) => (prev === 24 ? 0 : prev + 1));
  };

  //마감 시간 시간 내리기
  const handleDecreaseHour = () => {
    setSelectedHour((prev) => (prev === 0 ? 24 : prev - 1));
  };

  //언어 변경
  const handleLanguageChange = () => {
    const languages = [
      { text: "한국어", value: "한국어" },
      { text: "English", value: "English" },
    ];

    const alertButtons = [];
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i];
      alertButtons.push({
        text: lang.text,
        onPress: async () => {
          setWords(lang.value);
          await updateUserSettings("words", lang.value);
        },
      });
    }
    alertButtons.push({ text: "취소", style: "cancel" as const });

    Alert.alert("언어 선택", "언어를 선택하세요", alertButtons);
  };

  //로그아웃
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

  //회원 탈퇴 - 비밀번호 확인 모달 열기
  const handleDeleteAccount = () => {
    setDeletePassword("");
    setShowDeleteModal(true);
  };

  //회원 탈퇴 확정
  const handleDeleteConfirm = async () => {
    if (!deletePassword.trim()) {
      Alert.alert("오류", "비밀번호를 입력해주세요.");
      return;
    }

    try {
      if (!user?.email) {
        Alert.alert("오류", "사용자 정보를 찾을 수 없습니다.");
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("오류", "로그인 상태를 확인할 수 없습니다.");
        return;
      }

      // 비밀번호로 재인증
      await signInWithEmailAndPassword(auth, user.email, deletePassword);

      const {
        collection,
        getDocs,
        deleteDoc,
        doc: firestoreDoc,
        getDoc,
      } = await import("firebase/firestore");

      // 1. 내가 팔로잉한 사람들 가져오기
      const followingRef = collection(
        firestore,
        "following",
        user.uid,
        "userFollowing"
      );
      const followingSnapshot = await getDocs(followingRef);

      // 1-1. 내가 팔로잉한 사람들의 팔로워 목록에서 나를 삭제
      for (let i = 0; i < followingSnapshot.docs.length; i++) {
        const followingUserId = followingSnapshot.docs[i].id;

        // 상대방의 followers 서브컬렉션에서 나를 삭제
        const followerDocRef = firestoreDoc(
          firestore,
          "followers",
          followingUserId,
          "userFollowers",
          user.uid
        );
        await deleteDoc(followerDocRef);

        // 내 following 문서 삭제
        await deleteDoc(followingSnapshot.docs[i].ref);
      }

      // 2. 나를 팔로우한 사람들 가져오기
      const followersRef = collection(
        firestore,
        "followers",
        user.uid,
        "userFollowers"
      );
      const followersSnapshot = await getDocs(followersRef);

      // 2-1. 나를 팔로우한 사람들의 팔로잉 목록에서 나를 삭제
      for (let i = 0; i < followersSnapshot.docs.length; i++) {
        const followerUserId = followersSnapshot.docs[i].id;

        // 상대방의 following 서브컬렉션에서 나를 삭제
        const followingDocRef = firestoreDoc(
          firestore,
          "following",
          followerUserId,
          "userFollowing",
          user.uid
        );
        await deleteDoc(followingDocRef);

        // 내 follower 문서 삭제
        await deleteDoc(followersSnapshot.docs[i].ref);
      }

      // 3. following 컬렉션의 내 문서 삭제
      const myFollowingDocRef = firestoreDoc(firestore, "following", user.uid);
      const myFollowingDoc = await getDoc(myFollowingDocRef);
      if (myFollowingDoc.exists()) {
        await deleteDoc(myFollowingDocRef);
      }

      // 4. followers 컬렉션의 내 문서 삭제
      const myFollowersDocRef = firestoreDoc(firestore, "followers", user.uid);
      const myFollowersDoc = await getDoc(myFollowersDocRef);
      if (myFollowersDoc.exists()) {
        await deleteDoc(myFollowersDocRef);
      }

      // 5. 사용자가 작성한 게시물 삭제 (선택사항)
      const { query, where } = await import("firebase/firestore");
      const postsQuery = query(
        collection(firestore, "posts"),
        where("userId", "==", user.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);
      for (let i = 0; i < postsSnapshot.docs.length; i++) {
        await deleteDoc(postsSnapshot.docs[i].ref);
      }

      // 6. 사용자가 작성한 댓글 삭제 (선택사항)
      const commentsQuery = query(
        collection(firestore, "comments"),
        where("userId", "==", user.uid)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      for (let i = 0; i < commentsSnapshot.docs.length; i++) {
        await deleteDoc(commentsSnapshot.docs[i].ref);
      }

      // 7. 사용자의 할일(todos) 삭제 (선택사항)
      const todosQuery = query(
        collection(firestore, "todos"),
        where("userId", "==", user.uid)
      );
      const todosSnapshot = await getDocs(todosQuery);
      for (let i = 0; i < todosSnapshot.docs.length; i++) {
        await deleteDoc(todosSnapshot.docs[i].ref);
      }

      // 8. Firebase Storage에서 프로필 이미지 삭제 (선택사항)
      const userDocRef = firestoreDoc(firestore, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userData = userDocSnapshot.data();

      if (userData?.image) {
        try {
          const { deleteObject } = await import("firebase/storage");
          const storage = getStorage();
          const imageRef = ref(storage, userData.image);
          await deleteObject(imageRef);
        } catch (error) {
          console.log("프로필 이미지 삭제 실패 (파일이 없을 수 있음):", error);
        }
      }

      // 9. Firestore users 컬렉션에서 사용자 문서 삭제
      await deleteDoc(userDocRef);

      // 10. Firebase Authentication 계정 삭제
      await deleteUser(currentUser);

      setShowDeleteModal(false);
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

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert(
          "오류",
          "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요."
        );
      } else {
        Alert.alert("오류", "회원탈퇴에 실패했습니다. 다시 시도해주세요.");
      }
    }
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
    user,
    // Setters
    setUserName,
    setBio,
    setShowTimePicker,
    setShowNameModal,
    setTempName,
    setShowBioModal,
    setTempBio,
    setShowDeleteModal,
    setDeletePassword,
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
    handleDeleteAccount,
    handleDeleteConfirm,
  };
};
