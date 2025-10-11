import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { colors, radius, spacingX, spacingY } from "../../constants/theme";
import { ScrollView } from "react-native-gesture-handler";
import YearHeader from "../../components/YearHeader";
import Typo from "../../components/Typo";
import { verticalScale } from "@/utils/styling";
import { useCalendar } from "@/contexts/calendarContext";
import { useNews } from "@/contexts/newsContext";
import NewsDetail from "@/components/NewsDetail";
import { useState, useEffect } from "react";
import { useStock } from "@/contexts/stockContext";
import Profile from "@/components/Profile";

const news = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const { myNews, loadMyNews, selectNews, selectedNews } = useNews();
  const { loadAllStocks } = useStock();
  const handleNewsPress = (item: any) => {
    selectNews(item);
  };

  const handleBack = () => {
    selectNews(null);
  };

  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }
  useEffect(() => {
    loadAllStocks();
    loadMyNews(selectedYear);
  }, [selectedYear]);
  return (
    <View style={styles.container}>
      <Profile type="news" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <YearHeader year={selectedYear.toString()} />

          {myNews.map((item, index) => (
            <TouchableOpacity
              key={`news-${item.id}`}
              style={styles.newsItem}
              onPress={() => handleNewsPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.newsContent}>
                <Typo size={14} fontWeight="500" style={styles.newsTime}>
                  {item.date}
                </Typo>
                <Typo size={16} fontWeight="600" style={styles.newsTitle}>
                  {item.title}
                </Typo>
              </View>
            </TouchableOpacity>
          ))}

          {myNews.length === 0 && (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <Typo color={colors.neutral400} size={15}>
                아직 뉴스가 없습니다
              </Typo>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default news;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  section: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._12,
  },
  newsItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
    marginVertical: spacingY._7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  newsContent: {
    gap: spacingY._7,
  },
  newsTime: {
    color: colors.neutral400,
    letterSpacing: -0.2,
  },
  newsTitle: {
    color: colors.black,
    lineHeight: verticalScale(20),
    letterSpacing: -0.3,
  },
});
