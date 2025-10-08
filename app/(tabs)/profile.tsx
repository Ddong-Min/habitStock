import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  TextInput,
  StyleSheet,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { colors } from "@/constants/theme";

const Profile: React.FC = () => {
  const { logout, user, updateUserData } = useAuth();
  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text>로그인 정보가 없습니다.</Text>
      </View>
    );
  }

  const [userName, setUserName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [darkMode, setDarkMode] = useState(user?.isDarkMode || false);
  const [notifications, setNotifications] = useState(user?.allowAlarm || false);
  const [deadlineTime, setDeadlineTime] = useState(user?.duetime || "00:00");
  const [words, setWords] = useState(user?.words || "한국어");

  // Firebase에 설정 저장하는 공통 함수
  const updateUserSettings = async (field: string, value: any) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        [field]: value,
      });

      // 로컬 user 상태도 업데이트
      await updateUserData(user.uid);
      console.log(`✅ ${field} 업데이트 완료:`, value);
    } catch (error) {
      console.error(`❌ ${field} 업데이트 실패:`, error);
      Alert.alert("오류", "설정을 저장하는데 실패했습니다.");
    }
  };

  const handleImagePicker = () => {
    Alert.alert("프로필 사진", "프로필 사진을 변경하시겠습니까?");
  };

  const handleEditName = () => {
    Alert.prompt(
      "이름 변경",
      "새로운 이름을 입력하세요",
      [
        { text: "취소", style: "cancel" },
        {
          text: "변경",
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              setUserName(newName);
              await updateUserSettings("name", newName);
            }
          },
        },
      ],
      "plain-text",
      userName
    );
  };

  const handleEditBio = () => {
    Alert.prompt(
      "소개 변경",
      "새로운 소개를 입력하세요 (최대 150자)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "변경",
          onPress: async (newBio) => {
            if (newBio !== null) {
              const trimmedBio = newBio!.substring(0, 150);
              setBio(trimmedBio);
              await updateUserSettings("bio", trimmedBio);
            }
          },
        },
      ],
      "plain-text",
      bio
    );
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

  // 마감시간 변경
  const handleDeadlineChange = () => {
    Alert.prompt(
      "마감 시간 설정",
      "시간을 입력하세요 (예: 23:59)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "변경",
          onPress: async (newTime) => {
            if (newTime) {
              setDeadlineTime(newTime);
              await updateUserSettings("duetime", newTime);
            }
          },
        },
      ],
      "plain-text",
      deadlineTime
    );
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
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleImagePicker}
        >
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/100" }}
            style={styles.profileImage}
          />
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{userName}</Text>
            <TouchableOpacity onPress={handleEditName}>
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleEditBio}>
            <Text style={styles.bioText}>{bio || "소개를 입력하세요"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 설정 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>일반 설정</Text>

        {/* 다크모드 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon" size={24} color="#000" />
            <Text style={styles.settingText}>다크모드</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: "#E5E5EA", true: "#007AFF" }}
            thumbColor="#fff"
          />
        </View>

        {/* 알림 설정 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color="#000" />
            <Text style={styles.settingText}>알림</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: "#E5E5EA", true: "#007AFF" }}
            thumbColor="#fff"
          />
        </View>

        {/* 마감 시간 설정 */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeadlineChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="time" size={24} color="#000" />
            <Text style={styles.settingText}>할일 마감 시간</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{deadlineTime}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        {/* 언어 설정 */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleLanguageChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color="#000" />
            <Text style={styles.settingText}>언어</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{words}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 계정 관리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정 관리</Text>

        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out" size={24} color="#FF3B30" />
            <Text style={[styles.settingText, { color: "#FF3B30" }]}>
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
            <Ionicons name="trash" size={24} color="#FF3B30" />
            <Text style={[styles.settingText, { color: "#FF3B30" }]}>
              회원탈퇴
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
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
    color: "#999",
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
    color: "#999",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});

export default Profile;
