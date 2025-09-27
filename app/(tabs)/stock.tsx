import React from "react";
import { View } from "react-native";
import { CandlestickChart } from "react-native-wagmi-charts";
import Profile from "../../components/Profile";
const data = [
  {
    timestamp: 1635292800000,
    open: 1020,
    high: 1040,
    low: 1010,
    close: 1033,
  },
  {
    timestamp: 1635379200000,
    open: 1033,
    high: 1042,
    low: 1012,
    close: 1018,
  },
  {
    timestamp: 1635465600000,
    open: 1018,
    high: 1030,
    low: 1015,
    close: 1025,
  },
  {
    timestamp: 1635552000000,
    open: 1025,
    high: 1045,
    low: 1020,
    close: 1038,
  },
];

const Stock = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Your Profile */}
      <Profile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
      />

      {/* CandleStick Chart */}
      <CandlestickChart.Provider data={data}>
        <CandlestickChart height={300}>
          <CandlestickChart.Candles />
          <CandlestickChart.Crosshair>
            <CandlestickChart.Tooltip />
          </CandlestickChart.Crosshair>
        </CandlestickChart>
      </CandlestickChart.Provider>
    </View>
  );
};

export default Stock;
