import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Profile from "@/components/Profile";
import FriendStock from "@/components/FriendStock";
const data = [
  { date: "2024-06-01", open: 100, close: 150, high: 180, low: 80, volume: 5 },
  { date: "2024-06-02", open: 130, close: 140, high: 160, low: 120, volume: 7 },
  { date: "2024-06-03", open: 140, close: 100, high: 150, low: 70, volume: 4 },
  { date: "2024-06-04", open: 100, close: 170, high: 190, low: 80, volume: 6 },
  { date: "2024-06-05", open: 170, close: 110, high: 200, low: 80, volume: 1 },
  { date: "2024-06-06", open: 160, close: 180, high: 210, low: 140, volume: 2 },
  { date: "2024-06-07", open: 180, close: 120, high: 200, low: 100, volume: 3 },
  { date: "2024-06-08", open: 190, close: 160, high: 210, low: 140, volume: 5 },
  { date: "2024-06-09", open: 170, close: 190, high: 210, low: 150, volume: 8 },
  { date: "2024-06-10", open: 200, close: 150, high: 230, low: 120, volume: 6 },
  { date: "2024-06-11", open: 150, close: 170, high: 200, low: 130, volume: 4 },
  { date: "2024-06-12", open: 170, close: 190, high: 230, low: 160, volume: 7 },
  { date: "2024-06-13", open: 180, close: 160, high: 220, low: 120, volume: 5 },
  { date: "2024-06-14", open: 190, close: 180, high: 240, low: 140, volume: 3 },
  { date: "2024-06-15", open: 210, close: 160, high: 230, low: 150, volume: 2 },
  { date: "2024-06-16", open: 220, close: 140, high: 240, low: 130, volume: 4 },
  { date: "2024-06-17", open: 160, close: 190, high: 210, low: 170, volume: 6 },
  { date: "2024-06-18", open: 180, close: 210, high: 220, low: 170, volume: 8 },
  { date: "2024-06-19", open: 200, close: 180, high: 230, low: 150, volume: 5 },
  { date: "2024-06-20", open: 220, close: 190, high: 250, low: 160, volume: 7 },
  { date: "2024-06-21", open: 240, close: 200, high: 290, low: 190, volume: 9 },
  { date: "2024-06-22", open: 230, close: 210, high: 250, low: 200, volume: 6 },
  { date: "2024-06-23", open: 250, close: 230, high: 270, low: 200, volume: 4 },
  { date: "2024-06-24", open: 270, close: 240, high: 280, low: 220, volume: 3 },
  { date: "2024-06-25", open: 260, close: 250, high: 300, low: 230, volume: 5 },
  { date: "2024-06-26", open: 250, close: 270, high: 270, low: 220, volume: 7 },
  { date: "2024-06-27", open: 280, close: 260, high: 320, low: 230, volume: 8 },
  { date: "2024-06-28", open: 290, close: 240, high: 320, low: 240, volume: 6 },
  { date: "2024-06-29", open: 270, close: 280, high: 300, low: 250, volume: 5 },
  { date: "2024-06-30", open: 300, close: 250, high: 330, low: 240, volume: 4 },
];
const Stock = () => {
  return (
    <View>
      <Profile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
      />
      <CustomChart
        date={data.map((item) => item.date)}
        open={data.map((item) => item.open)}
        close={data.map((item) => item.close)}
        high={data.map((item) => item.high)}
        low={data.map((item) => item.low)}
        volume={data.map((item) => item.volume)}
      />
      <FriendStock />
    </View>
  );
};
export default Stock;
