import React from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { useTheme } from "@/contexts/themeContext";
// ✅ Typo 및 spacing, radius 임포트
import { spacingY, colors, spacingX, radius, Theme } from "@/constants/theme";
import { useProfileHandlers } from "@/handler/profileHandler";
import { useNotification } from "@/contexts/notificationContext";
import Typo from "@/components/Typo"; // ✅ Typo 컴포넌트 임포트

// ✅ 색상 버튼 컴포넌트 (라인 차트용)
const ColorButton = ({
  color,
  isSelected,
  onPress,
}: {
  color: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.colorButton,
      { backgroundColor: color },
      isSelected && styles.colorButtonSelected,
    ]}
  />
);

const Profile: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { expoPushToken } = useNotification();

  const {
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
    setShowNameModal,
    setTempName,
    setShowBioModal,
    setTempBio,
    setShowTimePicker,
    setShowDeleteModal,
    setDeletePassword,
    setShowPasswordModal,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
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
  } = useProfileHandlers();

  // (라인 색상은 theme에 없으므로 하드코딩 유지)
  const lineColors = ["#6A8BFF", "#8B5CF6", "#F59E0B", "#10B981"];

  if (!user) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        {/* ✅ Text -> Typo */}
        <Typo color={theme.text}>로그인 정보가 없습니다.</Typo>
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* --- 프로필 헤더 --- */}
      <View style={[styles.header, { borderBottomColor: theme.neutral200 }]}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleImagePicker}
          disabled={isUploading}
        >
          <Image
            source={{ uri: user.image || "https://via.placeholder.com/100" }}
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
            {/* ✅ Text -> Typo */}
            <Typo
              size={18}
              fontWeight="bold"
              color={theme.text}
              style={styles.nameText}
            >
              {user.name}
            </Typo>
            <TouchableOpacity
              onPress={() => {
                setTempName(user.name || "");
                setShowNameModal(true);
              }}
            >
              <Ionicons name="pencil" size={20} color={theme.blue100} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              setTempBio(user.bio || "");
              setShowBioModal(true);
            }}
          >
            {/* ✅ Text -> Typo */}
            <Typo size={14} color={theme.textLight} numberOfLines={1}>
              {user.bio || "소개를 입력하세요"}
            </Typo>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- 일반 설정 --- */}
      <View style={styles.section}>
        {/* ✅ Text -> Typo */}
        <Typo
          size={16}
          fontWeight="600"
          color={theme.text}
          style={styles.sectionTitle}
        >
          일반 설정
        </Typo>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              다크모드
            </Typo>
          </View>
          <Switch
            value={user.isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: theme.neutral300, true: theme.blue100 }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              알림
            </Typo>
          </View>
          <Switch
            value={user.allowAlarm}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: theme.neutral300, true: theme.blue100 }}
            thumbColor="#fff"
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeadlineChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="time" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              할일 마감 시간
            </Typo>
          </View>
          <View style={styles.settingRight}>
            {/* ✅ Text -> Typo */}
            <Typo size={14} color={theme.textLight}>
              {user.duetime}
            </Typo>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textLight}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleLanguageChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              언어
            </Typo>
          </View>
          <View style={styles.settingRight}>
            {/* ✅ Text -> Typo */}
            <Typo size={14} color={theme.textLight}>
              {user.words}
            </Typo>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textLight}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* --- ✅ 차트 설정 --- */}
      <View style={styles.section}>
        {/* ✅ Text -> Typo */}
        <Typo
          size={16}
          fontWeight="600"
          color={theme.text}
          style={styles.sectionTitle}
        >
          차트 설정
        </Typo>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="pulse" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              이동평균선 표시
            </Typo>
          </View>
          <Switch
            value={user.showMovingAverage}
            onValueChange={handleMovingAverageToggle}
            trackColor={{ false: theme.neutral300, true: theme.blue100 }}
            thumbColor="#fff"
          />
        </View>

        {/* 2. 상승/하락 색상 */}
        <View style={styles.settingItemColumn}>
          <View style={styles.settingLeft}>
            <Ionicons name="color-palette" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              차트 색상 테마
            </Typo>
          </View>

          <View style={styles.colorSchemePicker}>
            {/* 옵션 1: 한국식 (빨강 상승, 파랑 하락) */}
            <TouchableOpacity
              style={[
                styles.colorSchemeButton,
                { backgroundColor: theme.neutral100 },
                user.chartColorScheme === "red-up" && [
                  styles.colorSchemeButtonActive,
                  { borderColor: theme.blue100 },
                ],
              ]}
              onPress={() => handleChartColorSchemeChange("red-up")}
            >
              {/* ✅ Text -> Typo */}
              <Typo
                size={16}
                fontWeight="600"
                color={theme.text}
                style={styles.colorSchemeTitle}
              >
                한국식
              </Typo>
              <View style={styles.colorSwatchRow}>
                {/* 상승 */}
                <View style={styles.colorSwatchLabelContainer}>
                  {/* ✅ Text -> Typo */}
                  <Typo size={12} color={theme.textLight}>
                    상승
                  </Typo>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: theme.red100 },
                    ]}
                  />
                </View>
                {/* 하락 */}
                <View style={styles.colorSwatchLabelContainer}>
                  {/* ✅ Text -> Typo */}
                  <Typo size={12} color={theme.textLight}>
                    하락
                  </Typo>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: theme.blue100 },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* 옵션 2: 글로벌 (초록 상승, 빨강 하락) */}
            <TouchableOpacity
              style={[
                styles.colorSchemeButton,
                { backgroundColor: theme.neutral100 },
                user.chartColorScheme === "green-up" && [
                  styles.colorSchemeButtonActive,
                  { borderColor: theme.blue100 },
                ],
              ]}
              onPress={() => handleChartColorSchemeChange("green-up")}
            >
              {/* ✅ Text -> Typo */}
              <Typo
                size={16}
                fontWeight="600"
                color={theme.text}
                style={styles.colorSchemeTitle}
              >
                글로벌
              </Typo>
              <View style={styles.colorSwatchRow}>
                {/* 상승 */}
                <View style={styles.colorSwatchLabelContainer}>
                  {/* ✅ Text -> Typo */}
                  <Typo size={12} color={theme.textLight}>
                    상승
                  </Typo>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: theme.green100 },
                    ]}
                  />
                </View>
                {/* 하락 */}
                <View style={styles.colorSwatchLabelContainer}>
                  {/* ✅ Text -> Typo */}
                  <Typo size={12} color={theme.textLight}>
                    하락
                  </Typo>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: theme.red100 },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 라인 차트 색상 */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="analytics" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              차트 라인 색상
            </Typo>
          </View>
          <View style={styles.colorPicker}>
            {lineColors.map((color) => (
              <ColorButton
                key={color}
                color={color}
                isSelected={user.chartLineColor === color}
                onPress={() => handleChartLineColorChange(color)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* --- 계정 관리 --- */}
      <View style={styles.section}>
        {/* ✅ Text -> Typo */}
        <Typo
          size={16}
          fontWeight="600"
          color={theme.text}
          style={styles.sectionTitle}
        >
          계정 관리
        </Typo>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handlePasswordChange}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="lock-closed" size={24} color={theme.text} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.text} style={styles.settingText}>
              비밀번호 변경
            </Typo>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out" size={24} color={theme.red100} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.red100} style={styles.settingText}>
              로그아웃
            </Typo>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteAccount}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash" size={24} color={theme.red100} />
            {/* ✅ Text -> Typo */}
            <Typo size={16} color={theme.red100} style={styles.settingText}>
              회원탈퇴
            </Typo>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- 모달 --- */}
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
            {/* ✅ Text -> Typo */}
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              이름 변경
            </Typo>
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
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleNameConfirm}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color="#fff">
                  확인
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            {/* ✅ Text -> Typo */}
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              소개 변경
            </Typo>
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
            {/* ✅ Text -> Typo */}
            <Typo size={12} color={theme.textLight} style={styles.charCount}>
              {tempBio.length}/150
            </Typo>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => setShowBioModal(false)}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleBioConfirm}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color="#fff">
                  확인
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            {/* ✅ Text -> Typo */}
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              마감 시간 설정
            </Typo>
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
                {/* ✅ Text -> Typo */}
                <Typo size={48} fontWeight="bold" color={theme.text}>
                  {selectedHour.toString().padStart(2, "0")}:00
                </Typo>
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
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleTimeConfirm}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color="#fff">
                  확인
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {/* ✅ Text -> Typo */}
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              비밀번호 변경
            </Typo>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.neutral200,
                },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="현재 비밀번호"
              placeholderTextColor={theme.textLight}
              secureTextEntry
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.neutral200,
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="새 비밀번호 (6자 이상)"
              placeholderTextColor={theme.textLight}
              secureTextEntry
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.neutral200,
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="새 비밀번호 확인"
              placeholderTextColor={theme.textLight}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => setShowPasswordModal(false)}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handlePasswordConfirm}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color="#fff">
                  확인
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 회원탈퇴 모달 */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Ionicons
              name="warning"
              size={60}
              color={theme.red100}
              style={{ marginBottom: spacingY._15 }} // ✅ 16 -> spacingY._15
            />
            {/* ✅ Text -> Typo */}
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              회원탈퇴
            </Typo>
            {/* ✅ Text -> Typo */}
            <Typo size={14} color={theme.textLight} style={styles.warningText}>
              모든 데이터가 영구적으로 삭제됩니다.{"\n"}
              계속하려면 비밀번호를 입력해주세요.
            </Typo>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.neutral200,
                },
              ]}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={theme.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.red100 }]}
                onPress={handleDeleteConfirm}
              >
                {/* ✅ Text -> Typo */}
                <Typo size={16} fontWeight="600" color="#fff">
                  탈퇴하기
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ✅ 스타일시트: spacingX/Y, radius 적용, fontSize/fontWeight 제거
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacingX._20,
    borderBottomWidth: 1,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: spacingY._80, // 80
    height: spacingY._80, // 80
    borderRadius: radius._40, // 40
  },
  uploadingOverlay: {
    position: "absolute",
    width: spacingY._80,
    height: spacingY._80,
    borderRadius: radius._40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: spacingX._30, // 28
    height: spacingY._30, // 28
    borderRadius: radius._15, // 14
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacingX._16,
    overflow: "hidden",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._8,
    marginBottom: spacingY._5, // 4
  },
  nameText: {
    // fontSize, fontWeight -> Typo props
    flexShrink: 1,
  },
  bioText: {
    // fontSize -> Typo props
  },
  section: {
    padding: spacingX._20,
  },
  sectionTitle: {
    // fontSize, fontWeight -> Typo props
    marginBottom: spacingY._15, // 16
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._10,
  },
  settingItemColumn: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingVertical: spacingY._10,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
    flexShrink: 1,
  },
  settingText: {
    // fontSize -> Typo props
    flexShrink: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._8,
  },
  settingValue: {
    // fontSize -> Typo props
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
    borderRadius: radius._20,
    padding: spacingX._25, // 24
    alignItems: "center",
  },
  modalTitle: {
    // fontSize, fontWeight -> Typo props
    marginBottom: spacingY._25, // 24
  },
  input: {
    width: "100%",
    height: spacingY._50,
    borderWidth: 1,
    borderRadius: radius._12,
    paddingHorizontal: spacingX._16,
    fontSize: 16, // (TextInput은 Typo가 아니므로 fontSize 유지)
    marginBottom: spacingY._25, // 24
  },
  textArea: {
    width: "100%",
    height: spacingY._100, // 120 -> 100
    borderWidth: 1,
    borderRadius: radius._12,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    fontSize: 16, // (TextInput은 Typo가 아니므로 fontSize 유지)
    textAlignVertical: "top",
    marginBottom: spacingY._8,
  },
  charCount: {
    // fontSize -> Typo props
    alignSelf: "flex-end",
    marginBottom: spacingY._15, // 16
  },
  clockContainer: {
    alignItems: "center",
    marginBottom: spacingY._30, // 32
  },
  arrowButton: {
    padding: spacingX._8,
  },
  timeDisplay: {
    paddingVertical: spacingY._20,
    paddingHorizontal: spacingX._40,
    borderRadius: radius._15, // 16
    marginVertical: spacingY._15, // 16
  },
  timeText: {
    // fontSize, fontWeight -> Typo props (fontSize: 48 유지)
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacingX._12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacingY._14,
    borderRadius: radius._12,
    alignItems: "center",
  },
  modalButtonText: {
    // fontSize, fontWeight -> Typo props
  },
  warningText: {
    // fontSize -> Typo props
    textAlign: "center",
    lineHeight: spacingY._20, // 20
    marginBottom: spacingY._25, // 24
  },
  colorPicker: {
    flexDirection: "row",
    gap: spacingX._12,
  },
  colorButton: {
    width: spacingX._30,
    height: spacingY._30,
    borderRadius: radius._15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonSelected: {
    borderColor: colors.blue100,
    transform: [{ scale: 1.1 }],
  },
  colorSchemePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacingY._15,
    gap: spacingX._10,
  },
  colorSchemeButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: spacingY._8,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSchemeButtonActive: {
    borderWidth: 2,
  },
  colorSchemeTitle: {
    // fontSize, fontWeight -> Typo props
    marginBottom: spacingY._12,
  },
  colorSwatchRow: {
    flexDirection: "row",
    gap: spacingX._10,
  },
  colorSwatchLabelContainer: {
    alignItems: "center",
    gap: spacingY._5,
  },
  colorSwatchLabel: {
    // fontSize -> Typo props
  },
  colorSwatch: {
    width: spacingX._20,
    height: spacingY._20,
    borderRadius: radius._6,
  },
});

export default Profile;
