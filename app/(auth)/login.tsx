// app/(auth)/login.tsx
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { router } from "expo-router";
import Input from "@/components/Input";
import Button from "@/components/Button";
import * as Icons from "phosphor-react-native";
import { useAuth } from "@/contexts/authContext";
import BackButton from "@/components/BackButton";
import { verticalScale } from "@/utils/styling";
import { useTheme } from "@/contexts/themeContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { login, googleSignIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success) {
      Alert.alert("로그인 실패", res.msg);
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

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
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
              <Icons.At size={26} color={colors.neutral300} weight="fill" />
            }
          />
          <Input
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            icon={
              isPasswordVisible ? (
                <Icons.EyeSlash
                  size={26}
                  color={theme.textLight}
                  weight="fill"
                />
              ) : (
                <Icons.Eye size={26} color={theme.textLight} weight="fill" />
              )
            }
            onIconPress={togglePasswordVisibility}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.navigate("/(auth)/forgotPassword")}
          >
            <Typo size={14} color={colors.textLight}>
              비밀번호를 잊으셨나요?
            </Typo>
          </TouchableOpacity>
        </View>

        {/* '로그인' 버튼은 style prop이 없으므로 수정할 필요 없음 */}
        <Button loading={isLoading} onPress={handleLogin}>
          <Typo size={20} fontWeight={"700"}>
            로그인
          </Typo>
        </Button>

        <View style={styles.divider}>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.neutral300 }]}
          />
          <Typo size={14} color={colors.textLight} style={styles.dividerText}>
            또는
          </Typo>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.neutral300 }]}
          />
        </View>

        {/* --- [!! 여기가 '16연속 상장폐지' login.tsx 해결 지점 !!] --- */}
        <Button
          loading={isLoading}
          onPress={handleGoogleSignIn}
          // [수정] 배열 '[]' 대신 '객체 {}'로 병합
          style={{
            ...styles.googleButton, // (기본 스타일)
            backgroundColor: theme.cardBackground, // (테마 스타일 덮어쓰기)
            borderColor: theme.neutral300, // (테마 스타일 덮어쓰기)
          }}
        >
          <Icons.GoogleLogo size={24} color={theme.text} weight="bold" />
          <Typo
            size={18}
            fontWeight={"600"}
            style={{ marginLeft: 10, color: theme.text }}
          >
            Google로 계속하기
          </Typo>
        </Button>

        <View style={styles.footer}>
          <Typo size={14} color={colors.textLight}>
            계정이 없으신가요?{" "}
          </Typo>
          <Pressable onPress={() => router.navigate("/(auth)/register")}>
            <Typo size={14} fontWeight="600" color={theme.text}>
              회원가입
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
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
    gap: 16,
    marginBottom: 30,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
  },
  // [수정] 'googleButton' 스타일 정의 (login.tsx의 유일한 버튼 스타일)
  googleButton: {
    borderWidth: 1,
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
