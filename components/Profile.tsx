import React from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useAuth } from "@/contexts/authContext";
import { useStock } from "@/contexts/stockContext";
import { useCalendar } from "@/contexts/calendarContext";
interface ProfileProps {
  type: "todo" | "stock" | "news";
}

const Profile: React.FC<ProfileProps> = ({ type }) => {
  const { user } = useAuth();
  const { stockData } = useStock();
  const { today } = useCalendar();
  const todayStock = stockData?.[today];
  const isPositive = (todayStock?.changePrice ?? 0) > 0;
  const isZero = (todayStock?.changePrice ?? 0) === 0;
  const changeColor = isPositive
    ? colors.red100
    : isZero
    ? colors.neutral500
    : colors.blue100;

  return (
    <View
      style={[
        styles.container,
        (type === "stock" || type === "news") && {
          borderRadius: radius._10,
          borderWidth: 1,
          borderColor: colors.blue25,
          paddingBottom: spacingY._10,
        },
      ]}
    >
      <Image
        source={require("../assets/images/tempProfile.png")}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Typo
          size={type === "news" ? 28 : 22}
          fontWeight="bold"
          style={{ lineHeight: verticalScale(24) }}
        >
          {user!.name}
        </Typo>
        {type !== "news" && (
          <View style={styles.stockInfo}>
            <Typo size={22} fontWeight="bold" style={{ marginRight: 8 }}>
              ₩{user!.price!}
            </Typo>

            {type === "stock" && (
              <Typo size={16} color={colors.neutral400} fontWeight={"500"}>
                어제보다{" "}
              </Typo>
            )}

            <Typo size={18} style={{ color: changeColor }}>
              {isPositive ? "▲" : isZero ? "-" : "▼"} {todayStock?.changePrice}{" "}
              ({todayStock?.changeRate}%)
            </Typo>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacingY._10,
    paddingLeft: spacingX._20,
    backgroundColor: colors.white,
    marginHorizontal: spacingX._10,
  },
  avatar: {
    width: spacingX._50,
    height: spacingX._50,
    borderRadius: radius._30,
    marginRight: spacingX._15,
  },
  userInfo: {
    flex: 1,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});

export default Profile;
