import { StyleSheet, Text, TextStyle, View } from "react-native";
import React from "react";
import { colors } from "@/constants/theme";
import { TypoProps } from "@/types";
import { verticalScale } from "@/utils/styling";

const Typo = ({
  size,
  color = colors.text,
  fontWeight = "400", // 기본값을 '400' (Regular)으로 설정
  children,
  style,
  textProps = {},
}: TypoProps) => {
  // fontWeight 값에 따라 적절한 폰트 패밀리 이름을 매핑합니다.
  const getFontFamily = () => {
    switch (fontWeight) {
      case "300":
        return "Outfit-Light";
      case "400":
        return "Outfit-Regular";
      case "500":
        return "Outfit-Medium";
      case "600":
        return "Outfit-SemiBold";
      case "700":
        return "Outfit-Bold";
      case "800":
        return "Outfit-ExtraBold";
      case "900":
        return "Outfit-Black";
      default:
        return "Outfit-Regular"; // 기본값
    }
  };

  const textStyle: TextStyle = {
    fontSize: size ? verticalScale(size) : verticalScale(16),
    color,
    // fontFamily를 동적으로 설정합니다.
    fontFamily: getFontFamily(),
    // fontWeight 속성은 여기서 제거해야 합니다!
  };

  return (
    <Text style={[textStyle, style]} {...textProps}>
      {children}
    </Text>
  );
};

export default Typo;
