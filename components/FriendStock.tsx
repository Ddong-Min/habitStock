import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useFollow } from "@/contexts/followContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
import { useTheme } from "@/contexts/themeContext";

const FriendStock: React.FC<{}> = () => {
  const { theme } = useTheme();
  const { followingUsers, changeSelectedFollowId } = useFollow();
  const { friendStockData } = useStock();
  const { today } = useCalendar();

  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 2초 후에 로딩 상태 해제
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    if (!friendStockData || !followingUsers.length) {
      return () => clearTimeout(timer);
    }

    const loadedFriends = followingUsers.map((user) => {
      const stockData = friendStockData?.[user!.uid]?.[today];
      return {
        name: user!.name || "Unknown",
        price: user!.price || 0,
        percentage: stockData ? stockData.changeRate : 0,
        avatarColor: theme.neutral200,
        changePrice: stockData ? stockData.changePrice : 0,
        uid: user?.uid || "",
      };
    });

    setFriends(loadedFriends);
    clearTimeout(timer);
    setIsLoading(false);

    return () => clearTimeout(timer);
  }, [friendStockData, followingUsers, today, theme]);

  if (isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.blue100} />
      </View>
    );
  }

  // 팔로워가 없는 경우
  if (!friends.length) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: theme.background }]}
      >
        <View style={styles.emptyContent}>
          <Typo color={theme.textLight} style={styles.emptyIcon}>
            👥
          </Typo>
          <Typo color={theme.text} style={styles.emptyTitle}>
            팔로워가 없습니다
          </Typo>
          <Typo color={theme.textLight} style={styles.emptyDescription}>
            친구를 팔로우하고{"\n"}주가 변동을 확인해보세요
          </Typo>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {friends.map((friend, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.friendItem,
              { backgroundColor: theme.cardBackground },
            ]}
            onPress={() => changeSelectedFollowId(friend.uid)}
            activeOpacity={0.7}
          >
            <View style={styles.leftSection}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: friend.avatarColor,
                    borderColor: theme.neutral200,
                  },
                ]}
              />
              <Typo color={theme.text} style={styles.name}>
                {friend.name}
              </Typo>
            </View>

            <View style={styles.rightSection}>
              <Typo color={theme.text} style={styles.price}>
                ₩ {friend.price.toLocaleString()}
              </Typo>
              <View
                style={[
                  styles.changeBadge,
                  {
                    backgroundColor:
                      friend.changePrice > 0
                        ? `${theme.red100}20`
                        : friend.changePrice === 0
                        ? `${theme.textLight}20`
                        : `${theme.blue100}20`,
                  },
                ]}
              >
                <Typo
                  color={
                    friend.changePrice > 0
                      ? theme.red100
                      : friend.changePrice === 0
                      ? theme.textLight
                      : theme.blue100
                  }
                  style={styles.percentage}
                >
                  {friend.changePrice > 0
                    ? "▲"
                    : friend.changePrice === 0
                    ? ""
                    : "▼"}{" "}
                  {friend.percentage ? friend.percentage : 0}%
                </Typo>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    marginHorizontal: spacingX._10,
    marginVertical: spacingY._5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  avatar: {
    width: spacingX._40,
    height: spacingX._40,
    borderRadius: radius._30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  name: {
    fontSize: verticalScale(18),
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: spacingY._7,
  },
  price: {
    fontSize: verticalScale(17),
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  changeBadge: {
    paddingHorizontal: spacingX._7,
    paddingVertical: spacingY._3,
    borderRadius: 6,
  },
  percentage: {
    fontSize: verticalScale(14),
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContent: {
    alignItems: "center",
    paddingHorizontal: spacingX._40,
  },
  emptyIcon: {
    fontSize: verticalScale(64),
    marginBottom: spacingY._20,
  },
  emptyTitle: {
    fontSize: verticalScale(20),
    fontWeight: "700",
    marginBottom: spacingY._10,
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontSize: verticalScale(15),
    textAlign: "center",
    lineHeight: verticalScale(22),
    letterSpacing: -0.3,
  },
});

export default FriendStock;
