import React, { memo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { useTheme } from "@/contexts/themeContext";
import { spacingY, colors, spacingX, radius } from "@/constants/theme";
import { useProfileHandlers } from "@/handler/profileHandler";
import { useNotification } from "@/contexts/notificationContext";
import Typo from "@/components/Typo";

// ✅ 색상 버튼 컴포넌트 (메모이제이션)
const ColorButton = memo(
  ({
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
  )
);

ColorButton.displayName = "ColorButton";

// ✅ 프로필 헤더 섹션 분리
const ProfileHeader = memo(
  ({
    user,
    theme,
    isUploading,
    handleImagePicker,
    setTempName,
    setShowNameModal,
    setTempBio,
    setShowBioModal,
  }: any) => (
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
          <Typo size={14} color={theme.textLight} numberOfLines={1}>
            {user.bio || "소개를 입력하세요"}
          </Typo>
        </TouchableOpacity>
      </View>
    </View>
  )
);

ProfileHeader.displayName = "ProfileHeader";

// ✅ 일반 설정 섹션 분리
const GeneralSettings = memo(
  ({
    user,
    theme,
    handleDarkModeToggle,
    handleNotificationToggle,
    handleDeadlineChange,
    handleLanguageChange,
  }: any) => (
    <View style={styles.section}>
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
          <Typo size={16} color={theme.text} style={styles.settingText}>
            할일 마감 시간
          </Typo>
        </View>
        <View style={styles.settingRight}>
          <Typo size={14} color={theme.textLight}>
            {user.duetime}
          </Typo>
          <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingItem}
        onPress={handleLanguageChange}
      >
        <View style={styles.settingLeft}>
          <Ionicons name="language" size={24} color={theme.text} />
          <Typo size={16} color={theme.text} style={styles.settingText}>
            언어
          </Typo>
        </View>
        <View style={styles.settingRight}>
          <Typo size={14} color={theme.textLight}>
            {user.words}
          </Typo>
          <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
        </View>
      </TouchableOpacity>
    </View>
  )
);

GeneralSettings.displayName = "GeneralSettings";

// ✅ 차트 설정 섹션 분리
const ChartSettings = memo(
  ({
    user,
    theme,
    handleMovingAverageToggle,
    handleChartColorSchemeChange,
    handleChartLineColorChange,
  }: any) => {
    const lineColors = ["#6A8BFF", "#8B5CF6", "#F59E0B", "#10B981"];

    return (
      <View style={styles.section}>
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

        <View style={styles.settingItemColumn}>
          <View style={styles.settingLeft}>
            <Ionicons name="color-palette" size={24} color={theme.text} />
            <Typo size={16} color={theme.text} style={styles.settingText}>
              차트 색상 테마
            </Typo>
          </View>

          <View style={styles.colorSchemePicker}>
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
              <Typo
                size={16}
                fontWeight="600"
                color={theme.text}
                style={styles.colorSchemeTitle}
              >
                한국식
              </Typo>
              <View style={styles.colorSwatchRow}>
                <View style={styles.colorSwatchLabelContainer}>
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
                <View style={styles.colorSwatchLabelContainer}>
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
              <Typo
                size={16}
                fontWeight="600"
                color={theme.text}
                style={styles.colorSchemeTitle}
              >
                글로벌
              </Typo>
              <View style={styles.colorSwatchRow}>
                <View style={styles.colorSwatchLabelContainer}>
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
                <View style={styles.colorSwatchLabelContainer}>
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

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="analytics" size={24} color={theme.text} />
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
    );
  }
);

ChartSettings.displayName = "ChartSettings";

// ✅ 계정 관리 섹션 분리
const AccountSettings = memo(
  ({ theme, handlePasswordChange, handleLogout, handleDeleteAccount }: any) => (
    <View style={styles.section}>
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
          <Typo size={16} color={theme.text} style={styles.settingText}>
            비밀번호 변경
          </Typo>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
        <View style={styles.settingLeft}>
          <Ionicons name="log-out" size={24} color={theme.red100} />
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
          <Typo size={16} color={theme.red100} style={styles.settingText}>
            회원탈퇴
          </Typo>
        </View>
      </TouchableOpacity>
    </View>
  )
);

AccountSettings.displayName = "AccountSettings";

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

  if (!user) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Typo color={theme.text}>로그인 정보가 없습니다.</Typo>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ProfileHeader
        user={user}
        theme={theme}
        isUploading={isUploading}
        handleImagePicker={handleImagePicker}
        setTempName={setTempName}
        setShowNameModal={setShowNameModal}
        setTempBio={setTempBio}
        setShowBioModal={setShowBioModal}
      />

      <GeneralSettings
        user={user}
        theme={theme}
        handleDarkModeToggle={handleDarkModeToggle}
        handleNotificationToggle={handleNotificationToggle}
        handleDeadlineChange={handleDeadlineChange}
        handleLanguageChange={handleLanguageChange}
      />

      <ChartSettings
        user={user}
        theme={theme}
        handleMovingAverageToggle={handleMovingAverageToggle}
        handleChartColorSchemeChange={handleChartColorSchemeChange}
        handleChartLineColorChange={handleChartLineColorChange}
      />

      <AccountSettings
        theme={theme}
        handlePasswordChange={handlePasswordChange}
        handleLogout={handleLogout}
        handleDeleteAccount={handleDeleteAccount}
      />

      {/* --- 모달들 --- */}
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
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleNameConfirm}
              >
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
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleBioConfirm}
              >
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
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleTimeConfirm}
              >
                <Typo size={16} fontWeight="600" color="#fff">
                  확인
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handlePasswordConfirm}
              >
                <Typo size={16} fontWeight="600" color="#fff">
                  확인
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              style={{ marginBottom: spacingY._15 }}
            />
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              회원탈퇴
            </Typo>
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
                <Typo size={16} fontWeight="600" color={theme.text}>
                  취소
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.red100 }]}
                onPress={handleDeleteConfirm}
              >
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
    width: spacingY._80,
    height: spacingY._80,
    borderRadius: radius._40,
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
    width: spacingX._30,
    height: spacingY._30,
    borderRadius: radius._15,
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
    marginBottom: spacingY._5,
  },
  nameText: {
    flexShrink: 1,
  },
  section: {
    padding: spacingX._20,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
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
    flexShrink: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._8,
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
    padding: spacingX._25,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: spacingY._25,
  },
  input: {
    width: "100%",
    height: spacingY._50,
    borderWidth: 1,
    borderRadius: radius._12,
    paddingHorizontal: spacingX._16,
    fontSize: 16,
    marginBottom: spacingY._25,
  },
  textArea: {
    width: "100%",
    height: spacingY._100,
    borderWidth: 1,
    borderRadius: radius._12,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: spacingY._8,
  },
  charCount: {
    alignSelf: "flex-end",
    marginBottom: spacingY._15,
  },
  clockContainer: {
    alignItems: "center",
    marginBottom: spacingY._30,
  },
  arrowButton: {
    padding: spacingX._8,
  },
  timeDisplay: {
    paddingVertical: spacingY._20,
    paddingHorizontal: spacingX._40,
    borderRadius: radius._15,
    marginVertical: spacingY._15,
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
  warningText: {
    textAlign: "center",
    lineHeight: spacingY._20,
    marginBottom: spacingY._25,
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
  colorSwatch: {
    width: spacingX._20,
    height: spacingY._20,
    borderRadius: radius._6,
  },
});

export default Profile;
