// 파일 위치: app/(legal)/privacy.tsx

import { ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import { verticalScale } from "@/utils/styling";

// 개별 조항을 위한 컴포넌트
const Article = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.article}>
    <Typo size={16} fontWeight="600" style={styles.articleTitle}>
      {title}
    </Typo>
    <Typo size={14} color={colors.textLight} style={styles.articleBody}>
      {children}
    </Typo>
  </View>
);

const PrivacyScreen = () => {
  return (
    <ScreenWrapper>
      {/* 헤더 */}
      <View style={styles.header}>
        <BackButton />
        <Typo size={20} fontWeight="600" style={styles.headerTitle}>
          개인정보 처리방침
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      {/* 본문 (스크롤 가능) */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Typo size={14} color={colors.textLight} style={{ marginBottom: 20 }}>
          [당신 이름 또는 회사명] (이하 '회사')은(는) HabitStock 서비스(이하
          '서비스') 제공을 위해 정보통신망법, 개인정보보호법 등 관련 법령에 따라
          '회원'의 개인정보를 처리합니다.
        </Typo>

        <Article title="1. 수집하는 개인정보 항목 및 수집 목적">
          '회사'는 다음의 목적을 위해 최소한의 개인정보를 수집합니다.{"\n\n"}
          가. (필수) 회원가입 및 서비스 이용{"\n"}- 수집 항목: 이름(닉네임),
          이메일 주소, 비밀번호(암호화){"\n"}- 수집 목적: 회원 식별, 서비스
          제공, 고객 문의 응대{"\n\n"}
          나. (선택) 소셜 로그인 (Google){"\n"}- 수집 항목: Google 계정 정보
          (이메일, 프로필 이름){"\n"}- 수집 목적: 간편 회원가입 및 로그인 연동
          {"\n\n"}
          다. (선택) 프로필 설정{"\n"}- 수집 항목: 프로필 사진 (이미지 파일)
          {"\n"}- 수집 목적: '서비스' 내 프로필 화면 표시{"\n\n"}
          라. (필수) 서비스 이용 과정에서 자동 생성{"\n"}- 수집 항목: 서비스
          이용 기록(할 일 내역, 주가 변동 내역), 기기 정보 (OS, 기기 식별자),
          접속 로그{"\n"}- 수집 목적: '서비스' 핵심 기능(습관 기록, 차트) 제공,
          서비스 품질 향상, 부정 이용 방지
        </Article>

        <Article title="2. 개인정보의 제3자 제공 및 위탁 (매우 중요)">
          '회사'는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를
          위탁하거나 제3자에게 제공합니다.{"\n\n"}
          가. (위탁) 클라우드 서버 운영{"\n"}- 위탁받는 자: Google LLC.
          (Firebase){"\n"}- 위탁 업무: 회원 정보(Auth), 데이터(Firestore),
          파일(Storage) 저장 및 관리, 푸시 알림(FCM), 서비스 분석(Analytics)
          {"\n\n"}
          나. (제3자 제공) 맞춤형 광고 제공{"\n"}- 제공받는 자: Google (AdMob)
          {"\n"}- 제공 항목: 광고 식별자(ADID/IDFA), 서비스 이용 행태 정보{"\n"}
          - 목적: '회원'에게 최적화된 맞춤형 광고 제공
        </Article>

        <Article title="3. 개인정보의 보유 및 이용 기간">
          '회원'의 개인정보는 원칙적으로 '회원 탈퇴 시' 또는 수집 목적 달성 시
          지체 없이 파기합니다.
        </Article>

        <Article title="4. 개인정보의 파기">
          '회사'는 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 복구할
          수 없는 방법으로 안전하게 파기합니다.
        </Article>

        <Article title="5. 개인정보 보호 책임자">
          '서비스'의 개인정보 처리에 관한 문의 및 불만 처리는 아래의 책임자에게
          연락할 수 있습니다.{"\n\n"}- 개인정보 보호 책임자: [당신 이름]{"\n"}-
          이메일: [당신이 관리할 수 있는 이메일 주소, 예:
          habitstock.support@gmail.com]
        </Article>

        <Article title="부칙">
          본 개인정보 처리방침은 2025년 [XX월 XX일]부터 시행됩니다.
        </Article>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PrivacyScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: verticalScale(40),
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  article: {
    marginBottom: 20,
  },
  articleTitle: {
    marginBottom: 8,
  },
  articleBody: {
    lineHeight: 20,
  },
});
