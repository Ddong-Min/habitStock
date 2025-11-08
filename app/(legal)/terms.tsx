// 파일 위치: app/(legal)/terms.tsx

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
        <Typo size={14} color={colors.textLight} style={{ marginBottom: 20 }}>
          본 이용 약관은 Ddongmin(이하 "서비스 제공자")이 광고 지원 서비스로
          제작한 모바일 기기용 todoStock 앱(이하 "애플리케이션")에 적용됩니다.
          {"\n\n"}
          애플리케이션을 다운로드하거나 이용하시면 자동으로 다음 약관에 동의하는
          것으로 간주됩니다. 애플리케이션을 사용하기 전에 본 약관을 자세히 읽고
          이해하시기 바랍니다.
        </Typo>

        <Article title="지적 재산권">
          애플리케이션, 애플리케이션의 일부 또는 당사의 상표를 무단으로 복사,
          수정하는 것은 엄격히 금지됩니다. 애플리케이션의 소스 코드를
          추출하거나, 애플리케이션을 다른 언어로 번역하거나, 파생 버전을 만드는
          행위는 허용되지 않습니다. 애플리케이션과 관련된 모든 상표, 저작권,
          데이터베이스 권리 및 기타 지적 재산권은 서비스 제공자의 재산입니다.
        </Article>

        <Article title="서비스 제공 및 수정">
          서비스 제공자는 애플리케이션이 최대한 유익하고 효율적으로 작동하도록
          최선을 다합니다. 따라서 서비스 제공자는 언제든지 어떤 이유로든
          애플리케이션을 수정하거나 서비스 요금을 부과할 권리를 보유합니다.
          서비스 제공업체는 애플리케이션 또는 서비스 이용료를 명확하게 안내해
          드립니다.
        </Article>

        <Article title="개인정보 보호 및 보안">
          애플리케이션은 서비스 제공을 위해 서비스 제공업체에 제공하신
          개인정보를 저장하고 처리합니다. 휴대폰의 보안을 유지하고
          애플리케이션에 접근하는 것은 귀하의 책임입니다. 서비스 제공업체는
          휴대폰의 탈옥 또는 루팅을 강력히 권장하지 않습니다. 탈옥 또는 루팅은
          기기의 공식 운영 체제에서 적용되는 소프트웨어 제한 및 제약을 제거하는
          것을 의미합니다. 이러한 행위는 휴대폰을 맬웨어, 바이러스, 악성
          프로그램에 노출시키고 휴대폰의 보안 기능을 손상시킬 수 있으며,
          애플리케이션이 제대로 작동하지 않거나 전혀 작동하지 않을 수 있습니다.
        </Article>

        <Article title="제3자 서비스">
          본 애플리케이션은 자체 이용 약관이 있는 타사 서비스를 이용하고
          있습니다. 애플리케이션에서 사용하는 타사 서비스 제공업체의 이용 약관
          링크는 다음과 같습니다.{"\n\n"}- Google Play 서비스{"\n"}- AdMob{"\n"}
          - Firebase용 Google 애널리틱스{"\n"}- Firebase Crashlytics
        </Article>

        <Article title="서비스 제공자의 책임 제한">
          서비스 제공업체는 특정 측면에 대해 책임을 지지 않습니다.
          애플리케이션의 일부 기능은 Wi-Fi 또는 모바일 네트워크 제공업체에서
          제공하는 활성 인터넷 연결이 필요합니다. Wi-Fi에 접속할 수 없거나
          데이터 허용량을 모두 소진하여 애플리케이션이 최대 용량으로 작동하지
          않는 경우, 서비스 제공업체는 책임을 지지 않습니다.{"\n\n"}
          Wi-Fi 지역 외부에서 애플리케이션을 사용하는 경우에도 모바일 네트워크
          제공업체의 계약 약관이 적용됩니다. 따라서 애플리케이션 연결 중
          이동통신사로부터 데이터 사용료 또는 기타 제3자 요금이 부과될 수
          있습니다. 애플리케이션을 사용함으로써 귀하는 데이터 로밍을
          비활성화하지 않고 거주 지역(예: 지역 또는 국가) 외부에서
          애플리케이션을 사용하는 경우 로밍 데이터 요금을 포함한 모든 요금에
          대한 책임을 지는 데 동의합니다. 애플리케이션을 사용하는 기기의 요금
          납부자가 아닌 경우, 서비스 제공자는 귀하가 요금 납부자의 허가를 받은
          것으로 간주합니다.{"\n\n"}
          마찬가지로, 서비스 제공자는 귀하의 애플리케이션 사용에 대해 항상
          책임을 지는 것은 아닙니다. 예를 들어, 기기의 충전 상태를 유지하는 것은
          귀하의 책임입니다. 기기의 배터리가 방전되어 서비스에 액세스할 수 없는
          경우, 서비스 제공자는 책임을 지지 않습니다.{"\n\n"}
          서비스 제공자는 귀하의 애플리케이션 사용에 대한 책임을 져야 합니다.
          서비스 제공자는 애플리케이션의 최신 상태와 정확성을 유지하기 위해
          최선을 다하지만, 귀하에게 정보를 제공하기 위해 제3자의 정보 제공에
          의존하고 있다는 점에 유의해야 합니다. 서비스 제공자는 사용자가
          애플리케이션의 기능에 전적으로 의존하여 발생하는 직접적 또는 간접적
          손실에 대해 어떠한 책임도 지지 않습니다.
        </Article>

        <Article title="가상 주식 및 게임 요소에 대한 안내 (중요)">
          본 애플리케이션(todoStock)에서 제공되는 '주식', '주가', '차트',
          '시가총액' 등의 모든 수치는 사용자의 할 일 수행 및 습관 달성도를
          기반으로 생성된 가상의 게임 요소(Gamification)입니다. 이는 실제 금융
          상품, 화폐 가치, 또는 투자 수익과 아무런 관련이 없습니다.{"\n\n"}
          서비스 제공자는 본 애플리케이션에서 제공되는 정보를 실제 금융 투자
          판단의 근거로 사용함으로써 발생하는 어떠한 손실이나 피해에 대해서도
          책임을 지지 않습니다. 또한 본 애플리케이션은 금융 투자 자문 서비스가
          아니며, 사용자의 자기계발 및 동기부여를 위한 엔터테인먼트 목적의
          서비스임을 명확히 합니다.
        </Article>

        <Article title="애플리케이션 업데이트 및 종료">
          서비스 제공업체는 언젠가 애플리케이션을 업데이트할 수 있습니다.
          애플리케이션은 현재 운영 체제(및 서비스 제공업체가 애플리케이션 제공을
          연장하기로 결정한 추가 시스템) 요구 사항에 따라 제공되지만, 변경될 수
          있으며, 애플리케이션을 계속 사용하려면 업데이트를 다운로드해야 합니다.
          서비스 제공업체는 귀하에게 적합하거나 귀하의 기기에 설치된 특정 운영
          체제 버전과 호환되도록 애플리케이션을 항상 업데이트할 것을 보장하지
          않습니다. 그러나 귀하는 애플리케이션 업데이트가 제공되는 경우 항상
          수락하는 데 동의합니다.{"\n\n"}
          서비스 제공업체는 또한 애플리케이션 제공을 중단할 수 있으며, 귀하에게
          해지 통지 없이 언제든지 애플리케이션 사용을 종료할 수 있습니다. 서비스
          제공업체가 달리 통지하지 않는 한, 해지 시 (a) 본 약관에서 귀하에게
          부여된 권리 및 라이선스는 종료됩니다. (b) 귀하는 애플리케이션 사용을
          중단하고 (필요한 경우) 기기에서 애플리케이션을 삭제해야 합니다.
        </Article>

        <Article title="본 이용 약관 변경">
          서비스 제공업체는 정기적으로 이용 약관을 업데이트할 수 있습니다.
          따라서 이 페이지를 정기적으로 검토하여 변경 사항을 확인하는 것이
          좋습니다. 서비스 제공업체는 이 페이지에 새로운 이용 약관을 게시하여
          변경 사항을 알려드립니다.{"\n\n"}이 이용 약관은 2025년 11월 3일부터
          적용됩니다.
        </Article>

        <Article title="문의하기">
          이 이용 약관에 대한 질문이나 제안 사항이 있으시면
          bomur0522@gmail.com으로 서비스 제공업체에 문의해 주세요.
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
