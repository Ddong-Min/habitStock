// 파일 위치: app/(legal)/_layout.tsx

import { Stack } from "expo-router";
import React from "react";

// 이 스크린 그룹의 헤더를 숨겨서
// 각 스크린이 자체 헤더(뒤로가기 버튼 포함)를 갖도록 합니다.
const LegalLayout = () => {
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default LegalLayout;
