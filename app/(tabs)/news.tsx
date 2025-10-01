import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Profile from "@/components/Profile";
import { spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";
import { router } from "expo-router";
import NewsDetail from "@/components/NewsDetail";
import YearHeader from "@/components/YearHeader";
const News = () => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const newsItems2022 = [
    {
      date: "06-30",
      title: "할일 3일 연속 완료!, 3% 상승중",
      content:
        "오늘도 할일을 모두 완료했습니다. 3일 연속 완료로 생산성이 크게 향상되었습니다. 주가는 3% 상승했으며, 투자자들의 관심이 높아지고 있습니다.",
      fullDate: "2022-06-30",
    },
    {
      date: "06-29",
      title: "토익 700점 달성!, 5% 급등",
      content:
        "목표했던 토익 700점을 달성했습니다. 6개월간의 노력이 결실을 맺었으며, 이는 자기계발에 대한 강한 의지를 보여줍니다. 주가는 5% 급등했습니다.",
      fullDate: "2022-06-29",
    },
    {
      date: "06-28",
      title: "운동 5일 연속 완료!, 2% 상승",
      content:
        "5일 연속 운동을 완료하며 건강 관리에 대한 꾸준함을 입증했습니다. 규칙적인 운동 습관이 형성되고 있으며, 주가는 2% 상승했습니다.",
      fullDate: "2022-06-28",
    },
    {
      date: "06-27",
      title: "독서 10권 완료!, 4% 상승",
      content:
        "올해 목표였던 독서 10권을 달성했습니다. 다양한 분야의 책을 읽으며 지식의 폭을 넓혔고, 이는 개인 성장에 큰 도움이 되었습니다. 주가는 4% 상승했습니다.",
      fullDate: "2022-06-27",
    },
    {
      date: "06-26",
      title: "할일 7일 연속 완료!, 3% 상승",
      content:
        "일주일 연속 할일을 완료하며 최고의 생산성을 기록했습니다. 지속적인 성과로 신뢰도가 높아지고 있으며, 주가는 3% 상승했습니다.",
      fullDate: "2022-06-26",
    },
    {
      date: "06-25",
      title: "운동 3일 연속 완료!, 2% 상승",
      content:
        "3일 연속 운동을 완료하며 건강 관리에 힘쓰고 있습니다. 꾸준한 운동으로 체력이 향상되고 있으며, 주가는 2% 상승했습니다.",
      fullDate: "2022-06-25",
    },
    {
      date: "06-24",
      title: "독서 5권 완료!, 4% 상승",
      content:
        "독서 5권을 완료하며 연간 목표의 절반을 달성했습니다. 다양한 인사이트를 얻었으며, 주가는 4% 상승했습니다.",
      fullDate: "2022-06-24",
    },
    {
      date: "06-23",
      title: "할일 5일 연속 완료!, 3% 상승",
      content:
        "5일 연속 할일 완료로 안정적인 성과를 유지하고 있습니다. 주가는 3% 상승했습니다.",
      fullDate: "2022-06-23",
    },
    {
      date: "06-22",
      title: "운동 2일 연속 완료!, 2% 상승",
      content:
        "2일 연속 운동을 완료하며 꾸준한 건강 관리를 이어가고 있습니다. 주가는 2% 상승했습니다.",
      fullDate: "2022-06-22",
    },
    {
      date: "06-21",
      title: "독서 3권 완료!, 4% 상승",
      content:
        "독서 3권을 완료하며 지식 향상에 힘쓰고 있습니다. 주가는 4% 상승했습니다.",
      fullDate: "2022-06-21",
    },
    {
      date: "06-20",
      title: "할일 4일 연속 완료!, 3% 상승",
      content:
        "4일 연속 할일을 완료하며 높은 생산성을 유지하고 있습니다. 주가는 3% 상승했습니다.",
      fullDate: "2022-06-20",
    },
    {
      date: "06-19",
      title: "운동 1일 완료!, 2% 상승",
      content:
        "운동을 완료하며 건강한 하루를 보냈습니다. 주가는 2% 상승했습니다.",
      fullDate: "2022-06-19",
    },
    {
      date: "06-18",
      title: "독서 1권 완료!, 4% 상승",
      content:
        "새로운 책을 완독하며 지식을 쌓았습니다. 주가는 4% 상승했습니다.",
      fullDate: "2022-06-18",
    },
  ];
  // 뉴스 아이템 클릭 → 상세 페이지 진입
  const handleNewsPress = (item: any) => {
    setSelectedItem(item);
  };

  // 상세화면 뒤로가기
  const handleBack = () => {
    setSelectedItem(null);
  };

  // ✅ 선택된 아이템 있으면 상세 화면 보여주기
  if (selectedItem) {
    return <NewsDetail item={selectedItem} onBack={handleBack} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Profile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
        type="news"
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <YearHeader year={(2025).toString()} />

          {newsItems2022.map((item, index) => (
            <TouchableOpacity
              key={`2022-${index}`}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

export default News;
