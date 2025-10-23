import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import UserProfile from "@/components/UserProfile";
import Typo from "@/components/Typo";
import { useStock } from "@/contexts/stockContext";
import { useFollow } from "@/contexts/followContext";
import { useTheme } from "@/contexts/themeContext";
import { useCalendar } from "@/contexts/calendarContext";

const Stock = () => {
  const { theme } = useTheme();
  const { stockData, stockTabType, stockSummary } = useStock();
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
      <UserProfile type={stockTabType} />
      <CustomChart stockData={stockData} />

      {/* 시세 섹션 */}
      {stockSummary && (
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.sectionHeader}>
            <Typo size={18} fontWeight="bold" color={theme.text}>
              시세
            </Typo>
          </View>

          {/* 최근 7일 */}
          <View style={styles.rangeContainer}>
            <View
              style={[styles.rangeBar, { backgroundColor: theme.neutral100 }]}
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
                <Typo size={13} color={theme.sub}>
                  7일 최저가
                </Typo>
                <Typo size={15} fontWeight="medium" color={theme.text}>
                  {stockSummary.recent7Days.low.toLocaleString()}원
                </Typo>
              </View>
              <View style={styles.rangeItem}>
                <Typo size={13} color={theme.sub}>
                  7일 최고가
                </Typo>
                <Typo size={15} fontWeight="medium" color={theme.text}>
                  {stockSummary.recent7Days.high.toLocaleString()}원
                </Typo>
              </View>
            </View>
          </View>

          {/* 전체 기간 */}
          <View style={styles.rangeContainer}>
            <View
              style={[styles.rangeBar, { backgroundColor: theme.neutral100 }]}
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
                <Typo size={13} color={theme.sub}>
                  전체 최저가
                </Typo>
                <Typo size={15} fontWeight="medium" color={theme.text}>
                  {stockSummary.allTime.low.toLocaleString()}원
                </Typo>
              </View>
              <View style={styles.rangeItem}>
                <Typo size={13} color={theme.sub}>
                  전체 최고가
                </Typo>
                <Typo size={15} fontWeight="medium" color={theme.text}>
                  {stockSummary.allTime.high.toLocaleString()}원
                </Typo>
              </View>
            </View>
          </View>

          {/* 현재가 & 거래량 */}
          <View
            style={[
              styles.infoGrid,
              { borderTopWidth: 1, borderTopColor: theme.neutral200 },
            ]}
          >
            <View style={styles.infoItem}>
              <Typo size={13} color={theme.sub}>
                현재가
              </Typo>
              <Typo size={16} fontWeight="medium" color={theme.text}>
                {stockSummary.allTime.current.toLocaleString()}원
              </Typo>
            </View>
            <View style={styles.infoItem}>
              <Typo size={13} color={theme.sub}>
                최대 거래량
              </Typo>
              <Typo size={16} fontWeight="medium" color={theme.text}>
                {stockSummary.maxVolume.volume.toLocaleString()}주
              </Typo>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Typo size={13} color={theme.sub}>
                시작가
              </Typo>
              <Typo size={16} fontWeight="medium" color={theme.text}>
                {stockData[today].open.toLocaleString()}원
              </Typo>
            </View>
            <View style={styles.infoItem}>
              <Typo size={13} color={theme.sub}>
                종가가
              </Typo>
              <Typo size={16} fontWeight="medium" color={theme.text}>
                {stockData[today].close.toLocaleString()}원
              </Typo>
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
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rangeContainer: {
    marginBottom: 20,
  },
  rangeBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    position: "relative",
  },
  rangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    top: -3,
    marginLeft: -6, // 중앙 정렬을 위해 추가
  },
  rangeTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeItem: {
    gap: 4,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  infoItem: {
    flex: 1,
    gap: 8,
  },
});

export default Stock;
