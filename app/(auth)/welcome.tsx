import {StyleSheet, Image, TouchableOpacity, View } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Button from "@/components/Button";

const Welcome = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View>
          <Image
            source={require("../../assets/images/habitStockLogo.png")}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button color={colors.blue75}>
            <Typo size={22} fontWeight={"600"}>로그인</Typo>
          </Button>
          <Button color={colors.red75}>
            <Typo size={22} fontWeight={"600"}>회원가입</Typo>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacingY._7,
  },
  welcomeImage: {
    width: "100%",
    height: verticalScale(280),
    alignSelf: "center",
    marginTop: verticalScale(130),
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: spacingX._25,
    gap: spacingY._15,
    marginBottom: spacingY._70,
  },
});
