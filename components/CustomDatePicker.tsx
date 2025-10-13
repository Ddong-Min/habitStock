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

  const maxDays = getDaysInMonth(year, month);
  const days: PickerItem<number>[] = Array.from({ length: maxDays }, (_, i) => {
    const d = i + 1;
    return { value: d, label: d.toString() };
  });

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Typo size={18} fontWeight="600" style={styles.titleText}>
          날짜 선택
        </Typo>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          style={styles.picker}
          value={year}
          onValueChanged={(event) => {
            const selectedYear = years[event.index]?.value;
            if (selectedYear) {
              setYear(selectedYear);
            }
          }}
          data={years}
        />
        <Picker
          style={styles.picker}
          value={month}
          onValueChanged={(event) => {
            const selectedMonth = months[event.index]?.value;
            if (selectedMonth) {
              setMonth(selectedMonth);
            }
          }}
          data={months}
        />
        <Picker
          style={styles.picker}
          value={day}
          onValueChanged={(event) => {
            const selectedDay = days[event.index]?.value;
            if (selectedDay) {
              setDay(selectedDay);
            }
          }}
          data={days}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Typo size={16} fontWeight="600" style={styles.cancelButtonText}>
            취소
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
          activeOpacity={0.7}
        >
          <Typo size={16} fontWeight="600" style={styles.confirmButtonText}>
            확인
          </Typo>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingTop: spacingY._20,
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._15,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingBottom: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    marginBottom: spacingY._15,
  },
  titleText: {
    color: colors.black,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: spacingY._20,
  },
  picker: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: spacingX._10,
  },
  button: {
    flex: 1,
    paddingVertical: spacingY._15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: colors.main,
  },
  confirmButtonText: {
    color: colors.white,
    letterSpacing: -0.2,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  cancelButtonText: {
    color: colors.black,
    letterSpacing: -0.2,
  },
});

export default CustomDatePicker;
