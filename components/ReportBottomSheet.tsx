import React, { useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  StyleProp,
  ViewStyle,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useTheme } from "@/contexts/themeContext";
import { useAuth } from "@/contexts/authContext";
import { submitReport } from "@/api/reportApi";
import Typo from "./Typo";
import { radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

interface ReportBottomSheetProps {
  contentId: string;
  contentType: "news" | "comment";
  reportedUid?: string; // (선택) 댓글 작성자 UID
  onClose: () => void;
  containerStyle?: StyleProp<ViewStyle>; // zIndex 등을 위한 스타일 prop
}

const ReportBottomSheet: React.FC<ReportBottomSheetProps> = ({
  contentId,
  contentType,
  reportedUid,
  onClose,
  containerStyle,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { theme } = useTheme(); // 테마 적용
  const { user } = useAuth(); // 신고자 UID를 위한 Auth

  // 신고 사유 목록
  const reportReasons = [
    { key: "spam", label: "스팸 또는 광고성 콘텐츠" },
    { key: "hate_speech", label: "욕설, 비방, 차별적 발언" },
    { key: "false_info", label: "거짓 정보" },
    { key: "other", label: "기타 부적절한 콘텐츠" },
  ];

  // 신고 처리 함수
  const handleReport = async (reason: string) => {
    if (!user) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    const reportData = {
      type: contentType,
      contentId: contentId,
      reporterUid: user.uid,
      reason: reason,
      ...(reportedUid && { reportedUid }), // reportedUid가 있으면 추가
    };

    // 1단계에서 만든 API 호출
    const result = await submitReport(reportData);

    if (result.success) {
      Alert.alert("신고 완료", "신고가 정상적으로 접수되었습니다.");
    } else {
      Alert.alert("오류", "신고 접수 중 오류가 발생했습니다.");
    }
    onClose(); // 바텀시트 닫기
  };

  // 스타일 (DiffBottomSheet 기반)
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacingX._20,
      paddingTop: spacingY._7,
      backgroundColor: theme.neutral50, // 테마 적용
    },
    header: {
      paddingBottom: spacingY._20,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral200, // 테마 적용
      marginBottom: spacingY._12,
    },
    titleText: {
      color: theme.black, // 테마 적용
      lineHeight: verticalScale(24),
      letterSpacing: -0.3,
    },
    buttonContainer: {
      flex: 1,
      gap: spacingY._12,
    },
    actionButton: {
      alignItems: "center",
      backgroundColor: theme.white, // 테마 적용
      borderRadius: 12,
      paddingVertical: spacingY._17,
      paddingHorizontal: spacingX._17,
      borderWidth: 1,
      borderColor: theme.neutral200, // 테마 적용
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    buttonLabel: {
      color: theme.black, // 테마 적용
      letterSpacing: -0.2,
    },
  });

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={["45%"]} // 높이
      enablePanDownToClose
      onClose={onClose}
      style={containerStyle} // zIndex 적용
      backgroundStyle={{
        borderRadius: radius._20,
        backgroundColor: theme.white, // 테마 적용
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.neutral300, // 테마 적용
        width: 40,
        height: 4,
      }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Typo size={18} fontWeight="600" style={styles.titleText}>
            신고 사유 선택
          </Typo>
        </View>

        <View style={styles.buttonContainer}>
          {reportReasons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              onPress={() => handleReport(btn.key)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Typo size={16} fontWeight="500" style={styles.buttonLabel}>
                {btn.label}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default ReportBottomSheet;
