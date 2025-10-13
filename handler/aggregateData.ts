import { StockDataByDateType } from "@/types";

export const aggregateData = (
  stockData: StockDataByDateType,
  selectedPeriod: "day" | "week" | "month"
): [string, number, number, number, number, number][] => {
  if (!stockData) return [];
  const stockArray = Object.values(stockData);

  if (selectedPeriod === "day") {
    // day 모드에서도 날짜순 정렬 추가
    const result = stockArray.map(
      (item) =>
        [
          item.date,
          item.open,
          item.close,
          item.high,
          item.low,
          item.volume,
        ] as [string, number, number, number, number, number]
    );

    result.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    return result;
  }

  //날짜별 그룹화
  const grouped = new Map<string, typeof stockArray>();

  stockArray.forEach((item) => {
    const date = new Date(item.date);
    let key: string;
    if (selectedPeriod === "week") {
      const day = date.getDay(); // 0 (일요일) ~ 6 (토요일)
      const diff = date.getDate() - day;
      const sunday = new Date(date.setDate(diff));
      key = sunday.toISOString().split("T")[0]; // 주의 시작일(일요일)을 키로 사용
    } else {
      key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`; // 월별 그룹화
    }
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(item);
  });

  const result: [string, number, number, number, number, number][] = [];
  grouped.forEach((items, date) => {
    const open = items[0].open;
    const close = items[items.length - 1].close;
    const high = Math.max(...items.map((item) => item.high));
    const low = Math.min(...items.map((item) => item.low));
    const volume = items.reduce((sum, item) => sum + item.volume, 0);
    result.push([date, open, close, high, low, volume]);
  });
  //날짜순으로 정렬
  result.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  return result;
};
