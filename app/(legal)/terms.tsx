// 파일 위치: app/(legal)/terms.tsx

import { ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import { verticalScale } from "@/utils/styling";

// 개별 조항을 위한 컴포넌트
const Article = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.article}>
    <Typo size={16} fontWeight="600" style={styles.articleTitle}>
      {title}
    </Typo>
    <Typo size={14} color={colors.textLight} style={styles.articleBody}>
      {children}
    </Typo>
  </View>
);

const TermsScreen = () => {
  return (
    <ScreenWrapper>
      {/* 헤더 */}
      <View style={styles.header}>
        <BackButton />
        <Typo size={20} fontWeight="600" style={styles.headerTitle}>
          이용약관
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      {/* 약관 본문 (스크롤 가능) */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Article title="제 1 조 (목적)">
          본 약관은 [당신 이름 또는 회사명] (이하 '회사')가 제공하는 HabitStock
          모바일 애플리케이션(이하 '서비스')의 이용과 관련하여 '회사'와 '회원'의
          권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </Article>

        <Article title="제 2 조 (용어의 정의)">
          1. '회원': 본 약관에 동의하고 '서비스' 이용 자격을 부여받은 자를
          말합니다.{"\n"}
          2. '주식', '주가', '차트', '시가총액': '서비스' 내에서 '회원'의
          동기부여를 위해 제공되는 가상의 게임 요소(Gamification)를 지칭합니다.
        </Article>

        <Article title="제 3 조 (약관의 명시와 개정)">
          1. '회사'는 본 약관의 내용을 '회원'이 쉽게 알 수 있도록 '서비스' 내
          회원가입 화면 및 [설정 메뉴 등]에 게시합니다.{"\n"}
          2. '회사'는 필요시 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수
          있습니다.
        </Article>

        <Article title="제 4 조 (서비스의 본질 및 면책 조항)">
          1. [가장 중요] '서비스'에서 제공하는 '주식', '주가' 등 모든 정보는
          '회원'의 습관 달성도를 기반으로 생성되는 가상의 수치(Virtual Figure)입니다.
          {"\n"}
          2. 이는 실제 금융 상품, 화폐, 자산 가치와 어떠한 관련도 없습니다.
          {"\n"}
          3. '회사'는 '서비스' 내 정보를 바탕으로 '회원'이 행한 실제 금융 투자
          행위 및 그로 인한 손실에 대해 일절 책임지지 않습니다.{"\n"}
          4. '서비스'는 금융 투자 자문 서비스가 아닙니다.
        </Article>

        <Article title="제 5 조 (회원가입 및 만 14세 이상 확인)">
          1. '회원'은 '회사'가 정한 가입 양식에 따라 정보를 기입한 후 본 약관에
          동의함으로써 회원가입을 신청합니다.{"\n"}
          2. '회원'은 회원가입 시 본인이 만 14세 이상임을 확인하며, 이에
          동의해야만 '서비스'를 이용할 수 있습니다.
        </Article>

        <Article title="제 6 조 (유료 서비스 및 광고)">
          1. '서비스'는 기본적으로 무료로 제공되나, 향후 '회사'는 '서비스'의 일부
          기능을 유료(예: 구독)로 전환할 수 있습니다. 이 경우 '회원'에게 명확히
          고지하고 동의를 받습니다.{"\n"}
          2. '서비스'에는 '회사' 또는 제휴사가 제공하는 배너 광고 및 리워드
          광고(Google AdMob 등)가 포함될 수 있습니다.
        </Article>

        <Article title="제 7 조 (회원의 의무)">
          '회원'은 '서비스' 이용 시 다음 행위를 하여서는 안 됩니다.{"\n"}
          1. 타인의 정보 도용{"\n"}
          2. '서비스'의 서버를 해킹하거나 비정상적인 방법으로 '서비스'를 이용하는
          행위{"\n"}
          3. 기타 불법적이거나 부당한 행위
        </Article>

        <Article title="제 8 조 (서비스의 종료)">
          '회사'는 경영상의 이유로 '서비스'를 종료할 수 있으며, 이 경우 최소
          30일 전에 '회원'에게 공지합니다.
        </Article>

        <Article title="부칙">
          본 약관은 2025년 [XX월 XX일]부터 시행됩니다.
        </Article>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: verticalScale(40),
    paddingBottom: 10,
    backgroundColor: colors.background, // ScreenWrapper와 동일하게
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    // BackButton과 빈 View(width: 40) 덕분에 중앙 정렬됨
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
    lineHeight: 20, // 가독성을 위한 줄 간격
  },
});