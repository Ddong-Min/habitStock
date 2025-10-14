import { TasksState } from "@/types";

const randomPriceGenerator = (mode: keyof TasksState, currentPrice: number) => {
  // 난이도별 변동률 범위 설정
  let minPercent: number;
  let maxPercent: number;

  if (mode === "easy") {
    minPercent = 0.1; // 0.1%
    maxPercent = 0.2; // 0.2%
  } else if (mode === "medium") {
    minPercent = 0.15; // 0.15%
    maxPercent = 0.4; // 0.4%
  } else if (mode === "hard") {
    minPercent = 0.3; // 0.3%
    maxPercent = 0.6; // 0.6%
  } else {
    // extreme
    minPercent = 0.4; // 0.4%
    maxPercent = 1.0; // 1.0%
  }

  // 범위 내에서 랜덤 % 생성
  const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);

  // 금액 변화 계산 (소수점 1자리까지 반올림)
  const rawChange = currentPrice * (randomPercent / 100);
  const priceChange = Math.round(rawChange * 10) / 10;

  // 최종 가격
  const randomPrice = currentPrice + priceChange;

  return {
    randomPrice: Math.max(0.1, parseFloat(randomPrice.toFixed(1))), // 최소 0.1 이상
    randomPercent: parseFloat(randomPercent.toFixed(2)), // %
    priceChange: priceChange, // 금액 변화
  };
};

export default randomPriceGenerator;
