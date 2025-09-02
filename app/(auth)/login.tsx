import { StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { Link } from "expo-router";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { verticalScale } from "@/utils/styling";
import BackButton from "@/components/BackButton";

const login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // 여기에 실제 로그인 로직을 추가하세요 (e.g., Firebase, API 연동)
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    console.log("Logging in with:", { email, password });
    // 로그인 성공 시 홈 화면으로 이동하는 로직 추가
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
          />
          <Input
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button style={{ height: 60 }} onPress={handleLogin}>
          <Typo size={20} fontWeight={"600"}>
            로그인
          </Typo>
        </Button>

        <View style={styles.footer}>
          <Typo size={14} color={colors.textLighter}>
            아직 계정이 없으신가요?{" "}
          </Typo>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default login;

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
