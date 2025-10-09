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

const FriendStock: React.FC<{}> = () => {
  const { followingUsers, changeSelectedFollowId } = useFollow();
  const { friendStockData } = useStock();
  const { today } = useCalendar();

  // 상태 초기화
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 데이터가 로딩되지 않은 경우 로딩 상태를 활성화
    if (!friendStockData || !followingUsers.length) {
      setIsLoading(true);
      return;
    }

    // 데이터가 로드되면 friends 배열을 생성
    const loadedFriends = followingUsers.map((user) => {
      const stockData = friendStockData?.[user!.uid]?.[today];
      return {
        name: user!.name || "Unknown",
        price: user!.price || 0, // 임의의 금액
        percentage: stockData ? stockData.changeRate : 0,
        avatarColor: "#E8E8E8", // 기본 색상
        changePrice: stockData ? stockData.changePrice : 0,
        uid: user?.uid || "",
      };
    });

    // 로드된 친구 리스트 설정
    setFriends(loadedFriends);
    setIsLoading(false);
  }, [friendStockData, followingUsers, today]); // friendStockData, followingUsers, today가 변경될 때마다 실행

  // 로딩 중이면 로딩 스피너 표시
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {friends.map((friend, index) => (
          <TouchableOpacity
            key={index}
            style={styles.friendItem}
            onPress={() => changeSelectedFollowId(friend.uid)}
          >
            <View style={styles.leftSection}>
              <View
                style={[styles.avatar, { backgroundColor: friend.avatarColor }]}
              ></View>
              <Typo style={styles.name}>{friend.name}</Typo>
            </View>

            <View style={styles.rightSection}>
              <Typo style={styles.price}>$ {friend.price}</Typo>
              <Typo
                color={
                  friend.changePrice > 0
                    ? colors.red100
                    : friend.changePrice === 0
                    ? colors.neutral500
                    : colors.blue100
                }
                style={styles.percentage}
              >
                {friend.changePrice > 0
                  ? "▲"
                  : friend.changePrice === 0
                  ? "-"
                  : "▼"}{" "}
                {friend.percentage ? friend.percentage : 0}%
              </Typo>
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
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._12,
    marginHorizontal: spacingX._25,
    borderBottomWidth: 2,
    borderBottomColor: colors.sub,
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
  },
  name: {
    fontSize: verticalScale(24),
    fontWeight: "600",
    color: colors.text,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: spacingY._5,
  },
  price: {
    fontSize: verticalScale(22),
    fontWeight: "700",
    color: colors.text,
  },
  percentage: {
    fontSize: verticalScale(18),
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
});

export default FriendStock;
