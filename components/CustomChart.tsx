import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text as RNText,
  ActivityIndicator,
} from "react-native";
import {
  Canvas,
  Path,
  Rect,
  Text,
  Group,
  Line,
  vec,
  Skia,
  matchFont,
  DashPathEffect,
  Circle, // ✅ Circle 컴포넌트 import 추가
} from "@shopify/react-native-skia";
import { verticalScale } from "@/utils/styling";
import { scaleLinear } from "d3-scale";
import { useSharedValue, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useStock } from "@/contexts/stockContext";
import { aggregateData } from "@/handler/aggregateData";
import { StockDataByDateType } from "@/types";
import Typo from "./Typo";
import { useTheme } from "@/contexts/themeContext";
import { useAuth } from "@/contexts/authContext";

type ChartType = "candle" | "line";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SVG_WIDTH = SCREEN_WIDTH;
const CANDLE_HEIGHT = verticalScale(300);
const VOLUME_HEIGHT = verticalScale(70);
const TOTAL_HEIGHT = CANDLE_HEIGHT + VOLUME_HEIGHT;

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
  const { theme } = useTheme();
  const { selectedPeriod, changeSelectedPeriod } = useStock();
  const [chartType, setChartType] = useState<ChartType>("candle");

  const { user } = useAuth();

  const showMovingAverage = user?.showMovingAverage ?? true;
  const chartColorScheme = user?.chartColorScheme ?? "red-up";
  const chartLineColor = user?.chartLineColor ?? theme.blue100;

  const stockColors = {
    up: chartColorScheme === "red-up" ? theme.red100 : theme.green100,
    down: chartColorScheme === "red-up" ? theme.blue100 : theme.red100,
  };

  const [fullDataArray, setFullDataArray] = useState<
    [string, number, number, number, number, number][]
  >([]);

  useEffect(() => {
    if (!stockData) return;
    const aggregated = aggregateData(stockData, selectedPeriod);
    setFullDataArray(aggregated);
  }, [stockData, selectedPeriod]);

  const visibleRange = useSharedValue(30);
  const scrollOffset = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const savedVisibleRange = useSharedValue(30);
  const savedScrollOffset = useSharedValue(0);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const focalX = useSharedValue(0);

  const [renderVisibleRange, setRenderVisibleRange] = useState(30);
  const [renderScrollOffset, setRenderScrollOffset] = useState(0);

  useEffect(() => {
    if (fullDataArray.length > 0) {
      const initialRange = Math.min(30, fullDataArray.length);
      visibleRange.value = initialRange;
      setRenderVisibleRange(initialRange);
      const lastIndex = fullDataArray.length - initialRange;
      const initialOffset = lastIndex > 0 ? lastIndex : 0;
      scrollOffset.value = initialOffset;
      setRenderScrollOffset(initialOffset);
    }
  }, [fullDataArray.length]);

  const x0 = spacingX._25;
  const xAxisLength = SVG_WIDTH - x0 * 3;
  const x1 = x0 + xAxisLength;

  const candleY0 = spacingY._25;
  const candleYAxisLength = CANDLE_HEIGHT - candleY0 * 2;
  const candleXAxisY = candleY0 + candleYAxisLength;

  const volumeY0 = CANDLE_HEIGHT - candleY0;
  const volumeYAxisLength = VOLUME_HEIGHT;
  const volumeXAxisY = volumeY0 + volumeYAxisLength;

  const updateRenderState = (newRange: number, newOffset: number) => {
    setRenderVisibleRange(newRange);
    setRenderScrollOffset(newOffset);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      savedScale.value = scale.value;
      savedVisibleRange.value = visibleRange.value;
      savedScrollOffset.value = scrollOffset.value;
      savedTranslateX.value = scrollOffset.value;
      focalX.value = e.focalX;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      const minScale = 0.2;
      const maxScale = 6;
      scale.value = Math.max(minScale, Math.min(maxScale, newScale));

      const baseRange = 30;
      const newRange = Math.max(
        5,
        Math.min(fullDataArray.length, baseRange / scale.value)
      );

      visibleRange.value = newRange;

      const focalXInChart = focalX.value - x0;
      const focalRatio = Math.max(0, Math.min(1, focalXInChart / xAxisLength));

      const focalDataIndex =
        savedScrollOffset.value + savedVisibleRange.value * focalRatio;

      const newOffset = Math.max(
        0,
        Math.min(
          fullDataArray.length - newRange,
          focalDataIndex - newRange * focalRatio
        )
      );

      scrollOffset.value = newOffset;

      runOnJS(updateRenderState)(newRange, newOffset);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = scrollOffset.value;
    });

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      savedTranslateX.value = scrollOffset.value;
    })
    .onUpdate((e) => {
      const pixelsPerData = xAxisLength / visibleRange.value;
      const deltaInDataPoints = -e.translationX / pixelsPerData;

      const newOffset = Math.max(
        0,
        Math.min(
          fullDataArray.length - visibleRange.value,
          savedTranslateX.value + deltaInDataPoints * 0.7
        )
      );

      scrollOffset.value = newOffset;

      runOnJS(updateRenderState)(visibleRange.value, newOffset);
    })
    .onEnd(() => {
      translateX.value = 0;
      savedTranslateX.value = 0;
    });

  const composedGesture = Gesture.Race(pinchGesture, panGesture);

  const fullMa5 = useMemo(() => {
    if (!showMovingAverage) return [];
    const allClose = fullDataArray.map((d) => d[2]);
    return calculateMovingAverage(allClose, 5);
  }, [fullDataArray, showMovingAverage]);

  const fullMa20 = useMemo(() => {
    if (!showMovingAverage) return [];
    const allClose = fullDataArray.map((d) => d[2]);
    return calculateMovingAverage(allClose, 20);
  }, [fullDataArray, showMovingAverage]);

  const fullMa60 = useMemo(() => {
    if (!showMovingAverage) return [];
    const allClose = fullDataArray.map((d) => d[2]);
    return calculateMovingAverage(allClose, 60);
  }, [fullDataArray, showMovingAverage]);

  const {
    dataArray,
    ma5,
    ma20,
    ma60,
    niceMin,
    niceMax,
    niceTick,
    volumeYMax,
    offsetFraction,
    barPlotWidth,
    isLastPointVisible, // ✅ 마지막 포인트 가시성 플래그
  } = useMemo(() => {
    const start = Math.max(
      0,
      Math.min(renderScrollOffset, fullDataArray.length - renderVisibleRange)
    );
    const startFloor = Math.floor(start - 1);
    const fraction = start - Math.floor(start);
    const end = Math.ceil(start + renderVisibleRange + 1);

    // ✅ 마지막 데이터 포인트가 현재 렌더링 범위에 포함되는지 확인
    const isLastPointVisible = end >= fullDataArray.length;

    const dataArray = fullDataArray.slice(
      Math.max(0, startFloor),
      Math.min(end, fullDataArray.length)
    );
    const startIndex = Math.max(0, startFloor);
    const offsetFraction = startFloor < 0 ? fraction : fraction + 1;

    const ma5 = fullMa5.slice(startIndex, startIndex + dataArray.length);
    const ma20 = fullMa20.slice(startIndex, startIndex + dataArray.length);
    const ma60 = fullMa60.slice(startIndex, startIndex + dataArray.length);

    const maValues = showMovingAverage
      ? [
          ...ma5.filter((v): v is number => v !== null),
          ...ma20.filter((v): v is number => v !== null),
          ...ma60.filter((v): v is number => v !== null),
        ]
      : [];

    const rawCandleYMax = Math.max(...dataArray.map((d) => d[3]), ...maValues);
    const rawCandleYMin = Math.min(...dataArray.map((d) => d[4]), ...maValues);

    const validYMax = isFinite(rawCandleYMax) ? rawCandleYMax : 0;
    const validYMin = isFinite(rawCandleYMin) ? rawCandleYMin : 0;

    const rawRange = validYMax - validYMin;
    const padding = rawRange * 0.05 || 1;
    const candleYMax = validYMax + padding;
    const candleYMin = validYMin - padding;
    const candleYRange = candleYMax - candleYMin;

    const getNiceNumber = (range: number, round: boolean) => {
      if (range === 0) return 1;
      const exponent = Math.floor(Math.log10(range));
      const fraction = range / Math.pow(10, exponent);
      let niceFraction;

      if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
      } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
      }

      return niceFraction * Math.pow(10, exponent);
    };

    const numYTicks = 7;
    const niceRange = getNiceNumber(candleYRange, false);
    const niceTick = getNiceNumber(niceRange / (numYTicks - 1), true) || 1;
    const niceMin = Math.floor(candleYMin / niceTick) * niceTick;
    const niceMax = Math.ceil(candleYMax / niceTick) * niceTick;

    const volumeYMax = Math.max(...dataArray.map((d) => d[5]), 0);
    const barPlotWidth = xAxisLength / renderVisibleRange;

    return {
      dataArray,
      ma5,
      ma20,
      ma60,
      niceMin,
      niceMax,
      niceTick,
      volumeYMax,
      offsetFraction,
      barPlotWidth,
      isLastPointVisible, // ✅ 반환 객체에 추가
    };
  }, [
    fullDataArray,
    fullMa5,
    fullMa20,
    fullMa60,
    renderScrollOffset,
    renderVisibleRange,
    showMovingAverage,
  ]);

  const font = useMemo(
    () =>
      matchFont({
        fontFamily: "Arial",
        fontSize: 11,
      }),
    []
  );

  const smallFont = useMemo(
    () =>
      matchFont({
        fontFamily: "Arial",
        fontSize: 10,
      }),
    []
  );

  const numYTicks = 7;
  const numXTicks = 5;

  const yAxisLabels = useMemo(() => {
    return Array.from({ length: numYTicks }).map((_, i) => {
      const yValue = niceMin + i * niceTick;
      const scaleY = scaleLinear()
        .domain([niceMin, niceMax])
        .range([candleYAxisLength, 0]);
      const y = candleY0 + scaleY(yValue);

      return { yValue, y };
    });
  }, [niceMin, niceMax, niceTick, candleY0, candleYAxisLength]);

  // ✅ 거래량 Y축 레이블 - volumeYMax가 4 이하면 무조건 0,1,2,3,4
  const volumeYAxisLabels = useMemo(() => {
    if (volumeYMax <= 4) {
      return [4, 3, 2, 1, 0].map((yValue, i) => {
        const y = volumeY0 + i * (volumeYAxisLength / 4);
        return { yValue, y };
      });
    }

    return Array.from({ length: 5 }).map((_, i) => {
      const y = volumeY0 + i * (volumeYAxisLength / 4);
      const yValue = Math.round(volumeYMax - i * (volumeYMax / 4));
      return { yValue, y };
    });
  }, [volumeY0, volumeYAxisLength, volumeYMax]);

  if (!user || fullDataArray.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            height: TOTAL_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator color={theme.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <GestureDetector gesture={composedGesture}>
        <Canvas style={{ width: SVG_WIDTH, height: TOTAL_HEIGHT }}>
          <Line
            p1={vec(x0, candleXAxisY)}
            p2={vec(x1, candleXAxisY)}
            color={theme.neutral300}
            strokeWidth={1}
          />
          <Line
            p1={vec(x1, candleY0)}
            p2={vec(x1, candleXAxisY)}
            color={theme.neutral300}
            strokeWidth={1}
          />
          <Line
            p1={vec(x0, volumeXAxisY)}
            p2={vec(x1, volumeXAxisY)}
            color={theme.neutral300}
            strokeWidth={1}
          />
          <Line
            p1={vec(x1, volumeY0)}
            p2={vec(x1, volumeXAxisY)}
            color={theme.neutral300}
            strokeWidth={1}
          />

          {yAxisLabels.map(({ yValue, y }, i) => (
            <Group key={`y-${i}`}>
              <Line
                p1={vec(x0, y)}
                p2={vec(x1, y)}
                color={theme.neutral200 || "#E5E5E5"}
                strokeWidth={1}
              >
                <DashPathEffect intervals={[3, 3]} />
              </Line>
              {i !== 0 && (
                <Text
                  x={x1 + 5}
                  y={y}
                  text={String(Math.round(yValue))}
                  font={font}
                  color="#666666"
                />
              )}
            </Group>
          ))}

          {volumeYAxisLabels.map(({ yValue, y }, i) => (
            <Group key={`vol-y-${i}`}>
              <Line
                p1={vec(x0, y)}
                p2={vec(x1, y)}
                color={theme.neutral200 || "#E5E5E5"}
                strokeWidth={1}
              >
                <DashPathEffect intervals={[3, 3]} />
              </Line>
              <Text
                x={x1 + 5}
                y={y}
                text={String(Math.abs(yValue))}
                font={smallFont}
                color="#666666"
              />
            </Group>
          ))}

          {dataArray.map((data, index) => {
            const shouldShowLabel =
              index % Math.max(1, Math.ceil(dataArray.length / numXTicks)) ===
              0;
            if (shouldShowLabel) {
              const x =
                x0 + (index - offsetFraction) * barPlotWidth + barPlotWidth / 2;
              if (x >= x0 && x <= x1) {
                const dateText = data[0]
                  .split("-")
                  .map((part, i) => (i === 0 ? part.slice(-2) : part))
                  .join("/");

                return (
                  <Group key={`x-${index}`}>
                    <Line
                      p1={vec(x, candleY0)}
                      p2={vec(x, candleXAxisY)}
                      color={theme.neutral200 || "#E5E5E5"}
                      strokeWidth={1}
                    >
                      <DashPathEffect intervals={[3, 3]} />
                    </Line>
                    <Line
                      p1={vec(x, volumeY0)}
                      p2={vec(x, volumeXAxisY)}
                      color={theme.neutral200 || "#E5E5E5"}
                      strokeWidth={1}
                    >
                      <DashPathEffect intervals={[3, 3]} />
                    </Line>
                    <Text
                      x={x - 15}
                      y={volumeXAxisY + 12}
                      text={dateText}
                      font={smallFont}
                      color="#666666"
                    />
                  </Group>
                );
              }
            }
            return null;
          })}

          <Group clip={Skia.XYWHRect(x0, 0, xAxisLength, TOTAL_HEIGHT)}>
            {chartType === "candle" ? (
              dataArray.map((data, index) => {
                const [day, open, close, high, low, volume] = data;
                const x = x0 + (index - offsetFraction) * barPlotWidth;
                const sidePadding = barPlotWidth / 6;
                const max = Math.max(open, close);
                const min = Math.min(open, close);

                const scaleY = scaleLinear()
                  .domain([niceMin, niceMax])
                  .range([candleYAxisLength, 0]);

                const fill = open > close ? stockColors.down : stockColors.up;

                const highY = candleY0 + scaleY(high);
                const lowY = candleY0 + scaleY(low);
                const maxY = candleY0 + scaleY(max);
                const minY = candleY0 + scaleY(min);
                const rectHeight = minY - maxY;

                // ✅ volumeYMax가 4 이하면 domain을 4로 고정
                const volumeScaleY = scaleLinear()
                  .domain([0, volumeYMax <= 4 ? 4 : volumeYMax])
                  .range([0, volumeYAxisLength]);
                const barHeight = volumeScaleY(volume);
                const barY = volumeXAxisY - barHeight;

                const lineX =
                  x + sidePadding / 2 + (barPlotWidth - sidePadding) / 2;

                return (
                  <Group key={`candle-${index}`}>
                    <Line
                      p1={vec(lineX, highY)}
                      p2={vec(lineX, lowY)}
                      color={fill}
                      strokeWidth={1}
                    />
                    <Rect
                      x={x + sidePadding / 2}
                      y={maxY}
                      width={barPlotWidth - sidePadding}
                      height={Math.max(rectHeight, 1)}
                      color={fill}
                    />
                    <Rect
                      x={x + sidePadding / 2}
                      y={barY}
                      width={barPlotWidth - sidePadding}
                      height={barHeight}
                      color={fill}
                      opacity={0.5}
                    />
                  </Group>
                );
              })
            ) : (
              <Group>
                {(() => {
                  const path = Skia.Path.Make();
                  const scaleY = scaleLinear()
                    .domain([niceMin, niceMax])
                    .range([candleYAxisLength, 0]);

                  dataArray.forEach((data, index) => {
                    const closePrice = data[2];
                    const x =
                      x0 +
                      (index - offsetFraction) * barPlotWidth +
                      barPlotWidth / 2;
                    const y = candleY0 + scaleY(closePrice);

                    if (index === 0 || x < x0) {
                      path.moveTo(x, y);
                    } else {
                      path.lineTo(x, y);
                    }
                  });

                  return (
                    <Path
                      path={path}
                      color={chartLineColor}
                      style="stroke"
                      strokeWidth={2.5}
                    />
                  );
                })()}

                {/* ✅ START: 마지막 포인트 마커 추가 */}
                {isLastPointVisible &&
                  dataArray.length > 0 &&
                  (() => {
                    const lastDataPoint = dataArray[dataArray.length - 1];
                    const lastClosePrice = lastDataPoint[2];
                    const lastIndex = dataArray.length - 1;

                    const scaleY = scaleLinear()
                      .domain([niceMin, niceMax])
                      .range([candleYAxisLength, 0]);

                    const cx =
                      x0 +
                      (lastIndex - offsetFraction) * barPlotWidth +
                      barPlotWidth / 2;
                    const cy = candleY0 + scaleY(lastClosePrice);

                    // 캔버스/클립 영역 밖으로 나가지 않도록 방지
                    if (cx > x1 || cy < candleY0 || cy > candleXAxisY) {
                      return null;
                    }

                    return (
                      <Group>
                        {/* 바깥쪽 원 (배경색으로 덮어씌워 "테두리" 효과) */}
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={6} // 바깥쪽 원 반지름
                          color={theme.cardBackground}
                        />
                        {/* 안쪽 원 (라인색과 동일) */}
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={4} // 안쪽 원 반지름
                          color={chartLineColor}
                        />
                      </Group>
                    );
                  })()}
                {/* ✅ END: 마지막 포인트 마커 추가 */}

                {dataArray.map((data, index) => {
                  const [day, open, close, high, low, volume] = data;
                  const x = x0 + (index - offsetFraction) * barPlotWidth;
                  const sidePadding = barPlotWidth / 6;
                  const fill = open > close ? stockColors.down : stockColors.up;

                  // ✅ volumeYMax가 4 이하면 domain을 4로 고정
                  const volumeScaleY = scaleLinear()
                    .domain([0, volumeYMax <= 4 ? 4 : volumeYMax])
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
                      color={fill}
                      opacity={0.5}
                    />
                  );
                })}
              </Group>
            )}

            {showMovingAverage &&
              [
                { data: ma5, color: theme.yellow },
                { data: ma20, color: theme.purple },
                { data: ma60, color: theme.red75 },
              ].map((ma, maIndex) => {
                const path = Skia.Path.Make();
                const scaleY = scaleLinear()
                  .domain([niceMin, niceMax])
                  .range([candleYAxisLength, 0]);

                let started = false;
                ma.data.forEach((value, index) => {
                  if (value !== null) {
                    const x =
                      x0 +
                      (index - offsetFraction) * barPlotWidth +
                      barPlotWidth / 2;
                    const y = candleY0 + scaleY(value);

                    if (!started && x >= x0) {
                      path.moveTo(x, y);
                      started = true;
                    } else if (started) {
                      path.lineTo(x, y);
                    }
                  }
                });

                return (
                  <Path
                    key={`ma-${maIndex}`}
                    path={path}
                    color={ma.color}
                    style="stroke"
                    strokeWidth={1.5}
                  />
                );
              })}
          </Group>

          {showMovingAverage && (
            <>
              <Text
                x={x0}
                y={candleY0 - 5}
                text="MA5"
                font={font}
                color={theme.yellow}
              />
              <Text
                x={x0 + 50}
                y={candleY0 - 5}
                text="MA20"
                font={font}
                color={theme.purple}
              />
              <Text
                x={x0 + 110}
                y={candleY0 - 5}
                text="MA60"
                font={font}
                color={theme.red75}
              />
            </>
          )}
        </Canvas>
      </GestureDetector>

      <View style={styles.chartControlContainer}>
        <View
          style={[
            styles.periodButtonContainer,
            { backgroundColor: theme.neutral100 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "day" && [
                styles.periodButtonActive,
                { backgroundColor: theme.cardBackground },
              ],
            ]}
            onPress={() => changeSelectedPeriod("day")}
            activeOpacity={0.7}
          >
            <Typo
              size={12}
              fontWeight="600"
              color={selectedPeriod === "day" ? theme.text : theme.textLight}
              style={{ letterSpacing: -0.2 }}
            >
              일
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "week" && [
                styles.periodButtonActive,
                { backgroundColor: theme.cardBackground },
              ],
            ]}
            onPress={() => changeSelectedPeriod("week")}
            activeOpacity={0.7}
          >
            <Typo
              size={12}
              fontWeight="600"
              color={selectedPeriod === "week" ? theme.text : theme.textLight}
              style={{ letterSpacing: -0.2 }}
            >
              주
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "month" && [
                styles.periodButtonActive,
                { backgroundColor: theme.cardBackground },
              ],
            ]}
            onPress={() => changeSelectedPeriod("month")}
            activeOpacity={0.7}
          >
            <Typo
              size={12}
              fontWeight="600"
              color={selectedPeriod === "month" ? theme.text : theme.textLight}
              style={{ letterSpacing: -0.2 }}
            >
              월
            </Typo>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.chartTypeButtonContainer,
            { backgroundColor: theme.neutral100 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "candle" && [
                styles.chartTypeButtonActive,
                { backgroundColor: theme.cardBackground },
              ],
            ]}
            onPress={() => setChartType("candle")}
            activeOpacity={0.7}
          >
            <RNText
              style={[
                styles.chartTypeButtonText,
                { color: theme.textLight },
                chartType === "candle" && [
                  styles.chartTypeButtonTextActive,
                  { color: theme.text },
                ],
              ]}
            >
              캔들차트
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "line" && [
                styles.chartTypeButtonActive,
                { backgroundColor: theme.cardBackground },
              ],
            ]}
            onPress={() => setChartType("line")}
            activeOpacity={0.7}
          >
            <RNText
              style={[
                styles.chartTypeButtonText,
                { color: theme.textLight },
                chartType === "line" && [
                  styles.chartTypeButtonTextActive,
                  { color: theme.text },
                ],
              ]}
            >
              라인차트
            </RNText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
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
  chartControlContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._15,
  },
  chartTypeButtonContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  chartTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: spacingY._7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  chartTypeButtonActive: {
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
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  chartTypeButtonTextActive: {
    fontWeight: "600",
  },
  periodButtonContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  periodButton: {
    width: 38,
    paddingVertical: spacingY._7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default CustomChart;
