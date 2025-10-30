import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Pressable,
} from "react-native";
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
import { useAuth } from "@/contexts/authContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login: loginUser, resendVerificationEmail, googleSignIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const res = await loginUser(email, password);
    setIsLoading(false);

    if (!res.success) {
      if (res.needVerification) {
        // 이메일 인증이 필요한 경우
        Alert.alert(
          "이메일 인증 필요",
          "이메일 인증이 완료되지 않았습니다. 인증 이메일을 다시 보내시겠습니까?",
          [
            {
              text: "취소",
              style: "cancel",
            },
            {
              text: "재발송",
              onPress: async () => {
                const result = await resendVerificationEmail();
                Alert.alert(
                  result.success ? "발송 완료" : "발송 실패",
                  result.msg || ""
                );
              },
            },
          ]
        );
      } else {
        Alert.alert("로그인 실패", res.msg);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const res = await googleSignIn();
    setIsLoading(false);

    if (!res.success) {
      Alert.alert(
        "구글 로그인 실패",
        res.msg || "알 수 없는 오류가 발생했습니다."
      );
    }
  };

  return (
    <ScreenWrapper>
      <View style={{ position: "absolute", top: verticalScale(40), left: 20 }}>
        <BackButton />
      </View>
      <View style={styles.container}>
        <Typo size={32} fontWeight="700" style={styles.title}>
          로그인
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
          <Input
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={
              <Icons.Lock
                size={verticalScale(26)}
                color={colors.neutral300}
                weight="fill"
              />
            }
          />
          <Pressable onPress={() => router.push("/(auth)/forgotPassword")}>
            <Typo
              size={14}
              color={colors.text}
              style={{ alignSelf: "flex-end" }}
            >
              비밀번호를 잊으셨나요?
            </Typo>
          </Pressable>
        </View>

        <Button
          loading={isLoading}
          style={{ height: 60 }}
          onPress={handleLogin}
        >
          <Typo size={20} fontWeight={"700"}>
            로그인
          </Typo>
        </Button>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Typo size={14} color={colors.textLight} style={styles.dividerText}>
            또는
          </Typo>
          <View style={styles.dividerLine} />
        </View>

        <Button
          loading={isLoading}
          onPress={handleGoogleSignIn}
          style={styles.googleButton}
        >
          <Icons.GoogleLogo size={24} color={colors.text} weight="bold" />
          <Typo size={18} fontWeight={"600"} style={{ marginLeft: 10 }}>
            Google로 로그인
          </Typo>
        </Button>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Typo size={14} color={colors.textLight}>
              아직 계정이 없으신가요?{" "}
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: verticalScale(40),
    left: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 40,
  },
  formContainer: {
    gap: verticalScale(15),
    marginBottom: verticalScale(25),
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral300,
  },
  dividerText: {
    marginHorizontal: 15,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral300,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
