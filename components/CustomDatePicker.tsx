import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Picker, { PickerItem } from "@quidone/react-native-wheel-picker";
import Typo from "./Typo";
import { verticalScale } from "@/utils/styling";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { CustomDatePickerProps } from "@/types";

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  onConfirm,
  onCancel,
}) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());

  // 각 달의 일수를 계산하는 함수
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const years: PickerItem<number>[] = Array.from({ length: 10 }, (_, i) => {
    const y = 2020 + i;
    return { value: y, label: `${y.toString()}년` };
  });

  const months: PickerItem<number>[] = [
    { value: 1, label: "1월" },
    { value: 2, label: "2월" },
    { value: 3, label: "3월" },
    { value: 4, label: "4월" },
    { value: 5, label: "5월" },
    { value: 6, label: "6월" },
    { value: 7, label: "7월" },
    { value: 8, label: "8월" },
    { value: 9, label: "9월" },
    { value: 10, label: "10월" },
    { value: 11, label: "11월" },
    { value: 12, label: "12월" },
  ];

  // 현재 선택된 년/월에 따라 일수 계산
  const maxDays = getDaysInMonth(year, month);
  const days: PickerItem<number>[] = Array.from({ length: maxDays }, (_, i) => {
    const d = i + 1;
    return { value: d, label: d.toString() };
  });

  // 월이나 년도가 변경될 때 일자 유효성 체크
  useEffect(() => {
    const maxDaysInMonth = getDaysInMonth(year, month);
    if (day > maxDaysInMonth) {
      setDay(maxDaysInMonth);
    }
  }, [year, month]);

  const handleConfirm = () => {
    if (onConfirm) {
      console.log("Calling onConfirm...");

      onConfirm({ year, month, day });
    }
  };

  const handleCancel = () => {
    console.log("Canceling date picker");
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Picker
          style={{ flex: 1 }}
          value={year}
          onValueChanged={(event) => {
            console.log("Year changed:", event);
            const selectedYear = years[event.index]?.value;
            if (selectedYear) {
              setYear(selectedYear);
            }
          }}
          data={years}
        />
        <Picker
          style={{ flex: 1 }}
          value={month}
          onValueChanged={(event) => {
            console.log("Month changed:", event);
            const selectedMonth = months[event.index]?.value;
            if (selectedMonth) {
              setMonth(selectedMonth);
            }
          }}
          data={months}
        />
        <Picker
          style={{ flex: 1 }}
          value={day}
          onValueChanged={(event) => {
            console.log("Day changed:", event);
            const selectedDay = days[event.index]?.value;
            if (selectedDay) {
              setDay(selectedDay);
            }
          }}
          data={days}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Typo
            size={verticalScale(28)}
            fontWeight={700}
            style={{ lineHeight: verticalScale(28) }}
          >
            확인
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.red75 }]}
          onPress={handleCancel}
        >
          <Typo
            size={verticalScale(28)}
            fontWeight={700}
            style={{ lineHeight: verticalScale(28) }}
          >
            취소
          </Typo>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacingY._10,
    width: "100%",
    gap: spacingX._10,
  },
  button: {
    backgroundColor: colors.blue75,
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CustomDatePicker;
