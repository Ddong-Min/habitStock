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
          본 개인정보처리방침은 Ddongmin(이하 "서비스 제공업체")이 광고 지원
          서비스로 개발한 모바일 기기용 todoStock 앱(이하 "애플리케이션")에
          적용됩니다. 본 서비스는 "있는 그대로" 사용되어야 합니다.
        </Typo>

        <Article title="정보 수집 및 이용">
          애플리케이션은 사용자가 다운로드 및 사용할 때 정보를 수집합니다. 이
          정보에는 다음과 같은 정보가 포함될 수 있습니다.{"\n\n"}- 사용자 기기의
          인터넷 프로토콜 주소(예: IP 주소){"\n"}- 사용자가 방문한 애플리케이션
          페이지, 방문 시간 및 날짜, 해당 페이지에서 소요된 시간{"\n"}-
          애플리케이션에서 소요된 시간{"\n"}- 모바일 기기에서 사용하는 운영 체제
          {"\n\n"}
          애플리케이션은 사용자 모바일 기기의 위치에 대한 정확한 정보를 수집하지
          않습니다.{"\n\n"}
          애플리케이션은 사용자 기기의 위치를 수집하며, 이는 서비스 제공업체가
          사용자의 대략적인 지리적 위치를 파악하고 다음과 같은 방식으로 활용하는
          데 도움이 됩니다.{"\n\n"}- 위치 정보 서비스: 서비스 제공업체는 위치
          데이터를 활용하여 개인 맞춤 콘텐츠, 관련 추천, 위치 기반 서비스와 같은
          기능을 제공합니다.{"\n"}- 분석 및 개선: 집계되고 익명화된 위치
          데이터는 서비스 제공업체가 사용자 행동을 분석하고, 추세를 파악하며,
          애플리케이션의 전반적인 성능과 기능을 개선하는 데 도움이 됩니다.{"\n"}
          - 제3자 서비스: 서비스 제공업체는 주기적으로 익명화된 위치 데이터를
          외부 서비스에 전송할 수 있습니다. 이러한 서비스는 애플리케이션 개선 및
          서비스 최적화에 도움이 됩니다.{"\n\n"}
          서비스 제공업체는 귀하가 제공한 정보를 사용하여 귀하에게 중요한 정보,
          필수 공지 및 마케팅 프로모션을 제공하기 위해 수시로 귀하에게 연락할 수
          있습니다.{"\n\n"}
          서비스 제공업체는 애플리케이션 사용 시 더 나은 경험을 위해 특정 개인
          식별 정보 제공을 요청할 수 있습니다. 서비스 제공업체가 요청한 정보는
          서비스 제공업체에서 보관하며 본 개인정보 처리방침에 명시된 대로
          사용됩니다.
        </Article>

        <Article title="제3자 접근">
          서비스 제공업체가 애플리케이션 및 서비스 개선을 위해 집계되고 익명화된
          데이터만 외부 서비스에 주기적으로 전송됩니다. 서비스 제공업체는 본
          개인정보 처리방침에 명시된 방식으로 귀하의 정보를 제3자와 공유할 수
          있습니다.{"\n\n"}
          애플리케이션은 자체적인 데이터 처리 개인정보 처리방침을 보유한 타사
          서비스를 활용합니다. 아래는 애플리케이션에서 사용하는 타사 서비스
          제공업체의 개인정보 처리방침 링크입니다.{"\n\n"}- Google Play 서비스
          {"\n"}- AdMob{"\n"}- Firebase용 Google 애널리틱스{"\n"}- Firebase
          Crashlytics{"\n\n"}
          서비스 제공업체는 다음과 같은 경우 사용자 제공 정보 및 자동 수집
          정보를 공개할 수 있습니다.{"\n\n"}- 소환장 또는 유사한 법적 절차를
          준수하는 등 법률에 따라 요구되는 경우{"\n"}- 서비스 제공업체가 자신의
          권리를 보호하고, 사용자 또는 타인의 안전을 보호하고, 사기를
          조사하거나, 정부 요청에 응답하기 위해 정보 공개가 필요하다고 선의로
          판단하는 경우{"\n"}- 당사를 대신하여 서비스를 제공하는 신뢰할 수 있는
          서비스 제공업체와 협력하며, 당사가 제공하는 정보를 독립적으로 사용하지
          않으며, 본 개인정보 처리방침에 명시된 규칙을 준수하는 데 동의합니다.
        </Article>

        <Article title="수신 거부 권리">
          애플리케이션을 삭제하면 모든 정보 수집을 쉽게 중단할 수 있습니다.
          모바일 기기에 내장된 표준 삭제 절차나 모바일 애플리케이션 마켓플레이스
          또는 네트워크를 통해 제공되는 삭제 절차를 사용할 수 있습니다.
        </Article>

        <Article title="데이터 보존 정책">
          서비스 제공업체는 사용자가 애플리케이션을 사용하는 동안 및 그 이후
          합리적인 기간 동안 사용자 제공 데이터를 보관합니다. 애플리케이션을
          통해 제공한 사용자 제공 데이터를 삭제하려면 bomur0522@gmail.com으로
          문의하시면 합리적인 시간 내에 답변해 드리겠습니다.
        </Article>

        <Article title="아동">
          서비스 제공업체는 13세 미만 아동으로부터 고의로 데이터를 수집하거나
          마케팅 목적으로 애플리케이션을 사용하지 않습니다.{"\n\n"}본
          애플리케이션은 13세 미만 아동을 대상으로 하지 않습니다. 서비스
          제공자는 만 13세 미만 아동의 개인 식별 정보를 고의로 수집하지
          않습니다. 서비스 제공자가 만 13세 미만 아동이 개인 정보를 제공한
          사실을 발견하는 경우, 해당 정보를 서버에서 즉시 삭제합니다. 부모 또는
          보호자이시며 자녀가 당사에 개인 정보를 제공한 사실을 알고 계신 경우,
          서비스 제공자(bomur0522@gmail.com)에게 연락하여 필요한 조치를 취하도록
          하십시오.
        </Article>

        <Article title="보안">
          서비스 제공자는 귀하의 정보 기밀 유지에 최선을 다하고 있습니다. 서비스
          제공자는 서비스 제공자가 처리하고 보관하는 정보를 보호하기 위해
          물리적, 전자적, 절차적 보안 조치를 제공합니다.
        </Article>

        <Article title="변경">
          본 개인정보 처리방침은 어떠한 이유로든 수시로 업데이트될 수 있습니다.
          서비스 제공업체는 이 페이지를 새로운 개인정보 처리방침으로
          업데이트하여 개인정보 처리방침의 변경 사항을 귀하에게 알립니다. 본
          개인정보 처리방침을 정기적으로 확인하시기 바랍니다. 계속 사용하는 것은
          모든 변경 사항에 동의하는 것으로 간주됩니다.{"\n\n"}본 개인정보
          처리방침은 2025년 11월 3일부터 유효합니다.
        </Article>

        <Article title="동의">
          본 애플리케이션을 사용함으로써 귀하는 본 개인정보 처리방침에 명시된
          현재 및 당사가 개정한 대로 귀하의 정보 처리에 동의하는 것입니다.
        </Article>

        <Article title="문의하기">
          본 애플리케이션 사용 중 개인정보 처리와 관련하여 궁금한 점이 있거나
          처리 방식에 대한 문의 사항이 있으시면 bomur0522@gmail.com으로 이메일을
          보내 서비스 제공업체에 문의하십시오.
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
