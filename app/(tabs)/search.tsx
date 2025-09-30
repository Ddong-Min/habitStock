import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import { useSharedValue, runOnJS } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SVG_CHART_WIDTH = SCREEN_WIDTH;
const SVG_CHART_HEIGHT = 400;

const Search: React.FC = () => {
  const [dataRange, setDataRange] = useState(5);
  const [scale, setScale] = useState(1);

  // 샘플 데이터 (주식 데이터)
  const data = useMemo(
    () => [
      { timestamp: "2021-01-01", value: 100 },
      { timestamp: "2021-01-02", value: 105 },
      { timestamp: "2021-01-03", value: 98 },
      { timestamp: "2021-01-04", value: 110 },
      { timestamp: "2021-01-05", value: 120 },
      { timestamp: "2021-01-06", value: 130 },
      { timestamp: "2021-01-07", value: 140 },
      { timestamp: "2021-01-08", value: 125 },
      { timestamp: "2021-01-09", value: 115 },
      { timestamp: "2021-01-10", value: 145 },
    ],
    []
  );

  const pinchScale = useSharedValue(1);
  const baseScale = useSharedValue(1);

  // JavaScript 스레드에서 실행될 함수들
  const updateDataRange = (newRange: number) => {
    setDataRange(newRange);
  };

  const updateScale = (newScale: number) => {
    setScale(newScale);
  };

  // Pinch 제스처 처리 (시각적 확대 없이 데이터만 필터링)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      // 제스처 시작 시 현재 스케일을 기준으로 설정
      baseScale.value = pinchScale.value;
    })
    .onUpdate((event) => {
      // 누적된 스케일 계산
      const newScale = baseScale.value * event.scale;

      // 스케일 제한 (0.5배 ~ 3배)
      const clampedScale = Math.max(0.5, Math.min(3, newScale));
      pinchScale.value = clampedScale;

      // JavaScript 스레드에서 상태 업데이트
      runOnJS(updateScale)(clampedScale);

      // 줌 팩터에 따른 데이터 범위 계산
      const zoomFactor = clampedScale;
      const newRange = Math.max(
        1,
        Math.min(data.length, data.length / zoomFactor)
      );

      // 데이터 범위 업데이트
      const currentRange = Math.floor(newRange);
      runOnJS(updateDataRange)(currentRange);
    })
    .onEnd(() => {
      // 제스처 종료 시 현재 값을 기준값으로 업데이트
      baseScale.value = pinchScale.value;
    });

  // 표시할 데이터 계산
  const visibleData = useMemo(
    () => data.slice(0, Math.floor(dataRange)),
    [data, dataRange]
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.chartWrapper}>
          <View style={styles.chart}>
            <Text style={styles.rangeText}>
              Zoomed Data Range: {Math.floor(dataRange)}
            </Text>
            <Text style={styles.rangeText}>Scale: {scale.toFixed(2)}</Text>
            <Text style={styles.rangeText}>Visible Data:</Text>
            {visibleData.map((entry, index) => (
              <Text key={index} style={styles.dataText}>
                {entry.timestamp}: {entry.value}
              </Text>
            ))}
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  chartWrapper: {
    width: SVG_CHART_WIDTH,
    height: SVG_CHART_HEIGHT,
    overflow: "hidden",
  },
  chart: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  rangeText: {
    fontSize: 14,
    color: "black",
    marginBottom: 5,
  },
  dataText: {
    fontSize: 12,
    color: "green",
    marginVertical: 1,
  },
});

export default Search;
