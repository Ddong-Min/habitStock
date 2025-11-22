import { StyleSheet, Text, TextStyle, View } from "react-native";
import React from "react";
import { colors } from "@/constants/theme";
import { TypoProps } from "@/types";
import { scale } from "@/utils/styling";

const Typo = ({
  size,
  color = colors.text,
  fontWeight = "400",
  children,
  style,
  numberOfLines,
  textProps = {},
}: TypoProps) => {
  const textStyle: TextStyle = {
    fontSize: size ? scale(size) : scale(16),
    color,
    fontWeight,
  };
  return (
    <Text
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      {...textProps}
    >
      {children}
    </Text>
  );
};

export default Typo;

const styles = StyleSheet.create({});
