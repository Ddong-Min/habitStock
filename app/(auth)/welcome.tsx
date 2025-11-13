import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Link, router } from "expo-router";
const Welcome = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View>
          <View>
            <Image
              source={require("../../assets/images/todoStockWelcome.png")}
              style={styles.welcomeImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.context}>
            <Typo size={18} fontWeight={"600"}>
              자신을 상장하고 주가를 상승시켜 보세요.
            </Typo>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => router.push("/(auth)/login")}
            color={colors.blue100}
          >
            <Typo size={20} fontWeight={"600"}>
              이미 계정이 있습니다
            </Typo>
          </Button>
          <Button
            onPress={() => router.push("/(auth)/register")}
            color={colors.red100}
          >
            <Typo size={20} fontWeight={"600"}>
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
    height: scale(260),
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
