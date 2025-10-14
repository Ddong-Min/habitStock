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
  const { login: loginUser } = useAuth();
  // Use the router object directly from expo-router
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const res = await loginUser(email, password);
    setIsLoading(false);
    if (!res.success) {
      Alert.alert("로그인 실패", res.msg);
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
