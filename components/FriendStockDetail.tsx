import CustomChart from "@/components/CustomChart";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import Typo from "@/components/Typo";
import { useState } from "react";
import { useStock } from "@/contexts/stockContext";
import NewsDetail from "@/components/NewsDetail";
import { verticalScale } from "@/utils/styling";
import { Ionicons } from "@expo/vector-icons";
import { spacingY, spacingX, radius } from "../constants/theme";
import FollowingProfile from "./FollowingProfile";
import { useTheme } from "@/contexts/themeContext";
import { useNews } from "@/contexts/newsContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useFollow } from "@/contexts/followContext";

const FriendStockDetail = ({
  followId,
  onBack,
}: {
  followId: string;
  onBack: () => void;
}) => {
  const { theme } = useTheme();
  const { friendStockData, friendStockSummaries } = useStock();
  const { toggleFollow, isFollowing } = useFollow();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { today } = useCalendar();
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  // followId 유효성 검증
  if (!followId || typeof followId !== "string") {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Typo color={theme.text}>잘못된 사용자 정보입니다</Typo>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 20 }}>
          <Typo color={theme.text}>돌아가기</Typo>
        </TouchableOpacity>
      </View>
    );
  }

  // today 유효성 검증
  if (!today || typeof today !== "string") {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Typo color={theme.text}>날짜 정보를 불러올 수 없습니다</Typo>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 20 }}>
          <Typo color={theme.text}>돌아가기</Typo>
        </TouchableOpacity>
      </View>
    );
  }

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

  const handleUnfollow = () => {
    Alert.alert("언팔로우", "이 사용자를 언팔로우 하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "언팔로우",
        style: "destructive",
        onPress: async () => {
          setIsUnfollowing(true);
          try {
            await toggleFollow(followId);
            // 언팔로우 성공 후 뒤로가기
            onBack();
          } catch (error) {
            console.error("언팔로우 실패:", error);
            Alert.alert("오류", "언팔로우에 실패했습니다.");
          } finally {
            setIsUnfollowing(false);
          }
        },
      },
    ]);
  };

  // 현재가 위치 계산 함수
  const calculatePosition = (current: number, low: number, high: number) => {
    if (high === low) return 50;
    const percentage = ((current - low) / (high - low)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
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
        <TouchableOpacity
          onPress={handleUnfollow}
          style={styles.unfollowButton}
          disabled={isUnfollowing}
        >
          <Ionicons name="person-remove-outline" size={22} color={"#EF4444"} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
      >
        <FollowingProfile followId={followId} />
        {friendStockByDate && Object.keys(friendStockByDate).length > 0 ? (
          <CustomChart stockData={friendStockByDate} />
        ) : (
          <View style={[styles.centerContainer, { paddingVertical: 40 }]}>
            <Typo color={theme.textLight}>차트 데이터를 불러오는 중...</Typo>
          </View>
        )}

        <View style={styles.sectionContainer}>
          {!stockSummary ? (
            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Typo color={theme.textLight}>시세 정보를 불러오는 중...</Typo>
            </View>
          ) : (
            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Typo size={16} fontWeight="bold" color={theme.text}>
                  시세
                </Typo>
              </View>

              <View style={styles.subsection}>
                <Typo
                  size={13}
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
                      <Typo size={13} fontWeight="semibold" color={theme.text}>
                        {stockSummary.recent7Days.low.toLocaleString()}원
                      </Typo>
                    </View>
                    <View style={styles.rangeItem}>
                      <Typo size={13} color={theme.textLight}>
                        7일 최고가
                      </Typo>
                      <Typo size={13} fontWeight="semibold" color={theme.text}>
                        {stockSummary.recent7Days.high.toLocaleString()}원
                      </Typo>
                    </View>
                  </View>
                </View>
              </View>

              <View
                style={[styles.divider, { backgroundColor: theme.neutral200 }]}
              />

              <View style={styles.subsection}>
                <Typo
                  size={13}
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
                      <Typo size={13} fontWeight="semibold" color={theme.text}>
                        {stockSummary.allTime.low.toLocaleString()}원
                      </Typo>
                    </View>
                    <View style={styles.rangeItem}>
                      <Typo size={13} color={theme.textLight}>
                        전체 최고가
                      </Typo>
                      <Typo size={13} fontWeight="semibold" color={theme.text}>
                        {stockSummary.allTime.high.toLocaleString()}원
                      </Typo>
                    </View>
                  </View>
                </View>
              </View>

              <View
                style={[styles.divider, { backgroundColor: theme.neutral200 }]}
              />

              <View style={styles.subsection}>
                <Typo
                  size={14}
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
                    <Typo size={13} fontWeight="semibold" color={theme.text}>
                      {stockSummary.allTime.current.toLocaleString()}원
                    </Typo>
                  </View>
                  <View style={styles.infoItem}>
                    <Typo size={13} color={theme.textLight}>
                      최대 거래량
                    </Typo>
                    <Typo size={13} fontWeight="semibold" color={theme.text}>
                      {stockSummary.maxVolume.volume.toLocaleString()}주
                    </Typo>
                  </View>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Typo size={13} color={theme.textLight}>
                      시작가
                    </Typo>
                    <Typo size={13} fontWeight="semibold" color={theme.text}>
                      {friendStockByDate[today]?.open?.toLocaleString() ?? "0"}
                      원
                    </Typo>
                  </View>
                  <View style={styles.infoItem}>
                    <Typo size={13} color={theme.textLight}>
                      종가
                    </Typo>
                    <Typo size={13} fontWeight="semibold" color={theme.text}>
                      {friendStockByDate[today]?.close?.toLocaleString() ?? "0"}
                      원
                    </Typo>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
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
  unfollowButton: {
    padding: spacingX._5,
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
    marginLeft: -spacingX._6,
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

export default FriendStockDetail;
