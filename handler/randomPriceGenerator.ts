import { TasksState } from "@/types";
import normal from "@stdlib/random-base-normal";

const randomPriceGenerator = (mode: keyof TasksState, currentPrice: number) => {
  // 난이도별 평균 상승률 (task 1개 기준)
  let meanGrowthPerTask: number;
  let volatility: number;

  if (mode === "easy") {
    meanGrowthPerTask = 0.002; // 0.2%
    volatility = 0.001;
  } else if (mode === "medium") {
    meanGrowthPerTask = 0.003; // 0.3%
    volatility = 0.0015;
  } else if (mode === "hard") {
    meanGrowthPerTask = 0.004; // 0.4%
    volatility = 0.002;
  } else {
    // extreme
    meanGrowthPerTask = 0.005; // 0.5%
    volatility = 0.003;
  }

  // 정규분포 랜덤값 생성
  const growthGenerator = normal.factory(meanGrowthPerTask, volatility);

  // 1) 랜덤 % 생성 (음수 방지)
  let randomPercent = growthGenerator();
  randomPercent = Math.abs(randomPercent); // 음수일 경우 절댓값으로 변환

  // 2) 금액 변화 (소수점 1자리까지 반올림)
  const rawChange = currentPrice * randomPercent;
  const priceChange = Math.round(rawChange * 10) / 10; // 소수점 첫째자리 반올림

  // 3) 다시 %로 환산
  randomPercent = priceChange / currentPrice;

  // 4) 최종 가격
  const randomPrice = currentPrice + priceChange;

  return {
    randomPrice: Math.max(0.1, parseFloat(randomPrice.toFixed(1))), // 최소 0.1 이상
    randomPercent: parseFloat((randomPercent * 100).toFixed(2)), // %
    priceChange: priceChange, // 금액 변화
  };
};

export default randomPriceGenerator;
