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

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerUser } = useAuth();
  const handleRegister = async () => {
    // 여기에 실제 회원가입 로직을 추가하세요 (e.g., Firebase, API 연동)
    if (!name || !email || !password) {
      Alert.alert("입력 오류", "모든 필드를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    const res = await registerUser(email, password, name);
    setIsLoading(false);
    console.log("res", res);
    if (!res.success) {
      Alert.alert(
        "회원가입 실패",
        res.msg || "알 수 없는 오류가 발생했습니다."
      );
      return;
    }
  };

  return (
    <ScreenWrapper>
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
            placeholder="비밀번호"
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
