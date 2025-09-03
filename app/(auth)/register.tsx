import { StyleSheet, View, TouchableOpacity, Text, Alert, Pressable } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { Link, router } from "expo-router";
import Input from "@/components/Input";
import Button from "@/components/Button";
import * as Icons from "phosphor-react-native";

const Register = () => {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    // 여기에 실제 회원가입 로직을 추가하세요 (e.g., Firebase, API 연동)
    if (!nickname || !email || !password) {
      Alert.alert("입력 오류", "모든 필드를 입력해주세요.");
      return;
    }
    console.log("Signing up with:", { nickname, email, password });
    Alert.alert("회원가입 성공", "로그인 페이지로 이동합니다.");
    router.replace("/login"); // 회원가입 성공 후 로그인 페이지로 이동
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
            value={nickname}
            onChangeText={setNickname}
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

        <Button onPress={handleRegister}>
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
