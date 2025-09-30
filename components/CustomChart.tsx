import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text as RNText,
} from "react-native";
import Svg, { G, Line, Rect, Text, Polyline } from "react-native-svg";
import { verticalScale } from "@/utils/styling";
import { Props } from "@/types";
import { scaleLinear } from "d3-scale";
import Typo from "./Typo";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SVG_WIDTH = SCREEN_WIDTH;
const CANDLE_HEIGHT = verticalScale(300);
const VOLUME_HEIGHT = verticalScale(70);
const TOTAL_HEIGHT = CANDLE_HEIGHT + VOLUME_HEIGHT;

type PeriodType = "day" | "week" | "month";

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

const CustomChart: React.FC<Props> = ({
  date,
  open,
  close,
  high,
  low,
  volume,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("day");

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
  const dataArray: [string, number, number, number, number, number][] = [];
  for (let i = 0; i < date.length; i++) {
    dataArray.push([date[i], open[i], close[i], high[i], low[i], volume[i]]);
  }

  // 이동평균선 계산
  const ma5 = calculateMovingAverage(close, 5);
  const ma20 = calculateMovingAverage(close, 20);
  const ma60 = calculateMovingAverage(close, 60);

  // 캔들 차트 범위 계산
  const candleYMax = dataArray.reduce(
    (max, [_, __, ___, high, ____]) => Math.max(max, high),
    -Infinity
  );
  const candleYMin = dataArray.reduce(
    (min, [_, __, ___, ____, low]) => Math.min(min, low),
    Infinity
  );
  const candleYRange = candleYMax - candleYMin;

  // 거래량 범위 계산
  const volumeYMax = Math.max(...volume);
  const volumeYMin = 0;
  const volumeYRange = volumeYMax - volumeYMin;

  const numYTicks = 7;
  const numXTicks = 5;
  const barPlotWidth = xAxisLength / dataArray.length;

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
          strokeWidth="1"
        />
        {/* X축 격자선과 날짜 레이블 (전체 차트 관통) */}
        {dataArray.map((_, index) => {
          const shouldShowLabel =
            index % Math.ceil(dataArray.length / numXTicks) === 0 ||
            index === dataArray.length - 1;

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
                  {dataArray[index][0].split("-").join("/")}
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
          const yValue = Math.round(volumeYMax - index * (volumeYRange / 4));
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
          const sidePadding = 3;
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

      {/* 일/주/월 버튼 */}
      <View style={styles.periodButtonContainer}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "day" && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod("day")}
        >
          <Typo color={selectedPeriod === "day" ? colors.white : colors.text}>
            일
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "week" && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod("week")}
        >
          <Typo color={selectedPeriod === "week" ? colors.white : colors.text}>
            주
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "month" && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod("month")}
        >
          <Typo color={selectedPeriod === "month" ? colors.white : colors.text}>
            월
          </Typo>
        </TouchableOpacity>
      </View>
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
    marginLeft: spacingX._25,
    gap: spacingX._10,
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
