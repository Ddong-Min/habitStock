import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { colors, radius, spacingX, spacingY } from "../../constants/theme";
import { ScrollView } from "react-native-gesture-handler";
import YearHeader from "../../components/YearHeader";
import Typo from "../../components/Typo";
import { verticalScale } from "@/utils/styling";
import { useNews } from "@/contexts/newsContext";
import NewsDetail from "@/components/NewsDetail";
import Profile from "@/components/Profile";
import { useTheme } from "@/contexts/themeContext";

const news = () => {
  const { theme } = useTheme();
  const [selectedYear] = useState(2025);
  const { myNews, loadMyNews, selectNews, selectedNews } = useNews();

  // 모든 Hook을 최상단에 배치
  useEffect(() => {
    loadMyNews(selectedYear);
  }, [selectedYear]);

  const handleNewsPress = (item: any) => {
    selectNews(item);
  };

  const handleBack = () => {
    selectNews(null);
  };

  // Hook 호출 이후에 조건부 렌더링
  if (selectedNews) {
    return <NewsDetail item={selectedNews} onBack={handleBack} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        <Profile type="news" />
        <View style={styles.section}>
          <YearHeader year={selectedYear.toString()} />

          {myNews.map((item, index) => (
            <TouchableOpacity
              key={`news-${item.id}`}
              style={[
                styles.newsItem,
                { backgroundColor: theme.cardBackground },
              ]}
              onPress={() => handleNewsPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.newsContent}>
                <Typo
                  size={14}
                  fontWeight="500"
                  style={styles.newsTime}
                  color={theme.textLight}
                >
                  {item.date}
                </Typo>
                <Typo
                  size={16}
                  fontWeight="600"
                  style={styles.newsTitle}
                  color={theme.text}
                >
                  {item.title}
                </Typo>
              </View>
            </TouchableOpacity>
          ))}

          {myNews.length === 0 && (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <Typo color={theme.textLight} size={15}>
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
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._12,
  },
  newsItem: {
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
    letterSpacing: -0.2,
  },
  newsTitle: {
    lineHeight: verticalScale(20),
    letterSpacing: -0.3,
  },
});
