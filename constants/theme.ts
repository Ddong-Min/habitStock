import { TasksState } from "@/types";
import { scale, verticalScale } from "@/utils/styling";

// 공통 색상 (모드에 관계없이 동일)
const baseColors = {
  main: "#5aa5d8ff",
  // Red shades
  red25: "#d1706940",
  red50: "#d1706980",
  red75: "#d17069BF",
  red100: "#d17069",
  // Blue shades
  blue25: "#7693a540",
  blue50: "#7693a580",
  blue75: "#7693a5BF",
  blue100: "#7693a5",

  // ✅ 차트 설정용 색상 수정
  green100: "#5A9C74", // ✅ (기존 #22C55E에서 톤 다운된 녹색으로 변경)
  yellow: "#F59E0B", // MA 1 (예시)
  purple: "#8B5CF6", // MA 2 (예시)
};

// 라이트모드 색상
const lightColors = {
  ...baseColors,
  sub: "#E5E5E5",
  text: "#000",
  textLight: "#a3a3a3",
  textLighter: "#d4d4d4",
  white: "#fff",
  black: "#000",
  background: "#fff",
  cardBackground: "#fff",
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

// 다크모드 색상
const darkColors = {
  ...baseColors,
  sub: "#404040",
  text: "#f5f5f5",
  textLight: "#a3a3a3",
  textLighter: "#525252",
  white: "#171717",
  black: "#f5f5f5",
  background: "#000",
  cardBackground: "#171717",
  neutral50: "#171717",
  neutral100: "#262626",
  neutral200: "#404040",
  neutral300: "#525252",
  neutral350: "#5a5a5a",
  neutral400: "#737373",
  neutral500: "#a3a3a3",
  neutral600: "#d4d4d4",
  neutral700: "#e5e5e5",
  neutral800: "#f5f5f5",
  neutral900: "#fafafa",
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _6: scale(6),
  _7: scale(7),
  _8: scale(8),
  _10: scale(10),
  _12: scale(12),
  _14: scale(14),
  _15: scale(15),
  _16: scale(16),
  _17: scale(17),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
  _50: scale(50),
  _60: scale(60),
  _70: scale(70),
  _100: scale(100),
};

export const spacingY = {
  _2: verticalScale(2),
  _3: verticalScale(3),
  _5: verticalScale(5),
  _6: verticalScale(6),
  _7: verticalScale(7),
  _8: verticalScale(8),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _14: verticalScale(14),
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
  _80: verticalScale(80),
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
  _40: verticalScale(40),
  _50: verticalScale(50),
  _70: verticalScale(70),
  _100: verticalScale(100),
};

// 테마 타입
export type Theme = typeof lightColors & {
  // ✅ 차트 색상을 테마 타입에 포함
  green100: string;
  yellow: string;
  purple: string;
};

// 테마 가져오기 함수
export const getTheme = (isDarkMode: boolean): Theme => {
  // ✅ 라이트/다크 공통으로 green, yellow, purple 추가
  const baseChartColors = {
    green100: baseColors.green100,
    yellow: baseColors.yellow,
    purple: baseColors.purple,
  };

  return isDarkMode
    ? { ...darkColors, ...baseChartColors }
    : { ...lightColors, ...baseChartColors };
};

// 기본 export (라이트모드) - 기존 코드 호환성 유지
export const colors = getTheme(false);

// 난이도별 색상 함수
export const difficultyColors = (key: keyof TasksState, isDarkMode = false) => {
  const theme = getTheme(isDarkMode);
  if (key === "easy") return theme.blue100;
  else if (key === "medium") return theme.blue75;
  else if (key === "hard") return theme.red75;
  else if (key === "extreme") return theme.red100;
  return theme.sub;
};

export const difficultyborderColor = (
  key: keyof TasksState,
  isDarkMode = false
) => {
  const theme = getTheme(isDarkMode);
  if (key === "easy") return theme.blue50;
  else if (key === "medium") return theme.blue25;
  else if (key === "hard") return theme.red25;
  else if (key === "extreme") return theme.red50;
  return theme.sub;
};
