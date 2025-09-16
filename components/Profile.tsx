import React from "react";
import { View, StyleSheet, Image } from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";

interface ProfileProps {
  name: string;
  price: number;
  changeValue: number;
  changePercentage: number;
}

const Profile: React.FC<ProfileProps> = ({
  name,
  price,
  changeValue,
  changePercentage,
}) => {
  const isPositive = changeValue >= 0;
  const changeColor = isPositive ? colors.red100 : colors.blue100;

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/tempProfile.png")}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Typo size={24} fontWeight="bold">
          {name}
        </Typo>
        <View style={styles.stockInfo}>
          <Typo size={22} fontWeight="bold" style={{ marginRight: 8 }}>
            $ {price}
          </Typo>
          <Typo size={16} style={{ color: changeColor }}>
            {isPositive ? "▲" : "▼"} {changeValue} ({changePercentage}%)
          </Typo>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacingY._20,
    paddingLeft: spacingX._20,
    backgroundColor: colors.white,
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
