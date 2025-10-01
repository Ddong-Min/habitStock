import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
const Profile: React.FC = () => {
  const [userName, setUserName] = useState("홍길동");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [deadlineTime, setDeadlineTime] = useState("03:00");
  const { logout } = useAuth();
  const handleImagePicker = () => {
    // 이미지 선택 로직
    Alert.alert("프로필 사진", "프로필 사진을 변경하시겠습니까?");
  };

  const handleEditName = () => {
    Alert.alert("이름 변경", "새로운 이름을 입력하세요");
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
            source={{ uri: "https://via.placeholder.com/100" }}
            style={styles.profileImage}
          />
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color={colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Typo fontWeight="bold">{userName}</Typo>
            <TouchableOpacity onPress={handleEditName}>
              <Ionicons name="pencil" size={20} color={colors.blue100} />
            </TouchableOpacity>
          </View>
          <Typo color={colors.neutral400}>나의 주식으로 성장하는 중</Typo>
        </View>
      </View>

      {/* 설정 섹션 */}
      <View style={styles.section}>
        <Typo fontWeight="semibold" style={styles.sectionTitle}>
          일반 설정
        </Typo>

        {/* 다크모드 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon" size={24} color={colors.text} />
            <Typo style={styles.settingText}>다크모드</Typo>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.neutral200, true: colors.blue100 }}
            thumbColor={colors.white}
          />
        </View>

        {/* 알림 설정 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color={colors.text} />
            <Typo style={styles.settingText}>알림</Typo>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.neutral200, true: colors.blue100 }}
            thumbColor={colors.white}
          />
        </View>

        {/* 마감 시간 설정 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="time" size={24} color={colors.text} />
            <Typo style={styles.settingText}>할일 마감 시간</Typo>
          </View>
          <View style={styles.settingRight}>
            <Typo color={colors.neutral400}>{deadlineTime}</Typo>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.neutral400}
            />
          </View>
        </TouchableOpacity>

        {/* 언어 설정 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color={colors.text} />
            <Typo style={styles.settingText}>언어</Typo>
          </View>
          <View style={styles.settingRight}>
            <Typo color={colors.neutral400}>한국어</Typo>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.neutral400}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* 데이터 관리 섹션 */}
      <View style={styles.section}>
        <Typo fontWeight="semibold" style={styles.sectionTitle}>
          데이터 관리
        </Typo>

        {/* 데이터 백업 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="cloud-upload" size={24} color={colors.text} />
            <Typo style={styles.settingText}>데이터 백업</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* 데이터 복원 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="cloud-download" size={24} color={colors.text} />
            <Typo style={styles.settingText}>데이터 복원</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* 데이터 초기화 */}
        <TouchableOpacity style={styles.settingItem} onPress={handleResetData}>
          <View style={styles.settingLeft}>
            <Ionicons name="refresh" size={24} color={colors.red100} />
            <Typo color={colors.red100} style={styles.settingText}>
              데이터 초기화
            </Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>
      </View>

      {/* 소셜 섹션 */}
      <View style={styles.section}>
        <Typo fontWeight="semibold" style={styles.sectionTitle}>
          소셜
        </Typo>

        {/* 친구 관리 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="people" size={24} color={colors.text} />
            <Typo style={styles.settingText}>친구 관리</Typo>
          </View>
          <View style={styles.settingRight}>
            <Typo color={colors.neutral400}>12명</Typo>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.neutral400}
            />
          </View>
        </TouchableOpacity>

        {/* 차단 목록 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="ban" size={24} color={colors.text} />
            <Typo style={styles.settingText}>차단 목록</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>
      </View>

      {/* 정보 섹션 */}
      <View style={styles.section}>
        <Typo fontWeight="semibold" style={styles.sectionTitle}>
          정보
        </Typo>

        {/* 공지사항 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="megaphone" size={24} color={colors.text} />
            <Typo style={styles.settingText}>공지사항</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* FAQ */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle" size={24} color={colors.text} />
            <Typo style={styles.settingText}>자주 묻는 질문</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* 문의하기 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="mail" size={24} color={colors.text} />
            <Typo style={styles.settingText}>문의하기</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* 앱 버전 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle" size={24} color={colors.text} />
            <Typo fontWeight="regular" style={styles.settingText}>
              앱 버전
            </Typo>
          </View>
          <Typo fontWeight="regular" color={colors.neutral400}>
            1.0.0
          </Typo>
        </View>

        {/* 이용약관 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="document-text" size={24} color={colors.text} />
            <Typo style={styles.settingText}>이용약관</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* 개인정보처리방침 */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="shield-checkmark" size={24} color={colors.text} />
            <Typo style={styles.settingText}>개인정보처리방침</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>
      </View>

      {/* 계정 관리 섹션 */}
      <View style={styles.section}>
        <Typo fontWeight="semibold" style={styles.sectionTitle}>
          계정 관리
        </Typo>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out" size={24} color={colors.text} />
            <Typo style={styles.settingText}>로그아웃</Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>

        {/* 회원탈퇴 */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteAccount}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person-remove" size={24} color={colors.red100} />
            <Typo color={colors.red100} style={styles.settingText}>
              회원탈퇴
            </Typo>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral400}
          />
        </TouchableOpacity>
      </View>

      {/* 하단 여백 */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacingX._25,
    paddingTop: spacingY._30,
    paddingBottom: spacingY._25,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral200,
  },
  cameraIconContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: colors.blue100,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacingX._20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    marginBottom: spacingY._5,
  },
  section: {
    marginTop: spacingY._20,
    paddingHorizontal: spacingX._25,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
    color: colors.neutral400,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: spacingX._15,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  bottomSpacing: {
    height: spacingY._30,
  },
});

export default Profile;
