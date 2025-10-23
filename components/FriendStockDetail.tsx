import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import UserProfile from "@/components/UserProfile";
import FriendStock from "@/components/FriendStock";
import Typo from "@/components/Typo";
import { useState, useEffect } from "react";
import { useStock } from "@/contexts/stockContext";
import NewsDetail from "@/components/NewsDetail";
import YearHeader from "@/components/YearHeader";
import { verticalScale } from "@/utils/styling";
import { Ionicons } from "@expo/vector-icons";
import { useFollow } from "@/contexts/followContext";
import { spacingY, spacingX, radius } from "../constants/theme";
import { colors } from "../constants/theme";
import FollowingProfile from "./FollowingProfile";
import { useTheme } from "@/contexts/themeContext";
import { useNews } from "@/contexts/newsContext";
import { useCalendar } from "@/contexts/calendarContext";

const FriendStockDetail = ({
  followId,
  onBack,
}: {
  followId: string;
  onBack: () => void;
}) => {
  const { theme } = useTheme();
  const { friendStockData, friendStockSummaries, loadFriendStockSummary } =
    useStock();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { today } = useCalendar();

  // 🔥 친구의 Summary 데이터 로드
  useEffect(() => {
    if (followId) {
      console.log("Loading friend stock summary for:", followId);
      loadFriendStockSummary(followId);
    }
  }, [followId]);

  if (!friendStockData || !friendStockData[followId]) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Typo color={theme.text}>No stock data available</Typo>
      </View>
    );
  }

  const stockSummary = friendStockSummaries[followId];
  const friendStockByDate = friendStockData[followId];

  const handleNewsPress = (item: any) => {
    setSelectedItem(item);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  // 현재가 위치 계산 함수
  const calculatePosition = (current: number, low: number, high: number) => {
    if (high === low) return 50; // 최고가와 최저가가 같으면 중앙
    const percentage = ((current - low) / (high - low)) * 100;
    return Math.min(Math.max(percentage, 0), 100); // 0-100% 사이로 제한
  };

  if (selectedItem) {
    return <NewsDetail item={selectedItem} onBack={handleBack} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.neutral200,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Typo size={18} fontWeight={"600"} color={theme.text}>
          친구 주식 상세
        </Typo>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
      >
        <FollowingProfile />
        <CustomChart stockData={friendStockByDate} />

        {/* Summary 데이터가 로드될 때까지 로딩 표시 */}
        {!stockSummary ? (
          <View
            style={[styles.section, { backgroundColor: theme.cardBackground }]}
          >
            <Typo color={theme.sub}>시세 정보를 불러오는 중...</Typo>
          </View>
        ) : (
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
                  {friendStockByDate[today]?.open?.toLocaleString() ?? "0"}원
                </Typo>
              </View>
              <View style={styles.infoItem}>
                <Typo size={13} color={theme.sub}>
                  종가가
                </Typo>
                <Typo size={16} fontWeight="medium" color={theme.text}>
                  {friendStockByDate[today]?.close?.toLocaleString() ?? "0"}원
                </Typo>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._30,
    gap: spacingX._15,
    borderBottomWidth: 1,
  },
  newsTime: {
    fontSize: verticalScale(18),
  },
  newsTitle: {
    flex: 1,
    fontSize: verticalScale(20),
    lineHeight: verticalScale(22),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacingX._5,
  },
  summarySection: {
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

export default FriendStockDetail;
