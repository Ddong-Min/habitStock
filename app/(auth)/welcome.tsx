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
          <TouchableOpacity style={styles.loginButton}>
            <Typo fontWeight={"500"}>Sign in</Typo>
          </TouchableOpacity>
          <Image
            source={require("../../assets/images/habitStockLogo.png")}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button>
            <Typo>Login</Typo>
          </Button>
          <Button color="red">
            <Typo>register</Typo>
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
    height: verticalScale(250),
    alignSelf: "center",
    marginTop: verticalScale(100),
  },
  loginButton: {
    alignSelf: "flex-end",
    marginRight: spacingX._20,
  },

  buttonContainer: {
    width: "100%",
    paddingHorizontal: spacingX._25,
  },
});
