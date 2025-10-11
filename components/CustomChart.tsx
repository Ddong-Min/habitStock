import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text as RNText,
} from "react-native";
import Svg, { G, Line, Rect, Text, Polyline } from "react-native-svg";
import { verticalScale } from "@/utils/styling";
import { scaleLinear } from "d3-scale";
import { useSharedValue, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useStock } from "@/contexts/stockContext";
import { aggregateData } from "@/handler/aggregateData";
import { StockDataByDateType } from "@/types";
type ChartType = "candle" | "line";

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

const CustomChart: React.FC<{ stockData: StockDataByDateType }> = ({
  stockData,
}) => {
  const { selectedPeriod } = useStock();
  const [chartType, setChartType] = useState<ChartType>("candle");

  const [fullDataArray, setFullDataArray] = useState<
    [string, number, number, number, number, number][]
  >([]);

  useEffect(() => {
    if (!stockData) return;
    const aggregated = aggregateData(stockData, selectedPeriod);
    setFullDataArray(aggregated);
  }, [stockData, selectedPeriod]);

  const [visibleRange, setVisibleRange] = useState(30);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (fullDataArray.length > 0) {
      setVisibleRange(Math.min(30, fullDataArray.length));
    }
  }, [fullDataArray.length]);

  useEffect(() => {
    if (fullDataArray.length > 0) {
      const lastIndex = fullDataArray.length - visibleRange;
      setScrollOffset(lastIndex > 0 ? lastIndex : 0);
    }
  }, [fullDataArray, visibleRange]);

  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const panOffset = useSharedValue(0);
  const basePanOffset = useSharedValue(0);

  // x축 설정
  const x0 = spacingX._25;
  const xAxisLength = SVG_WIDTH - x0 * 3;
  const x1 = x0 + xAxisLength;

  // 캔들 차트 영역
  const candleY0 = spacingY._25;
  const candleYAxisLength = CANDLE_HEIGHT - candleY0 * 2;
  const candleXAxisY = candleY0 + candleYAxisLength;

  // 거래량 차트 영역
  const volumeY0 = CANDLE_HEIGHT - candleY0;
  const volumeYAxisLength = VOLUME_HEIGHT;
  const volumeXAxisY = volumeY0 + volumeYAxisLength;

  const updateVisibleRange = (newRange: number) => {
    setVisibleRange(newRange);
  };

  const updateScrollOffset = (newOffset: number) => {
    setScrollOffset(newOffset);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = pinchScale.value;
    })
    .onUpdate((e) => {
      const newScale = baseScale.value * e.scale;
      const maxData = fullDataArray.length / 5;
      const minData = fullDataArray.length / 40;
      const clampedScale = Math.min(Math.max(newScale, minData), maxData);
      pinchScale.value = clampedScale;

      const newRange = Math.max(
        5,
        Math.min(fullDataArray.length, fullDataArray.length / clampedScale)
      );
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
      const offsetInDataPoints = newOffset / pixelsPerData;
      const clampedOffset = Math.max(
        0,
        Math.min(maxScroll, offsetInDataPoints)
      );
      panOffset.value = clampedOffset * pixelsPerData;
      runOnJS(updateScrollOffset)(Math.round(clampedOffset));
    })
    .onEnd(() => {
      basePanOffset.value = panOffset.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

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

  const ma5 = fullMa5.slice(startIndex, startIndex + dataArray.length);
  const ma20 = fullMa20.slice(startIndex, startIndex + dataArray.length);
  const ma60 = fullMa60.slice(startIndex, startIndex + dataArray.length);

  const rawCandleYMax = Math.max(
    dataArray.reduce(
      (max, [_, __, ___, high, ____]) => Math.max(max, high),
      -Infinity
    ),
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

  const rawRange = rawCandleYMax - rawCandleYMin;
  const padding = rawRange * 0.05;
  const candleYMax = rawCandleYMax + padding;
  const candleYMin = rawCandleYMin - padding;
  const candleYRange = candleYMax - candleYMin;

  const visibleVolumes = dataArray.map((d) => d[5]);
  const volumeYMax = Math.max(...visibleVolumes);
  const volumeYMin = 0;
  const volumeYRange = volumeYMax - volumeYMin;

  const numYTicks = 7;
  const numXTicks = 5;
  const minDataCount = 5;
  const barPlotWidth = xAxisLength / Math.max(dataArray.length, minDataCount);

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

  const createLinePoints = (): string => {
    const points: string[] = [];
    const scaleY = scaleLinear()
      .domain([candleYMin, candleYMax])
      .range([candleY0, candleYAxisLength]);

    dataArray.forEach((data, index) => {
      const closePrice = data[2];
      const x = x0 + index * barPlotWidth + barPlotWidth / 2;
      const y = CANDLE_HEIGHT - scaleY(closePrice) - candleY0;
      points.push(`${x},${y}`);
    });

    return points.join(" ");
  };

  return (
    <View style={styles.container}>
      {/* 차트 타입 전환 버튼 */}
      <View style={styles.chartTypeContainer}>
        <View style={styles.chartTypeButtonContainer}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "candle" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("candle")}
            activeOpacity={0.7}
          >
            <RNText
              style={[
                styles.chartTypeButtonText,
                chartType === "candle" && styles.chartTypeButtonTextActive,
              ]}
            >
              캔들차트
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "line" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("line")}
            activeOpacity={0.7}
          >
            <RNText
              style={[
                styles.chartTypeButtonText,
                chartType === "line" && styles.chartTypeButtonTextActive,
              ]}
            >
              라인차트
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      <GestureDetector gesture={composedGesture}>
        <View>
          <Svg height={TOTAL_HEIGHT} width={SVG_WIDTH}>
            {/* 캔들 차트 X축 */}
            <Line
              x1={x0}
              y1={candleXAxisY}
              x2={x1}
              y2={candleXAxisY}
              stroke={colors.neutral300}
              strokeWidth="1"
            />
            {/* 캔들 차트 Y축 */}
            <Line
              x1={x1}
              y1={candleY0}
              x2={x1}
              y2={candleXAxisY}
              stroke={colors.neutral300}
              strokeWidth="1"
            />
            {/* X축 격자선과 날짜 레이블 */}
            {dataArray.map((_, index) => {
              const shouldShowLabel =
                index % Math.ceil(dataArray.length / numXTicks) === 0;
              if (shouldShowLabel) {
                const x = x0 + index * barPlotWidth + barPlotWidth / 2;
                return (
                  <G key={`x-${index}`}>
                    <Line
                      x1={x}
                      y1={candleY0}
                      x2={x}
                      y2={candleXAxisY}
                      stroke={colors.neutral100}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <Line
                      x1={x}
                      y1={volumeY0}
                      x2={x}
                      y2={volumeXAxisY}
                      stroke={colors.neutral100}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <Text
                      x={x}
                      y={volumeXAxisY + spacingY._15}
                      textAnchor="middle"
                      fontSize={verticalScale(10)}
                      fill={colors.neutral500}
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
              const scaleY = scaleLinear()
                .domain([candleYMin, candleYMax])
                .range([candleYAxisLength, candleY0]);
              const yValue = Math.round(Number(scaleY.invert(y)));
              return (
                <G key={`candle-y-${index}`}>
                  <Line
                    x1={x1}
                    y1={y}
                    x2={x0}
                    y2={y}
                    stroke={colors.neutral100}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <Text
                    x={x1 + spacingX._5}
                    y={y + spacingY._5}
                    textAnchor="start"
                    fontSize={verticalScale(11)}
                    fill={colors.neutral500}
                  >
                    {yValue.toLocaleString()}
                  </Text>
                </G>
              );
            })}

            {/* 거래량 차트 X축 */}
            <Line
              x1={x0}
              y1={volumeXAxisY}
              x2={x1}
              y2={volumeXAxisY}
              stroke={colors.neutral300}
              strokeWidth="1"
            />

            {/* 거래량 차트 Y축 */}
            <Line
              x1={x1}
              y1={volumeY0}
              x2={x1}
              y2={volumeXAxisY}
              stroke={colors.neutral300}
              strokeWidth="1"
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
                    stroke={colors.neutral100}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <Text
                    fontSize={verticalScale(10)}
                    x={x1 + spacingX._5}
                    y={y + 5}
                    textAnchor="start"
                    fill={colors.neutral500}
                  >
                    {Math.abs(yValue)}
                  </Text>
                </G>
              );
            })}

            {/* 차트 영역 */}
            {chartType === "candle" ? (
              dataArray.map(([day, open, close, high, low, volume], index) => {
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

                const volumeScaleY = scaleLinear()
                  .domain([volumeYMin, volumeYMax])
                  .range([0, volumeYAxisLength]);

                const barHeight = volumeScaleY(volume);
                const barY = volumeXAxisY - barHeight;

                return (
                  <G key={`candle-${index}`}>
                    <Line
                      x1={
                        x + sidePadding / 2 + (barPlotWidth - sidePadding) / 2
                      }
                      y1={highY}
                      x2={
                        x + sidePadding / 2 + (barPlotWidth - sidePadding) / 2
                      }
                      y2={lowY}
                      stroke={fill}
                      strokeWidth="1"
                    />
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
                      opacity={0.5}
                    />
                  </G>
                );
              })
            ) : (
              <>
                <Polyline
                  points={createLinePoints()}
                  fill="none"
                  stroke={colors.blue100}
                  strokeWidth="2.5"
                />
                {dataArray.map(
                  ([day, open, close, high, low, volume], index) => {
                    const x = x0 + index * barPlotWidth;
                    const sidePadding = barPlotWidth / 6;
                    const fill = open > close ? colors.blue100 : colors.red100;

                    const volumeScaleY = scaleLinear()
                      .domain([volumeYMin, volumeYMax])
                      .range([0, volumeYAxisLength]);

                    const barHeight = volumeScaleY(volume);
                    const barY = volumeXAxisY - barHeight;

                    return (
                      <Rect
                        key={`volume-${index}`}
                        x={x + sidePadding / 2}
                        y={barY}
                        width={barPlotWidth - sidePadding}
                        height={barHeight}
                        fill={fill}
                        opacity={0.5}
                      />
                    );
                  }
                )}
              </>
            )}

            {/* 이동평균선 */}
            <Polyline
              points={createMovingAveragePoints(ma5)}
              fill="none"
              stroke="#FF6B6B"
              strokeWidth="1.5"
            />
            <Polyline
              points={createMovingAveragePoints(ma20)}
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="1.5"
            />
            <Polyline
              points={createMovingAveragePoints(ma60)}
              fill="none"
              stroke="#9B59B6"
              strokeWidth="1.5"
            />

            {/* 이동평균선 범례 */}
            <G>
              <Text
                x={x0}
                y={candleY0 - 10}
                fontSize={verticalScale(11)}
                fill="#FF6B6B"
                fontWeight="500"
              >
                MA5
              </Text>
              <Text
                x={x0 + 50}
                y={candleY0 - 10}
                fontSize={verticalScale(11)}
                fill="#4ECDC4"
                fontWeight="500"
              >
                MA20
              </Text>
              <Text
                x={x0 + 110}
                y={candleY0 - 10}
                fontSize={verticalScale(11)}
                fill="#9B59B6"
                fontWeight="500"
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
    backgroundColor: colors.white,
    marginHorizontal: spacingX._10,
    marginVertical: spacingY._7,
    borderRadius: 16,
    paddingVertical: spacingY._15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTypeContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._15,
  },
  chartTypeButtonContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral100,
    borderRadius: 10,
    padding: 4,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: spacingY._7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  chartTypeButtonActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTypeButtonText: {
    fontSize: verticalScale(13),
    color: colors.neutral500,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  chartTypeButtonTextActive: {
    color: colors.black,
    fontWeight: "600",
  },
});

export default CustomChart;
