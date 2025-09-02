import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  TextStyle,
  ViewStyle,
} from "react-native";
import React from "react";
import { colors } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

const Input = ({ containerStyle, inputStyle, ...props }: InputProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={colors.textLighter}
        {...props}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    backgroundColor: colors.neutral100,
    paddingVertical: verticalScale(15),
    paddingHorizontal: verticalScale(20),
    borderRadius: 12,
    fontSize: verticalScale(16),
    fontFamily: "Outfit-Regular",
    color: colors.text,
  },
});
