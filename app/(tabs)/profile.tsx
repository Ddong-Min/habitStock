import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  StyleSheet,
  Text,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { useTheme } from "@/contexts/themeContext";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Profile: React.FC = () => {
  const { theme } = useTheme();
  const { logout, user, updateUserData } = useAuth();

  if (!user) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={{ color: theme.text }}>로그인 정보가 없습니다.</Text>
      </View>
    );
  }

  const [userName, setUserName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [darkMode, setDarkMode] = useState(user?.isDarkMode || false);
  const [notifications, setNotifications] = useState(user?.allowAlarm || false);
  const [deadlineTime, setDeadlineTime] = useState(user?.duetime || "24:00");
  const [words, setWords] = useState(user?.words || "한국어");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(24);
  const [isUploading, setIsUploading] = useState(false);

  // 이름 수정 모달
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // 소개 수정 모달
  const [showBioModal, setShowBioModal] = useState(false);
  const [tempBio, setTempBio] = useState(bio);

  // Firebase에 설정 저장하는 공통 함수
  const updateUserSettings = async (field: string, value: any) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        [field]: value,
      });

      await updateUserData(user.uid);
      console.log(`✅ ${field} 업데이트 완료:`, value);
    } catch (error) {
      console.error(`❌ ${field} 업데이트 실패:`, error);
      Alert.alert("오류", "설정을 저장하는데 실패했습니다.");
    }
  };

  // 이미지 업로드 함수
  const uploadImageToFirebase = async (uri: string) => {
    try {
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

  // 이미지 선택 및 업로드
  const handleImagePicker = async () => {
    try {
      // 권한 요청
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("권한 필요", "사진 라이브러리 접근 권한이 필요합니다.");
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);

        // Firebase Storage에 업로드
        const imageUrl = await uploadImageToFirebase(result.assets[0].uri);

        // Firestore에 URL 저장
        await updateUserSettings("image", imageUrl);

        setIsUploading(false);
        Alert.alert("성공", "프로필 사진이 변경되었습니다.");
      }
    } catch (error) {
      setIsUploading(false);
      Alert.alert("오류", "이미지 업로드에 실패했습니다.");
      console.error(error);
    }
  };

  // 이름 변경 확인
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

  // 소개 변경 확인
  const handleBioConfirm = async () => {
    const trimmedBio = tempBio.substring(0, 150);
    setBio(trimmedBio);
    await updateUserSettings("bio", trimmedBio);
    setShowBioModal(false);
    Alert.alert("성공", "소개가 변경되었습니다.");
  };

  // 다크모드 토글
  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    await updateUserSettings("isDarkMode", value);
  };

  // 알림 토글
  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    await updateUserSettings("allowAlarm", value);
  };

  // 마감시간 변경 - 모달 열기
  const handleDeadlineChange = () => {
    const hour = parseInt(deadlineTime.split(":")[0]);
    setSelectedHour(hour);
    setShowTimePicker(true);
  };

  // 시간 선택 확인
  const handleTimeConfirm = async () => {
    const timeString = `${selectedHour.toString().padStart(2, "0")}:00`;
    setDeadlineTime(timeString);
    await updateUserSettings("duetime", timeString);
    setShowTimePicker(false);
  };

  // 시간 증가
  const handleIncreaseHour = () => {
    setSelectedHour((prev) => (prev === 24 ? 0 : prev + 1));
  };

  // 시간 감소
  const handleDecreaseHour = () => {
    setSelectedHour((prev) => (prev === 0 ? 24 : prev - 1));
  };

  // 언어 변경
  const handleLanguageChange = () => {
    Alert.alert("언어 선택", "언어를 선택하세요", [
      {
        text: "한국어",
        onPress: async () => {
          setWords("한국어");
          await updateUserSettings("words", "한국어");
        },
      },
      {
        text: "English",
        onPress: async () => {
          setWords("English");
          await updateUserSettings("words", "English");
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원탈퇴",
      "모든 데이터가 삭제됩니다. 정말 탈퇴하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "탈퇴", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      "데이터 초기화",
      "모든 할일과 주가 기록이 삭제됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "초기화", style: "destructive", onPress: () => {} },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* 프로필 헤더 */}
      <View style={[styles.header, { borderBottomColor: theme.neutral200 }]}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleImagePicker}
          disabled={isUploading}
        >
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/100" }}
            style={styles.profileImage}
          />
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          <View
            style={[
              styles.cameraIconContainer,
              {
                backgroundColor: theme.blue100,
                borderColor: theme.cardBackground,
              },
            ]}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.nameText, { color: theme.text }]}>
              {userName}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setTempName(userName);
                setShowNameModal(true);
              }}
            >
              <Ionicons name="pencil" size={20} color={theme.blue100} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              setTempBio(bio);
              setShowBioModal(true);
            }}
          >
            <Text style={[styles.bioText, { color: theme.textLight }]}>
              {bio || "소개를 입력하세요"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 설정 섹션 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          일반 설정
        </Text>

        {/* 다크모드 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon" size={24} color={theme.text} />
            <Text style={[styles.settingText, { color: theme.text }]}>
              다크모드
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: theme.neutral300, true: theme.blue100 }}
            thumbColor="#fff"
          />
        </View>

        {/* 알림 설정 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color={theme.text} />
            <Text style={[styles.settingText, { color: theme.text }]}>
              알림
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: theme.neutral300, true: theme.blue100 }}
            thumbColor="#fff"
          />
        </View>

        {/* 마감 시간 설정 */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeadlineChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="time" size={24} color={theme.text} />
            <Text style={[styles.settingText, { color: theme.text }]}>
              할일 마감 시간
            </Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: theme.textLight }]}>
              {deadlineTime}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textLight}
            />
          </View>
        </TouchableOpacity>

        {/* 언어 설정 */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleLanguageChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color={theme.text} />
            <Text style={[styles.settingText, { color: theme.text }]}>
              언어
            </Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: theme.textLight }]}>
              {words}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textLight}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* 계정 관리 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          계정 관리
        </Text>

        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out" size={24} color={theme.red100} />
            <Text style={[styles.settingText, { color: theme.red100 }]}>
              로그아웃
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetData}>
          <View style={styles.settingLeft}>
            <Ionicons name="refresh" size={24} color="#FF9500" />
            <Text style={[styles.settingText, { color: "#FF9500" }]}>
              데이터 초기화
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteAccount}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash" size={24} color={theme.red100} />
            <Text style={[styles.settingText, { color: theme.red100 }]}>
              회원탈퇴
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 이름 변경 모달 */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              이름 변경
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.neutral200,
                },
              ]}
              value={tempName}
              onChangeText={setTempName}
              placeholder="새로운 이름을 입력하세요"
              placeholderTextColor={theme.textLight}
              maxLength={30}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  취소
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleNameConfirm}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  확인
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 소개 변경 모달 */}
      <Modal
        visible={showBioModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBioModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              소개 변경
            </Text>

            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.neutral200,
                },
              ]}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder="소개를 입력하세요 (최대 150자)"
              placeholderTextColor={theme.textLight}
              multiline
              maxLength={150}
              numberOfLines={4}
            />

            <Text style={[styles.charCount, { color: theme.textLight }]}>
              {tempBio.length}/150
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => setShowBioModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  취소
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleBioConfirm}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  확인
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 시간 선택 모달 */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              마감 시간 설정
            </Text>

            <View style={styles.clockContainer}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleIncreaseHour}
              >
                <Ionicons name="chevron-up" size={40} color={theme.blue100} />
              </TouchableOpacity>

              <View
                style={[
                  styles.timeDisplay,
                  { backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.timeText, { color: theme.text }]}>
                  {selectedHour.toString().padStart(2, "0")}:00
                </Text>
              </View>

              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleDecreaseHour}
              >
                <Ionicons name="chevron-down" size={40} color={theme.blue100} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  취소
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleTimeConfirm}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  확인
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadingOverlay: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bioText: {
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  textArea: {
    width: "100%",
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  charCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    marginBottom: 16,
  },
  clockContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  arrowButton: {
    padding: 8,
  },
  timeDisplay: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginVertical: 16,
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Profile;
