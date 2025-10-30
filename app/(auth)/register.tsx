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

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerUser, googleSignIn } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("입력 오류", "모든 필드를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("입력 오류", "비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    const res = await registerUser(email, password, name);
    setIsLoading(false);

    if (res.success) {
      Alert.alert(
        "회원가입 완료",
        res.msg ||
          "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
        [
          {
            text: "확인",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } else {
      Alert.alert(
        "회원가입 실패",
        res.msg || "알 수 없는 오류가 발생했습니다."
      );
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
          회원가입
        </Typo>

        <View style={styles.formContainer}>
          <Input
            placeholder="이름"
            value={name}
            onChangeText={setName}
            icon={
              <Icons.User size={26} color={colors.neutral300} weight="fill" />
            }
          />
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
            placeholder="비밀번호 (최소 6자)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={
              <Icons.Lock size={26} color={colors.neutral300} weight="fill" />
            }
          />
        </View>

        <Button loading={isLoading} onPress={handleRegister}>
          <Typo size={20} fontWeight={"700"}>
            회원가입
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
            Google로 계속하기
          </Typo>
        </Button>

        <View style={styles.footer}>
          <Typo size={14} color={colors.textLight}>
            이미 계정이 있으신가요?{" "}
          </Typo>

          <Pressable onPress={() => router.navigate("/(auth)/login")}>
            <Typo size={14} fontWeight="600" color={colors.textLighter}>
              로그인
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Register;

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
