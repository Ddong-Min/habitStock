import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Button from "@/components/Button";
import Input from "@/components/Input";

const Welcome = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View>
          <View>
            <Image
              source={require("../../assets/images/habitStockLogo.png")}
              style={styles.welcomeImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.context}>
            <Typo size={22} fontWeight={"600"}>
              스스로를 상장하고{" "}
            </Typo>
            <Typo size={22} fontWeight={"600"}>
              주가를 상승시켜 보세요.
            </Typo>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button color={colors.blue75}>
            <Typo size={22} fontWeight={"600"}>
              이미 계정이 있습니다
            </Typo>
          </Button>
          <Button color={colors.red75}>
            <Typo size={22} fontWeight={"600"}>
              처음입니다
            </Typo>
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
  context: {
    width: "100%",
    alignItems: "center",
    marginTop: spacingY._15,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: spacingX._25,
    gap: spacingY._25,
    marginBottom: spacingY._100,
  },
});
