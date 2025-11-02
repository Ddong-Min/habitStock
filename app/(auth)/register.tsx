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

// --- ADDED ---
// "자세히 보기" 등의 링크를 위한 헬퍼 컴포넌트
// (나중에 'termsOfService'나 'privacyPolicy' 같은 별도 화면으로 라우팅하세요)
const LinkButton = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress}>
    <Typo
      size={14}
      fontWeight="600"
      color={colors.textLight}
      style={styles.linkText}
    >
      {title}
    </Typo>
  </Pressable>
);

// --- ADDED ---
// 체크박스 행 컴포넌트
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
}) => (
  <View style={styles.agreementRow}>
    <TouchableOpacity onPress={onValueChange} style={styles.checkbox}>
      {value ? (
        <Icons.CheckSquare size={24} color={colors.text} weight="fill" />
      ) : (
        <Icons.Square size={24} color={colors.neutral300} />
      )}
    </TouchableOpacity>
    <Typo size={14} color={colors.text}>
      {label}
    </Typo>
    <View style={{ flex: 1 }} />
    {linkTitle && onLinkPress && (
      <LinkButton title={linkTitle} onPress={onLinkPress} />
    )}
  </View>
);

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- ADDED ---
  // 약관 동의를 위한 State 추가
  const [isOver14, setIsOver14] = useState(false);
  const [agreedToToS, setAgreedToToS] = useState(false);
  const [agreedToPP, setAgreedToPP] = useState(false);

  // --- ADDED ---
  // 모든 필수 약관에 동의했는지 확인하는 변수
  const allAgreed = isOver14 && agreedToToS && agreedToPP;

  const { register: registerUser, googleSignIn } = useAuth();

  // --- ADDED ---
  // 약관 동의 확인 로직 (공통 사용)
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
    // --- MODIFIED ---
    // 약관 동의 여부를 먼저 확인
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
      Alert.alert(
        "회원가입 완료",
        res.msg ||
          "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
        [
          {
            text: "확인",
            onPress: () => router.replace("/(auth)/emailVerification"),
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
    // --- MODIFIED ---
    // 구글 로그인 시에도 약관 동의 여부를 먼저 확인
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

  // --- ADDED ---
  // 약관 "자세히 보기"를 눌렀을 때의 임시 핸들러
  // TODO: 나중에 실제 약관 페이지로 연결하세요 (예: router.push('/terms'))
  const showTerms = () => {
    // app/(legal)/terms.tsx 스크린으로 이동
    router.push("/(legal)/terms");
  };

  const showPrivacyPolicy = () => {
    // app/(legal)/privacy.tsx 스크린으로 이동
    router.push("/(legal)/privacy");
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

        {/* --- ADDED --- 약관 동의 섹션 */}
        <View style={styles.agreementContainer}>
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
        {/* --- END ADDED --- */}

        <Button
          loading={isLoading}
          onPress={handleRegister}
          // --- MODIFIED ---
          // 약관 동의 안 하면 버튼 비활성화 (시각적 처리)
          style={StyleSheet.flatten(
            !allAgreed || isLoading
              ? [styles.registerButton, styles.disabledButton]
              : [styles.registerButton]
          )}
          disabled={!allAgreed || isLoading}
        >
          <Typo
            size={20}
            fontWeight={"700"}
            // --- MODIFIED ---
            // 비활성화 시 텍스트 색상 변경
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
          // --- MODIFIED ---
          // 구글 버튼은 비활성화 시키지 않되, 눌렀을 때 checkAgreements()가 실행됨
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
    marginBottom: 20, // --- MODIFIED --- (약관 영역 위해 여백 줄임)
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
  // --- ADDED ---
  // 약관 동의 관련 스타일
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
    padding: 2, // 터치 영역 확보
  },
  linkText: {
    textDecorationLine: "underline",
  },
  // --- ADDED ---
  // 버튼 비활성화 스타일
  registerButton: {
    // 기존 Button에 기본 스타일이 적용되고 있겠지만,
    // 비활성화 처리를 위해 명시적으로 추가
  },
  disabledButton: {
    backgroundColor: colors.neutral200, // 비활성화 시 배경색
  },
  registerButtonText: {
    color: colors.white, // 활성화 시 텍스트 색 (Button.tsx에 따라 다를 수 있음)
  },
  disabledButtonText: {
    color: colors.neutral400, // 비활성화 시 텍스트 색
  },
  // --- END ADDED ---
});
