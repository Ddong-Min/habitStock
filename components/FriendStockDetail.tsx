import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import Profile from "@/components/Profile";
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

const FriendStockDetail = ({
  followId,
  onBack,
}: {
  followId: string;
  onBack: () => void;
}) => {
  const { theme } = useTheme();
  const {
    selectedPeriod,
    changeSelectedPeriod,
    stockTabType,
    friendStockData,
  } = useStock();
  const { loadDetailFriendInfo, selectedFollowId } = useFollow();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { followingNews } = useNews();
  if (!friendStockData) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Typo color={theme.text}>No stock data available</Typo>
      </View>
    );
  }

  useEffect(() => {
    loadDetailFriendInfo();
  }, [selectedFollowId]);

  const handleNewsPress = (item: any) => {
    setSelectedItem(item);
  };

  const handleBack = () => {
    setSelectedItem(null);
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
        <CustomChart stockData={friendStockData[followId]} />
        <View style={styles.section}>
          <YearHeader year={(2025).toString()} />
          {followingNews.map((item, index) => (
            <TouchableOpacity
              key={`2022-${index}`}
              style={[styles.newsItem, { borderBottomColor: theme.neutral200 }]}
              onPress={() => handleNewsPress(item)}
              activeOpacity={0.7}
            >
              <Typo
                size={18}
                fontWeight="600"
                style={styles.newsTime}
                color={theme.textLight}
              >
                {item.date}
              </Typo>
              <Typo
                size={20}
                fontWeight="600"
                style={styles.newsTitle}
                color={theme.text}
              >
                {item.title}
              </Typo>
            </TouchableOpacity>
          ))}
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
});

export default FriendStockDetail;
