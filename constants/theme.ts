import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  sub: "#E5E5E5",
  main: "#3B91CB",
  red25: "#ED373840", // 25%
  red50: "#ED373880", // 50%
  red75: "#ED3738BF", // 75%
  red100: "#ED3738FF", // 100% (or just #ED3738)

  // Blue
  blue25: "#0B6FF440", // 25%
  blue50: "#0B6FF480", // 50%
  blue75: "#0B6FF4BF", // 75%
  blue100: "#0B6FF4FF", // 100% (or just #0B6FF4)
  text: "#000",
  textLight: "#737373",
  textLighter: "#d4d4d4",
  white: "#fff",
  black: "#000",
  neutral50: "#fafafa",
  neutral100: "#f5f5f5",
  neutral200: "#e5e5e5",
  neutral300: "#d4d4d4",
  neutral350: "#CCCCCC",
  neutral400: "#a3a3a3",
  neutral500: "#737373",
  neutral600: "#525252",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#171717",
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
};

export const spacingY = {
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
  _70: verticalScale(70),
  _100: verticalScale(100),
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
};
