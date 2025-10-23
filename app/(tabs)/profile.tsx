import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  Text,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { useTheme } from "@/contexts/themeContext";
import { spacingY } from "@/constants/theme";
import { useProfileHandlers } from "@/handler/profileHandler";
const Profile: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
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
    setShowNameModal,
    setTempName,
    setShowBioModal,
    setTempBio,
    setShowTimePicker,
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
    showDeleteModal,
    deletePassword,
    setShowDeleteModal,
    setDeletePassword,
    handleDeleteConfirm,
  } = useProfileHandlers();
  //로그인이 안된경우
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
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          일반 설정
        </Text>
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          차트 설정
        </Text>
      </View>

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
              style={{ marginBottom: 16 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              회원탈퇴
            </Text>
            <Text
              style={[
                styles.warningText,
                { color: theme.textLight, marginBottom: 24 },
              ]}
            >
              모든 데이터가 영구적으로 삭제됩니다.{"\n"}
              계속하려면 비밀번호를 입력해주세요.
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
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.red100 }]}
                onPress={handleDeleteConfirm}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  탈퇴하기
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
    paddingVertical: spacingY._10,
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
  warningText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default Profile;
