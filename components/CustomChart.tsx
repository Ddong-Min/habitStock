import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Svg, { G, Line, Rect, Text, Polyline } from "react-native-svg";
import { verticalScale } from "@/utils/styling";
import { chartProps } from "@/types";
import { scaleLinear } from "d3-scale";
import { useSharedValue, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useStock } from "@/contexts/stockContext";
import { aggregateData } from "@/handler/aggregateData";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SVG_WIDTH = SCREEN_WIDTH;
const CANDLE_HEIGHT = verticalScale(300);
const VOLUME_HEIGHT = verticalScale(70);
const TOTAL_HEIGHT = CANDLE_HEIGHT + VOLUME_HEIGHT;

// 이동평균선 계산 함수
const calculateMovingAverage = (
  data: number[],
  period: number
): (number | null)[] => {
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / period);
    }
  }
  return result;
};

const CustomChart: React.FC<{}> = ({}) => {
  //주식데이터와 주식 데이터 함수
  const { stockData, loadAllStocks, selectedPeriod } = useStock();
  //전체 데이터를 배열로 변환하기 위한 배열,
  //rendering될때 값이 달라지는걸 바로 적용하기 위해서 state로 작성
  const [fullDataArray, setFullDataArray] = useState<
    [string, number, number, number, number, number][]
  >([]);

  //처음 컴포넌트를 렌더링할때만 전체 주식 데이터를 불러옴
  useEffect(() => {
    loadAllStocks();
  }, []);

  //stockData의 정보가 바뀔때 마다 fullDataArray를 재계산
  /* useEffect(() => {
    if (!stockData) return;
    const stockArray = Object.values(stockData);
    const newFullDataArray: [string, number, number, number, number, number][] =
      [];

    for (let i = 0; i < stockArray.length; i++) {
      newFullDataArray.push([
        stockArray[i].date,
        stockArray[i].open,
        stockArray[i].close,
        stockArray[i].high,
        stockArray[i].low,
        stockArray[i].volume,
      ]);
    }
    setFullDataArray(newFullDataArray);
  }, [stockData]);*/
  useEffect(() => {
    if (!stockData) return;
    const aggregated = aggregateData(stockData, selectedPeriod);
    setFullDataArray(aggregated);
  }, [stockData, selectedPeriod]);

  //줌/ 스크롤 관리
  const [visibleRange, setVisibleRange] = useState(30);
  const [scrollOffset, setScrollOffset] = useState(0);

  //fullDataArray가 바뀌면 visibleRange를 재설정 (최대 30)
  useEffect(() => {
    if (fullDataArray.length > 0) {
      setVisibleRange(Math.min(30, fullDataArray.length));
    }
  }, [fullDataArray.length]);

  /* 자주 변화하는 gesture관련 ui에 대해 변수를 useState로 관리하지 않고
  useSharedValu로 관리해서 javascript thread에서 re-rendering되지 않고 
  native-thread에서 관리해서 smooth하고, 우수한 성능을 보장하게 합니다. */
  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1); //기본값
  const panOffset = useSharedValue(0);
  const basePanOffset = useSharedValue(0); //기본값

  // x축 설정
  const x0 = spacingX._25;
  const xAxisLength = SVG_WIDTH - x0 * 3;
  const x1 = x0 + xAxisLength;

  // 캔들 차트 영역
  const candleY0 = spacingY._25;
  const candleYAxisLength = CANDLE_HEIGHT - candleY0 * 2;
  const candleXAxisY = candleY0 + candleYAxisLength;

  // 거래량 차트 영역 (캔들 차트 바로 아래)
  const volumeY0 = CANDLE_HEIGHT - candleY0;
  const volumeYAxisLength = VOLUME_HEIGHT;
  const volumeXAxisY = volumeY0 + volumeYAxisLength;

  // 데이터 준비
  const updateVisibleRange = (newRange: number) => {
    setVisibleRange(newRange);
  };

  const updateScrollOffset = (newOffset: number) => {
    setScrollOffset(newOffset);
  };

  //핀치 제스처 (줌인 줌아웃)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = pinchScale.value;
    })
    .onUpdate((e) => {
      const newScale = baseScale.value * e.scale;
      const maxData = fullDataArray.length / 5; // 최소 5개 데이터는 보여야 함
      const minData = fullDataArray.length / 40; // 최대 40개 데이터까지 확대 가능
      const clampedScale = Math.min(Math.max(newScale, minData), maxData); //최소 5개 최대 40개의 데이터가 보이도록 설정
      pinchScale.value = clampedScale;

      const newRange = Math.max(
        5,
        Math.min(fullDataArray.length, fullDataArray.length / clampedScale)
      );
      //gesturePinch는 native-thread에서 동작하기 때문에
      //setState를 직접 호출할 수 없고, runOnJS를 사용해서
      //javascript-thread에서 실행되도록 해야 합니다.
      runOnJS(updateVisibleRange)(Math.round(newRange));
    })
    .onEnd(() => {
      baseScale.value = pinchScale.value;
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      basePanOffset.value = panOffset.value;
    })
    .onUpdate((e) => {
      const newOffset = basePanOffset.value - e.translationX;
      const maxScroll = Math.max(0, fullDataArray.length - visibleRange);
      const pixelsPerData = xAxisLength / visibleRange;
      const offsetInDataPoints = newOffset / pixelsPerData; //몇칸이동했나
      const clampedOffset = Math.max(
        0,
        Math.min(maxScroll, offsetInDataPoints)
      );
      panOffset.value = clampedOffset * pixelsPerData;
      runOnJS(updateScrollOffset)(Math.round(clampedOffset)); //이 부분덕분에 ui변화가 보임
    })
    .onEnd(() => {
      basePanOffset.value = panOffset.value;
    });
  //두가지 제스처를 동시에 인식하게 하기 위해서 Gesture.Simultaneous 사용
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // 전체 데이터의 이동평균선 계산 (한 번만)
  const fullMa5 = useMemo(() => {
    const allClose = fullDataArray.map((d) => d[2]);
    return calculateMovingAverage(allClose, 5);
  }, [fullDataArray]);

  const fullMa20 = useMemo(() => {
    const allClose = fullDataArray.map((d) => d[2]);
    return calculateMovingAverage(allClose, 20);
  }, [fullDataArray]);

  const fullMa60 = useMemo(() => {
    const allClose = fullDataArray.map((d) => d[2]);
    return calculateMovingAverage(allClose, 60);
  }, [fullDataArray]);

  // 현재 보여줄 데이터 범위 계산
  const { dataArray, startIndex } = useMemo(() => {
    const start = Math.max(
      0,
      Math.min(scrollOffset, fullDataArray.length - visibleRange)
    );
    const end = Math.min(start + visibleRange, fullDataArray.length);
    return {
      dataArray: fullDataArray.slice(start, end),
      startIndex: start,
    };
  }, [fullDataArray, scrollOffset, visibleRange]);

  // 현재 보이는 범위의 이동평균선만 추출
  const ma5 = fullMa5.slice(startIndex, startIndex + dataArray.length);
  const ma20 = fullMa20.slice(startIndex, startIndex + dataArray.length);
  const ma60 = fullMa60.slice(startIndex, startIndex + dataArray.length);

  // 캔들 차트 범위 계산 (이동평균선 값 포함)
  const rawCandleYMax = Math.max(
    dataArray.reduce(
      (max, [_, __, ___, high, ____]) => Math.max(max, high),
      -Infinity
    ),
    //filtering을 위한 실제조건은 v !==null이고, v is number은 그냥 v!==null인 애들은 number이라는뜻 즉 타입가드 역할
    ...ma5.filter((v): v is number => v !== null),
    ...ma20.filter((v): v is number => v !== null),
    ...ma60.filter((v): v is number => v !== null)
  );
  const rawCandleYMin = Math.min(
    dataArray.reduce(
      (min, [_, __, ___, ____, low]) => Math.min(min, low),
      Infinity
    ),
    ...ma5.filter((v): v is number => v !== null),
    ...ma20.filter((v): v is number => v !== null),
    ...ma60.filter((v): v is number => v !== null)
  );

  // 위아래 5% 여유 공간 추가
  const rawRange = rawCandleYMax - rawCandleYMin;
  const padding = rawRange * 0.05;
  const candleYMax = rawCandleYMax + padding;
  const candleYMin = rawCandleYMin - padding;
  const candleYRange = candleYMax - candleYMin;

  // 거래량 범위 계산 (현재 보이는 범위만)
  const visibleVolumes = dataArray.map((d) => d[5]);
  const volumeYMax = Math.max(...visibleVolumes);
  const volumeYMin = 0;
  const volumeYRange = volumeYMax - volumeYMin;

  const numYTicks = 7;
  const numXTicks = 5;
  // 최소 5개 기준으로 캔들 너비 계산
  const minDataCount = 5;
  const barPlotWidth = xAxisLength / Math.max(dataArray.length, minDataCount);

  // 이동평균선 포인트 생성 함수
  const createMovingAveragePoints = (maData: (number | null)[]): string => {
    const points: string[] = [];
    const scaleY = scaleLinear()
      .domain([candleYMin, candleYMax])
      .range([candleY0, candleYAxisLength]);

    maData.forEach((value, index) => {
      if (value !== null) {
        const x = x0 + index * barPlotWidth + barPlotWidth / 2;
        const y = CANDLE_HEIGHT - scaleY(value) - candleY0;
        points.push(`${x},${y}`);
      }
    });

    return points.join(" ");
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View>
          <Svg height={TOTAL_HEIGHT} width={SVG_WIDTH}>
            {/* 캔들 차트 X축 */}
            <Line
              x1={x0}
              y1={candleXAxisY}
              x2={x1}
              y2={candleXAxisY}
              stroke={colors.neutral400}
              strokeWidth="2"
            />
            {/* 캔들 차트 Y축 */}
            <Line
              x1={x1}
              y1={candleY0}
              x2={x1}
              y2={candleXAxisY}
              stroke={colors.neutral200}
              strokeWidth="2"
            />
            {/* X축 격자선과 날짜 레이블 (전체 차트 관통) */}
            {dataArray.map((_, index) => {
              const shouldShowLabel =
                index % Math.ceil(dataArray.length / numXTicks) === 0;
              if (shouldShowLabel) {
                const x = x0 + index * barPlotWidth + barPlotWidth / 2;
                return (
                  <G key={`x-${index}`}>
                    {/* 캔들 차트 격자선 */}
                    <Line
                      x1={x}
                      y1={candleY0}
                      x2={x}
                      y2={candleXAxisY}
                      stroke={colors.neutral200}
                      strokeWidth="1"
                    />
                    {/* 거래량 차트 격자선 */}
                    <Line
                      x1={x}
                      y1={volumeY0}
                      x2={x}
                      y2={volumeXAxisY}
                      stroke={colors.neutral200}
                      strokeWidth="1"
                    />
                    {/* 날짜 레이블 */}
                    <Text
                      x={x}
                      y={volumeXAxisY + spacingY._15}
                      textAnchor="middle"
                      fontSize={verticalScale(10)}
                    >
                      {dataArray[index][0]
                        .split("-")
                        .map((part, i) => (i === 0 ? part.slice(-2) : part))
                        .join("/")}
                    </Text>
                  </G>
                );
              }
              return null;
            })}

            {/* 캔들 차트 Y축 격자선과 가격 레이블 */}
            {Array.from({ length: numYTicks }).map((_, index) => {
              const y = candleY0 + index * (candleYAxisLength / numYTicks);
              const yValue = Math.round(
                candleYMax - index * (candleYRange / numYTicks)
              );
              return (
                <G key={`candle-y-${index}`}>
                  <Line
                    x1={x1}
                    y1={y}
                    x2={x0}
                    y2={y}
                    stroke={colors.neutral200}
                    strokeWidth="1"
                  />
                  <Text
                    x={x1 + spacingX._5}
                    y={y + spacingY._5}
                    textAnchor="start"
                    fontSize={verticalScale(12)}
                  >
                    {yValue.toLocaleString()}원
                  </Text>
                </G>
              );
            })}
            {/* ========== 거래량 차트 영역 ========== */}

            {/* 거래량 차트 X축 */}
            <Line
              x1={x0}
              y1={volumeXAxisY}
              x2={x1}
              y2={volumeXAxisY}
              stroke={colors.neutral400}
              strokeWidth="2"
            />

            {/* 거래량 차트 Y축 */}
            <Line
              x1={x1}
              y1={volumeY0}
              x2={x1}
              y2={volumeXAxisY}
              stroke={colors.neutral400}
              strokeWidth="2"
            />

            {/* 거래량 차트 Y축 격자선과 레이블 */}
            {Array.from({ length: 5 }).map((_, index) => {
              const y = volumeY0 + index * (volumeYAxisLength / 4);
              const yValue = Math.round(
                volumeYMax - index * (volumeYRange / 4)
              );
              return (
                <G key={`volume-y-${index}`}>
                  <Line
                    x1={x1}
                    x2={x0}
                    y1={y}
                    y2={y}
                    stroke={colors.neutral200}
                    strokeWidth="1"
                  />
                  <Text
                    fontSize={verticalScale(10)}
                    x={x1 + spacingX._5}
                    y={y + 5}
                    textAnchor="start"
                  >
                    {Math.abs(yValue)}
                  </Text>
                </G>
              );
            })}

            {/* 바 영역*/}
            {dataArray.map(([day, open, close, high, low, volume], index) => {
              const x = x0 + index * barPlotWidth;
              const sidePadding = barPlotWidth / 6;
              const max = Math.max(open, close);
              const min = Math.min(open, close);
              const scaleY = scaleLinear()
                .domain([candleYMin, candleYMax])
                .range([candleY0, candleYAxisLength]);
              const fill = open > close ? colors.blue100 : colors.red100;

              const highY = CANDLE_HEIGHT - scaleY(high) - candleY0;
              const lowY = CANDLE_HEIGHT - scaleY(low) - candleY0;
              const maxY = CANDLE_HEIGHT - scaleY(max) - candleY0;
              const minY = CANDLE_HEIGHT - scaleY(min) - candleY0;

              const rectHeight = minY - maxY;

              // 거래량 바 설정
              const volumeScaleY = scaleLinear()
                .domain([volumeYMin, volumeYMax])
                .range([0, volumeYAxisLength]);

              const barHeight = volumeScaleY(volume);
              const barY = volumeXAxisY - barHeight;

              return (
                <G key={`candle-${index}`}>
                  {/* 심지(wick) */}
                  <Line
                    x1={x + sidePadding / 2 + (barPlotWidth - sidePadding) / 2}
                    y1={highY}
                    x2={x + sidePadding / 2 + (barPlotWidth - sidePadding) / 2}
                    y2={lowY}
                    stroke={fill}
                    strokeWidth="1"
                  />
                  {/* 캔들 몸체 */}
                  <Rect
                    fill={fill}
                    x={x + sidePadding / 2}
                    y={maxY}
                    width={barPlotWidth - sidePadding}
                    height={rectHeight}
                  />
                  <Rect
                    key={`volume-${index}`}
                    x={x + sidePadding / 2}
                    y={barY}
                    width={barPlotWidth - sidePadding}
                    height={barHeight}
                    fill={fill}
                  />
                </G>
              );
            })}

            {/* 이동평균선 */}
            <Polyline
              points={createMovingAveragePoints(ma5)}
              fill="none"
              stroke="#FF6B6B"
              strokeWidth="2"
            />
            <Polyline
              points={createMovingAveragePoints(ma20)}
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="2"
            />
            <Polyline
              points={createMovingAveragePoints(ma60)}
              fill="none"
              stroke="#9B59B6"
              strokeWidth="2"
            />

            {/* 이동평균선 범례 */}
            <G>
              <Text
                x={x0}
                y={candleY0 - 10}
                fontSize={verticalScale(12)}
                fill="#FF6B6B"
              >
                MA5
              </Text>
              <Text
                x={x0 + 50}
                y={candleY0 - 10}
                fontSize={verticalScale(12)}
                fill="#4ECDC4"
              >
                MA20
              </Text>
              <Text
                x={x0 + 110}
                y={candleY0 - 10}
                fontSize={verticalScale(12)}
                fill="#9B59B6"
              >
                MA60
              </Text>
            </G>
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacingY._10,
    backgroundColor: colors.white,
  },
  periodButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._25,
    gap: spacingX._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.sub,
  },
  periodButton: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._7,
    borderRadius: radius._10,
    backgroundColor: colors.neutral100,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: colors.blue100,
  },
});

export default CustomChart;
