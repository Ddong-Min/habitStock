import { TasksState } from "@/types";

const randomPriceGenerator = (mode: keyof TasksState, currentPrice: number) => {
  let minPercent: number;
  let maxPercent: number;
  let boostMultiplier: number;

  // 난이도별 기본 변동률 + 폭발 시 배수 설정
  switch (mode) {
    case "easy":
      minPercent = 0.05;
      maxPercent = 0.15;
      boostMultiplier = 1.5;
      break;
    case "medium":
      minPercent = 0.1;
      maxPercent = 0.3;
      boostMultiplier = 2.0;
      break;
    case "hard":
      minPercent = 0.25;
      maxPercent = 0.7;
      boostMultiplier = 2.5;
      break;
    case "extreme":
      minPercent = 0.4;
      maxPercent = 1.2;
      boostMultiplier = 3.0;
      break;
    default:
      minPercent = 0.1;
      maxPercent = 0.3;
      boostMultiplier = 2.0;
  }

  // 기본 변동률 계산
  let randomPercent = minPercent + Math.random() * (maxPercent - minPercent);

  // 🎲 3% 확률로 폭발적 변동 발생 (난이도별 배수 반영)
  if (Math.random() < 0.03) {
    randomPercent *= boostMultiplier;
  }

  // 금액 변화 계산
  const rawChange = currentPrice * (randomPercent / 100);
  const priceChange = Math.round(rawChange * 10) / 10;
  const randomPrice = currentPrice + priceChange;

  return {
    randomPrice: Math.max(0.1, parseFloat(randomPrice.toFixed(1))),
    randomPercent: parseFloat(randomPercent.toFixed(2)),
    priceChange,
  };
};

export default randomPriceGenerator;
