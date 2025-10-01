import CustomChart from "@/components/CustomChart";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Profile from "@/components/Profile";
import FriendStock from "@/components/FriendStock";
import Typo from "@/components/Typo";
import { colors } from "../../constants/theme";
import { useState } from "react";
import { spacingY, spacingX, radius } from "../../constants/theme";
const dayData = [
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
  { date: "2024-07-01", open: 260, close: 290, high: 310, low: 250, volume: 3 },
  { date: "2024-07-02", open: 280, close: 300, high: 320, low: 260, volume: 2 },
  { date: "2024-07-03", open: 300, close: 280, high: 330, low: 270, volume: 1 },
  { date: "2024-07-04", open: 290, close: 310, high: 340, low: 280, volume: 4 },
  { date: "2024-07-05", open: 310, close: 290, high: 350, low: 260, volume: 6 },
  { date: "2024-07-06", open: 320, close: 300, high: 360, low: 270, volume: 5 },
  { date: "2024-07-07", open: 300, close: 320, high: 340, low: 280, volume: 3 },
  { date: "2024-07-08", open: 310, close: 330, high: 370, low: 290, volume: 2 },
  { date: "2024-07-09", open: 330, close: 310, high: 380, low: 300, volume: 4 },
  { date: "2024-07-10", open: 340, close: 320, high: 390, low: 310, volume: 6 },
  { date: "2024-07-11", open: 320, close: 340, high: 360, low: 300, volume: 5 },
  { date: "2024-07-12", open: 350, close: 330, high: 400, low: 310, volume: 3 },
  { date: "2024-07-13", open: 360, close: 350, high: 410, low: 320, volume: 2 },
  { date: "2024-07-14", open: 340, close: 360, high: 380, low: 300, volume: 4 },
  { date: "2024-07-15", open: 370, close: 340, high: 420, low: 310, volume: 6 },
  { date: "2024-07-16", open: 380, close: 370, high: 430, low: 320, volume: 5 },
  { date: "2024-07-17", open: 360, close: 380, high: 400, low: 330, volume: 3 },
  { date: "2024-07-18", open: 390, close: 360, high: 440, low: 340, volume: 2 },
  { date: "2024-07-19", open: 400, close: 390, high: 450, low: 350, volume: 4 },
  { date: "2024-07-20", open: 380, close: 400, high: 420, low: 340, volume: 6 },
  { date: "2024-07-21", open: 410, close: 380, high: 460, low: 350, volume: 5 },
  { date: "2024-07-22", open: 420, close: 410, high: 470, low: 360, volume: 3 },
  { date: "2024-07-23", open: 400, close: 420, high: 440, low: 370, volume: 2 },
  { date: "2024-07-24", open: 430, close: 400, high: 480, low: 360, volume: 4 },
  { date: "2024-07-25", open: 440, close: 430, high: 490, low: 370, volume: 6 },
  { date: "2024-07-26", open: 420, close: 440, high: 460, low: 380, volume: 5 },
  { date: "2024-07-27", open: 450, close: 420, high: 500, low: 370, volume: 3 },
  { date: "2024-07-28", open: 460, close: 450, high: 510, low: 380, volume: 2 },
  { date: "2024-07-29", open: 440, close: 460, high: 480, low: 400, volume: 4 },
  { date: "2024-07-30", open: 470, close: 440, high: 520, low: 390, volume: 6 },
  { date: "2024-07-31", open: 480, close: 470, high: 530, low: 400, volume: 5 },
  { date: "2024-08-01", open: 460, close: 480, high: 500, low: 410, volume: 3 },
  { date: "2024-08-02", open: 490, close: 460, high: 540, low: 400, volume: 2 },
  { date: "2024-08-03", open: 500, close: 490, high: 550, low: 410, volume: 4 },
  { date: "2024-08-04", open: 480, close: 500, high: 520, low: 420, volume: 6 },
  { date: "2024-08-05", open: 510, close: 480, high: 560, low: 410, volume: 5 },
  { date: "2024-08-06", open: 520, close: 510, high: 570, low: 420, volume: 3 },
  { date: "2024-08-07", open: 500, close: 520, high: 540, low: 430, volume: 2 },
  { date: "2024-08-08", open: 530, close: 500, high: 580, low: 420, volume: 4 },
  { date: "2024-08-09", open: 540, close: 530, high: 590, low: 430, volume: 6 },
  { date: "2024-08-10", open: 520, close: 540, high: 560, low: 440, volume: 5 },
  { date: "2024-08-11", open: 550, close: 520, high: 600, low: 430, volume: 3 },
  { date: "2024-08-12", open: 560, close: 550, high: 610, low: 440, volume: 2 },
  { date: "2024-08-13", open: 540, close: 560, high: 580, low: 450, volume: 4 },
  { date: "2024-08-14", open: 570, close: 540, high: 620, low: 440, volume: 6 },
  { date: "2024-08-15", open: 580, close: 570, high: 630, low: 450, volume: 5 },
  { date: "2024-08-16", open: 560, close: 580, high: 600, low: 460, volume: 3 },
  { date: "2024-08-17", open: 590, close: 560, high: 640, low: 450, volume: 2 },
  { date: "2024-08-18", open: 600, close: 590, high: 650, low: 460, volume: 4 },
  { date: "2024-08-19", open: 580, close: 600, high: 620, low: 470, volume: 6 },
  { date: "2024-08-20", open: 610, close: 580, high: 660, low: 460, volume: 5 },
  { date: "2024-08-21", open: 620, close: 610, high: 670, low: 470, volume: 3 },
  { date: "2024-08-22", open: 600, close: 620, high: 640, low: 480, volume: 2 },
  { date: "2024-08-23", open: 630, close: 600, high: 680, low: 470, volume: 4 },
  { date: "2024-08-24", open: 640, close: 630, high: 690, low: 480, volume: 6 },
  { date: "2024-08-25", open: 620, close: 640, high: 660, low: 490, volume: 5 },
  { date: "2024-08-26", open: 650, close: 620, high: 700, low: 480, volume: 3 },
  { date: "2024-08-27", open: 660, close: 650, high: 710, low: 490, volume: 2 },
  { date: "2024-08-28", open: 640, close: 660, high: 680, low: 500, volume: 4 },
];

const weeklyData = [
  { date: "2024-06-01", open: 100, close: 150, high: 180, low: 80, volume: 5 },
  { date: "2024-06-08", open: 190, close: 160, high: 210, low: 140, volume: 3 },
  { date: "2024-06-15", open: 210, close: 160, high: 230, low: 150, volume: 2 },
  { date: "2024-06-22", open: 230, close: 210, high: 250, low: 200, volume: 6 },
  { date: "2024-06-29", open: 270, close: 240, high: 280, low: 220, volume: 3 },
  { date: "2024-07-06", open: 320, close: 300, high: 360, low: 270, volume: 5 },
  { date: "2024-07-13", open: 360, close: 350, high: 410, low: 320, volume: 2 },
  { date: "2024-07-20", open: 380, close: 400, high: 420, low: 340, volume: 6 },
  { date: "2024-07-27", open: 450, close: 420, high: 500, low: 370, volume: 3 },
  { date: "2024-08-03", open: 500, close: 490, high: 550, low: 410, volume: 4 },
  { date: "2024-08-10", open: 520, close: 540, high: 560, low: 440, volume: 5 },
  { date: "2024-08-17", open: 600, close: 590, high: 650, low: 460, volume: 4 },
  { date: "2024-08-24", open: 640, close: 630, high: 690, low: 480, volume: 6 },
];

const MonthlyData = [
  { date: "2024-06-01", open: 100, close: 150, high: 180, low: 80, volume: 5 },
  { date: "2024-07-01", open: 260, close: 290, high: 310, low: 250, volume: 3 },
  { date: "2024-08-01", open: 460, close: 480, high: 500, low: 410, volume: 3 },
];
const Stock = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("day");
  let data;
  if (selectedPeriod === "day") {
    data = dayData;
  } else if (selectedPeriod === "week") {
    data = weeklyData;
  } else if (selectedPeriod === "month") {
    // For month, you can create and assign monthlyData similarly
    data = MonthlyData; // Placeholder, replace with actual monthly data
  } else {
    data = dayData; // Default to dayData if something goes wrong
  }
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Profile
        name="Ddongmin (DMN)"
        price={1033}
        changeValue={-15}
        changePercentage={-0.3}
        type="stock"
      />
      <CustomChart
        date={data.map((item) => item.date)}
        open={data.map((item) => item.open)}
        close={data.map((item) => item.close)}
        high={data.map((item) => item.high)}
        low={data.map((item) => item.low)}
        volume={data.map((item) => item.volume)}
      />
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
      <FriendStock />
    </View>
  );
};

const styles = StyleSheet.create({
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
export default Stock;
