import { StyleSheet, View, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { router } from "expo-router";
import Button from "@/components/Button";
import * as Icons from "phosphor-react-native";
import { useAuth } from "@/contexts/authContext";

const EmailVerification = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { resendVerificationEmail, checkEmailVerification, logout } = useAuth();

  // 자동으로 인증 상태 체크 (5초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        clearInterval(interval);
        Alert.alert("인증 완료", "이메일 인증이 완료되었습니다!", [
          {
            text: "확인",
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    const isVerified = await checkEmailVerification();
    setIsChecking(false);

    if (isVerified) {
      Alert.alert("인증 완료", "이메일 인증이 완료되었습니다!", [
        {
          text: "확인",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } else {
      Alert.alert(
        "인증 미완료",
        "아직 이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요."
      );
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) {
      Alert.alert("알림", `${countdown}초 후에 다시 시도해주세요.`);
      return;
    }

    const res = await resendVerificationEmail();
    if (res.success) {
      Alert.alert("전송 완료", res.msg || "인증 이메일이 재발송되었습니다.");
      setCountdown(60); // 60초 대기

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Alert.alert("전송 실패", res.msg || "이메일 전송에 실패했습니다.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icons.EnvelopeSimple
            size={80}
            color={colors.text}
            weight="duotone"
          />
        </View>

        <Typo size={28} fontWeight="700" style={styles.title}>
          이메일 인증 필요
        </Typo>

        <Typo size={16} color={colors.textLight} style={styles.description}>
          회원가입 시 입력한 이메일로{"\n"}
          인증 링크를 전송했습니다.{"\n\n"}
          이메일을 확인하고 인증을 완료해주세요.
        </Typo>

        <View style={styles.buttonContainer}>
          <Button loading={isChecking} onPress={handleCheckVerification}>
            <Typo size={18} fontWeight="600">
              인증 완료 확인
            </Typo>
          </Button>

          <Button
            onPress={handleResendEmail}
            disabled={countdown > 0}
            style={StyleSheet.flatten([
              styles.secondaryButton,
              countdown > 0 && styles.disabledButton,
            ])}
          >
            <Typo
              size={16}
              fontWeight="600"
              color={countdown > 0 ? colors.neutral300 : colors.text}
            >
              {countdown > 0
                ? `인증 메일 재전송 (${countdown}초)`
                : "인증 메일 재전송"}
            </Typo>
          </Button>

          <Button onPress={handleLogout} style={styles.logoutButton}>
            <Typo size={16} fontWeight="600" color={colors.textLight}>
              로그아웃
            </Typo>
          </Button>
        </View>

        <View style={styles.infoBox}>
          <Icons.Info size={20} color={colors.text} weight="fill" />
          <Typo size={14} color={colors.textLight} style={styles.infoText}>
            이메일이 도착하지 않았다면 스팸함을 확인해주세요.
          </Typo>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default EmailVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral300,
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.neutral300,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    padding: 15,
    backgroundColor: colors.neutral100,
    borderRadius: 10,
    gap: 10,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
});
