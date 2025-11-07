// app/(auth)/register.tsx
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

// ... (AgreementRow, LinkButton 컴포넌트 - 변경 없음)
const LinkButton = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <Typo
        size={14}
        fontWeight="600"
        color={theme.textLight}
        style={styles.linkText}
      >
        {title}
      </Typo>
    </Pressable>
  );
};
const AgreementRow = ({
  label,
  value,
  onValueChange,
  linkTitle,
  onLinkPress,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  linkTitle?: string;
  onLinkPress?: () => void;
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.agreementRow}>
      <TouchableOpacity onPress={onValueChange} style={styles.checkbox}>
        {value ? (
          <Icons.CheckSquare size={24} color={colors.text} weight="fill" />
        ) : (
          <Icons.Square size={24} color={theme.neutral300} />
        )}
      </TouchableOpacity>
      <Typo size={14} color={theme.text}>
        {label}
      </Typo>
      <View style={{ flex: 1 }} />
      {linkTitle && onLinkPress && (
        <LinkButton title={linkTitle} onPress={onLinkPress} />
      )}
    </View>
  );
};
// ...

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isOver14, setIsOver14] = useState(false);
  const [agreedToToS, setAgreedToToS] = useState(false);
  const [agreedToPP, setAgreedToPP] = useState(false);
  const allAgreed = isOver14 && agreedToToS && agreedToPP;

  const { register: registerUser, googleSignIn } = useAuth();

  // ... (handleRegister, checkAgreements 등 - 변경 없음)
  const checkAgreements = () => {
    if (!allAgreed) {
      Alert.alert(
        "약관 동의 필요",
        "회원가입을 계속하려면 모든 필수 약관에 동의해야 합니다."
      );
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!checkAgreements()) return;
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
      router.replace("/(auth)/emailVerification");
    } else {
      Alert.alert(
        "회원가입 실패",
        res.msg || "알 수 없는 오류가 발생했습니다."
      );
    }
  };

  const handleGoogleSignIn = async () => {
    if (!checkAgreements()) return;
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

  const showTerms = () => {
    router.push("/(legal)/terms");
  };
  const showPrivacyPolicy = () => {
    router.push("/(legal)/privacy");
  };

  return (
    <ScreenWrapper>
      {/* --- [!! 여기가 '17연속 상장폐지' 해결 지점 !!] --- */}
      <View
        style={{
          position: "absolute",
          top: verticalScale(40),
          left: 20,
          zIndex: 10, // [수정] zIndex 추가 (버튼을 최상위로)
        }}
      >
        <BackButton />
      </View>

      <View style={styles.container}>
        <Typo size={32} fontWeight="700" style={styles.title}>
          회원가입
        </Typo>

        <View style={styles.formContainer}>
          {/* ... (Input 컴포넌트들 - 변경 없음) ... */}
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
        </View>

        <View style={styles.agreementContainer}>
          {/* ... (약관 동의 - 변경 없음) ... */}
          <AgreementRow
            label="(필수) 본인은 만 14세 이상입니다."
            value={isOver14}
            onValueChange={() => setIsOver14(!isOver14)}
          />
          <AgreementRow
            label="(필수) 이용약관에 동의합니다."
            value={agreedToToS}
            onValueChange={() => setAgreedToToS(!agreedToToS)}
            linkTitle="자세히 보기"
            onLinkPress={showTerms}
          />
          <AgreementRow
            label="(필수) 개인정보 처리방침에 동의합니다."
            value={agreedToPP}
            onValueChange={() => setAgreedToPP(!agreedToPP)}
            linkTitle="자세히 보기"
            onLinkPress={showPrivacyPolicy}
          />
        </View>

        {/* ... (Button 컴포넌트들 - '16연속 상장폐지' 수정본 반영됨) ... */}
        <Button
          loading={isLoading}
          onPress={handleRegister}
          style={
            !allAgreed || isLoading
              ? styles.disabledButton
              : styles.registerButton
          }
          disabled={!allAgreed || isLoading}
        >
          <Typo
            size={20}
            fontWeight={"700"}
            style={
              !allAgreed || isLoading
                ? styles.disabledButtonText
                : styles.registerButtonText
            }
          >
            회원가입
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

        <Button
          loading={isLoading}
          onPress={handleGoogleSignIn}
          style={{
            ...styles.googleButton,
            backgroundColor: theme.cardBackground,
            borderColor: theme.neutral300,
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
            이미 계정이 있으신가요?{" "}
          </Typo>
          <Pressable onPress={() => router.navigate("/(auth)/login")}>
            <Typo size={14} fontWeight="600" color={theme.text}>
              로그인
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Register;

// (styles - 변경 없음)
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
    marginBottom: 20,
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
  agreementContainer: {
    gap: 12,
    marginBottom: 30,
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    padding: 2,
  },
  linkText: {
    textDecorationLine: "underline",
  },
  registerButton: {},
  disabledButton: {
    backgroundColor: colors.neutral200,
  },
  registerButtonText: {
    color: colors.white,
  },
  disabledButtonText: {
    color: colors.neutral400,
  },
});
