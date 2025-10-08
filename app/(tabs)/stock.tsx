import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import Profile from "@/components/Profile";
import FriendStock from "@/components/FriendStock";
import Typo from "@/components/Typo";
import { colors } from "../../constants/theme";
import { useState, useEffect } from "react";
import { spacingY, spacingX, radius } from "../../constants/theme";
import { useStock } from "@/contexts/stockContext";
import ToggleStockTab from "@/components/ToggleStockTab";
import NewsDetail from "@/components/NewsDetail";
import YearHeader from "@/components/YearHeader";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import FriendStockDetail from "@/components/FriendStockDetail";
import { useNews } from "@/contexts/newsContext";

const Stock = () => {
  const {
    stockData,
    loadAllStocks,
    selectedPeriod,
    changeSelectedPeriod,
    stockTabType,
  } = useStock();

  const { selectedFollowId, changeSelectedFollowId } = useFollow();

  const { myNews, loadMyNews, selectNews, selectedNews } = useNews();

  const [selectedYear, setSelectedYear] = useState(2025);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAllStocks();
    loadMyNews(selectedYear);
  }, [selectedYear]);

  if (!stockData) {
    return <Typo>No stock data available</Typo>;
  }

  const handleNewsPress = (item: any) => {
    selectNews(item);
  };

  const handleBack = () => {
    selectNews(null);
  };

  // 선택된 뉴스 상세 화면
  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }

  // 친구 주식 상세 화면
  if (selectedFollowId) {
    return (
      <FriendStockDetail
        followId={selectedFollowId}
        onBack={() => changeSelectedFollowId(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Profile type={stockTabType} />
      <ToggleStockTab />

      {stockTabType === "stocks" && (
        <>
          <CustomChart stockData={stockData} />
          <View style={styles.periodButtonContainer}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "day" && styles.periodButtonActive,
              ]}
              onPress={() => changeSelectedPeriod("day")}
            >
              <Typo
                color={selectedPeriod === "day" ? colors.white : colors.text}
              >
                일
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "week" && styles.periodButtonActive,
              ]}
              onPress={() => changeSelectedPeriod("week")}
            >
              <Typo
                color={selectedPeriod === "week" ? colors.white : colors.text}
              >
                주
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "month" && styles.periodButtonActive,
              ]}
              onPress={() => changeSelectedPeriod("month")}
            >
              <Typo
                color={selectedPeriod === "month" ? colors.white : colors.text}
              >
                월
              </Typo>
            </TouchableOpacity>
          </View>
          <FriendStock />
        </>
      )}

      {stockTabType === "news" && (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <YearHeader year={selectedYear.toString()} />

            {myNews.map((item, index) => (
              <TouchableOpacity
                key={`news-${item.id}`}
                style={styles.newsItem}
                onPress={() => handleNewsPress(item)}
              >
                <Typo size={18} fontWeight="600" style={styles.newsTime}>
                  {item.date}
                </Typo>
                <Typo size={20} fontWeight="600" style={styles.newsTitle}>
                  {item.title}
                </Typo>
              </TouchableOpacity>
            ))}

            {myNews.length === 0 && (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Typo color={colors.sub}>아직 뉴스가 없습니다</Typo>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  periodButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._25,
    gap: spacingX._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.sub,
  },
  periodButton: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._7,
    borderRadius: radius._10,
    backgroundColor: colors.neutral100,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: colors.blue100,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    borderBottomColor: "#E5E7EB",
  },
  newsTime: {
    fontSize: verticalScale(18),
    color: "#9CA3AF",
  },
  newsTitle: {
    flex: 1,
    fontSize: verticalScale(20),
    color: "#374151",
    lineHeight: verticalScale(22),
  },
});

export default Stock;
