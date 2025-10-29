import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import UserProfile from "@/components/UserProfile";
import Typo from "@/components/Typo";
import { useStock } from "@/contexts/stockContext";
import { useFollow } from "@/contexts/followContext";
import { useTheme } from "@/contexts/themeContext";
import { useCalendar } from "@/contexts/calendarContext";
import { radius, spacingX, spacingY } from "@/constants/theme";

const Stock = () => {
  const { theme } = useTheme();
  const { stockData, stockSummary } = useStock();
  const { today } = useCalendar();
  const { selectedFollowId, changeSelectedFollowId } = useFollow();

  // 현재가 위치 계산 함수
  const calculatePosition = (current: number, low: number, high: number) => {
    if (high === low) return 50; // 최고가와 최저가가 같으면 중앙
    const percentage = ((current - low) / (high - low)) * 100;
    return Math.min(Math.max(percentage, 0), 100); // 0-100% 사이로 제한
  };

  if (!stockData) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Typo color={theme.text}>No stock data available</Typo>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <UserProfile />
      <CustomChart stockData={stockData} />

      {/* 시세 섹션 */}
      {stockSummary && (
        <View style={styles.sectionContainer}>
          <View
            style={[styles.section, { backgroundColor: theme.cardBackground }]}
          >
            <View style={styles.sectionHeader}>
              <Typo size={18} fontWeight="bold" color={theme.text}>
                시세
              </Typo>
            </View>

            {/* 최근 7일 */}
            <View style={styles.subsection}>
              <Typo
                size={15}
                fontWeight="semibold"
                color={theme.text}
                style={styles.subsectionTitle}
              >
                최근 7일
              </Typo>
              <View style={styles.rangeContainer}>
                <View
                  style={[
                    styles.rangeBar,
                    { backgroundColor: theme.neutral100 },
                  ]}
                >
                  <View
                    style={[
                      styles.rangeDot,
                      {
                        backgroundColor: theme.neutral400,
                        left: `${calculatePosition(
                          stockSummary.recent7Days.current,
                          stockSummary.recent7Days.low,
                          stockSummary.recent7Days.high
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.rangeTextContainer}>
                  <View style={styles.rangeItem}>
                    <Typo size={13} color={theme.textLight}>
                      7일 최저가
                    </Typo>
                    <Typo size={15} fontWeight="semibold" color={theme.text}>
                      {stockSummary.recent7Days.low.toLocaleString()}원
                    </Typo>
                  </View>
                  <View style={styles.rangeItem}>
                    <Typo size={13} color={theme.textLight}>
                      7일 최고가
                    </Typo>
                    <Typo size={15} fontWeight="semibold" color={theme.text}>
                      {stockSummary.recent7Days.high.toLocaleString()}원
                    </Typo>
                  </View>
                </View>
              </View>
            </View>

            {/* 구분선 */}
            <View
              style={[styles.divider, { backgroundColor: theme.neutral200 }]}
            />

            {/* 전체 기간 */}
            <View style={styles.subsection}>
              <Typo
                size={15}
                fontWeight="semibold"
                color={theme.text}
                style={styles.subsectionTitle}
              >
                전체 기간
              </Typo>
              <View style={styles.rangeContainer}>
                <View
                  style={[
                    styles.rangeBar,
                    { backgroundColor: theme.neutral100 },
                  ]}
                >
                  <View
                    style={[
                      styles.rangeDot,
                      {
                        backgroundColor: theme.neutral400,
                        left: `${calculatePosition(
                          stockSummary.allTime.current,
                          stockSummary.allTime.low,
                          stockSummary.allTime.high
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.rangeTextContainer}>
                  <View style={styles.rangeItem}>
                    <Typo size={13} color={theme.textLight}>
                      전체 최저가
                    </Typo>
                    <Typo size={15} fontWeight="semibold" color={theme.text}>
                      {stockSummary.allTime.low.toLocaleString()}원
                    </Typo>
                  </View>
                  <View style={styles.rangeItem}>
                    <Typo size={13} color={theme.textLight}>
                      전체 최고가
                    </Typo>
                    <Typo size={15} fontWeight="semibold" color={theme.text}>
                      {stockSummary.allTime.high.toLocaleString()}원
                    </Typo>
                  </View>
                </View>
              </View>
            </View>

            {/* 구분선 */}
            <View
              style={[styles.divider, { backgroundColor: theme.neutral200 }]}
            />

            {/* 상세 정보 */}
            <View style={styles.subsection}>
              <Typo
                size={15}
                fontWeight="bold"
                color={theme.text}
                style={styles.subsectionTitle}
              >
                상세 정보
              </Typo>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Typo size={13} color={theme.textLight}>
                    현재가
                  </Typo>
                  <Typo size={16} fontWeight="semibold" color={theme.text}>
                    {stockSummary.allTime.current.toLocaleString()}원
                  </Typo>
                </View>
                <View style={styles.infoItem}>
                  <Typo size={13} color={theme.textLight}>
                    최대 거래량
                  </Typo>
                  <Typo size={16} fontWeight="semibold" color={theme.text}>
                    {stockSummary.maxVolume.volume.toLocaleString()}주
                  </Typo>
                </View>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Typo size={13} color={theme.textLight}>
                    시작가
                  </Typo>
                  <Typo size={16} fontWeight="semibold" color={theme.text}>
                    {stockData[today].open.toLocaleString()}원
                  </Typo>
                </View>
                <View style={styles.infoItem}>
                  <Typo size={13} color={theme.textLight}>
                    종가
                  </Typo>
                  <Typo size={16} fontWeight="semibold" color={theme.text}>
                    {stockData[today].close.toLocaleString()}원
                  </Typo>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionContainer: {
    marginHorizontal: spacingX._12,
    marginTop: spacingY._10,
    marginBottom: spacingY._20,
  },
  section: {
    padding: spacingX._20,
    borderRadius: radius._15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._15,
  },
  subsection: {
    marginBottom: spacingY._3,
  },
  subsectionTitle: {
    marginBottom: spacingY._15,
  },
  divider: {
    height: 1,
    marginVertical: spacingY._15,
  },
  rangeContainer: {
    marginBottom: 0,
  },
  rangeBar: {
    height: spacingY._8,
    borderRadius: radius._3,
    marginBottom: spacingY._10,
    position: "relative",
  },
  rangeDot: {
    width: spacingX._10,
    height: spacingX._10,
    borderRadius: radius._100,
    position: "absolute",
    top: -spacingX._3,
    marginLeft: -spacingX._6, // 중앙 정렬을 위해 추가
  },
  rangeTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeItem: {
    gap: spacingY._3,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacingY._10,
  },
  infoItem: {
    flex: 1,
    gap: spacingY._8,
  },
});

export default Stock;
