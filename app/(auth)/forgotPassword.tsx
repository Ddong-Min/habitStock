import { StyleSheet, View, Alert } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { verticalScale } from "@/utils/styling";
import BackButton from "@/components/BackButton";
import * as Icons from "phosphor-react-native";
import { router } from "expo-router";
import auth from "@react-native-firebase/auth"; // ✅ Web SDK 대신 Native Firebase 사용

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("입력 오류", "이메일 주소를 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("입력 오류", "올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsLoading(true);
    try {
      // ✅ React Native Firebase 방식
      await auth().sendPasswordResetEmail(email);

      Alert.alert(
        "이메일 전송 완료",
        "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
        [
          {
            text: "확인",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("비밀번호 재설정 오류:", error);
      let errorMessage = "비밀번호 재설정 이메일 전송에 실패했습니다.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바르지 않은 이메일 형식입니다.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
      }

      Alert.alert("오류", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={{ position: "absolute", top: verticalScale(40), left: 20 }}>
        <BackButton />
      </View>
      <View style={styles.container}>
        <Typo size={32} fontWeight="700" style={styles.title}>
          비밀번호 찾기
        </Typo>

        <Typo size={14} color={colors.textLight} style={styles.description}>
          가입하신 이메일 주소를 입력하시면{"\n"}
          비밀번호 재설정 링크를 보내드립니다.
        </Typo>

        <View style={styles.formContainer}>
          <Input
            placeholder="이메일 주소"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={
              <Icons.At
                size={verticalScale(26)}
                color={colors.neutral300}
                weight="fill"
              />
            }
          />
        </View>

        <Button
          loading={isLoading}
          style={{ height: 60 }}
          onPress={handlePasswordReset}
        >
          <Typo size={20} fontWeight={"700"}>
            재설정 링크 보내기
          </Typo>
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: verticalScale(25),
  },
});
