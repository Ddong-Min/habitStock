import React from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity, // [1. import 추가]
} from "react-native";
import { useTheme } from "@/contexts/themeContext";
import { verticalScale } from "@/utils/styling";
import { colors } from "@/constants/theme";
import { InputProps } from "@/types";

const Input: React.FC<InputProps> = ({
  icon,
  containerStyle,
  inputStyle,
  inputRef,
  onIconPress, // [3. prop 받기]
  ...props
}) => {
  const { theme } = useTheme();

  // [4. 아이콘이 클릭 가능할 때와 아닐 때를 구분]
  const InputWrapper = onIconPress ? TouchableOpacity : View;

  return (
    <InputWrapper
      style={[
        styles.container,
        {
          borderColor: theme.neutral300,
          backgroundColor: theme.cardBackground,
        },
        containerStyle,
      ]}
      onPress={onIconPress} // [5. InputWrapper가 TouchableOpacity일 때만 작동]
      activeOpacity={onIconPress ? 0.7 : 1} // [6. 클릭 효과]
    >
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: theme.text }, inputStyle]}
        placeholderTextColor={colors.neutral400} // (placeholder 색상 고정)
        {...props}
      />
      {icon && (
        // [7. 아이콘 클릭 시 Input이 눌리는 것을 방지 (pointerEvents)]
        <View style={styles.iconContainer} pointerEvents="none">
          {icon}
        </View>
      )}
    </InputWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: verticalScale(70),
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: verticalScale(16),
    marginRight: verticalScale(10), // (아이콘과 텍스트 간격)
  },
  iconContainer: {
    paddingLeft: verticalScale(10),
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
});

export default Input;
