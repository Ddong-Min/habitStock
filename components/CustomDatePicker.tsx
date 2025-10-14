import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { CustomDatePickerProps } from "@/types";
import { useCalendar } from "@/contexts/calendarContext";

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  onConfirm,
  onCancel,
}) => {
  const { selectedDate } = useCalendar();
  // --- 변경점 1: 여러 개의 state를 하나의 Date 객체로 관리 ---
  const [date, setDate] = useState(new Date(selectedDate));

  // --- 변경점 2: 날짜 변경 핸들러 로직 수정 ---
  const onChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => {
    // 안드로이드에서는 날짜 선택 후 모달이 바로 닫히므로,
    // 이벤트 유형에 따라 확인/취소를 바로 처리합니다.
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        onConfirm &&
          onConfirm({
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
            day: selectedDate.getDate(),
          });
      } else {
        onCancel && onCancel();
      }
      return;
    }

    // iOS에서는 피커가 화면에 계속 떠 있으므로,
    // 날짜가 변경될 때마다 state만 업데이트합니다.
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // iOS용 확인 핸들러
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* --- 변경점 3: iOS에서만 헤더와 버튼이 보이도록 처리 --- */}
      {Platform.OS === "ios" && (
        <View style={styles.header}>
          <Typo size={18} fontWeight="600" style={styles.titleText}>
            날짜 선택
          </Typo>
        </View>
      )}

      {/* --- 변경점 4: 세 개의 Picker를 하나의 DateTimePicker로 교체 --- */}
      <DateTimePicker
        testID="dateTimePicker"
        value={date}
        mode="date"
        display={Platform.OS === "ios" ? "spinner" : "default"} // iOS는 휠, Android는 기본 달력
        onChange={onChange}
        locale="ko-KR" // 한국어 설정
      />

      {/* iOS에서만 확인/취소 버튼을 렌더링합니다. */}
      {Platform.OS === "ios" && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
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
      )}
    </View>
  );
};

// 스타일은 기존과 거의 동일하게 유지합니다.
// 단, 안드로이드에서는 배경 컨테이너가 필요 없을 수 있으므로
// 부모 컴포넌트에서 이 컴포넌트를 호출하는 방식을 조절해야 할 수 있습니다.
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingTop: Platform.OS === "ios" ? spacingY._20 : 0,
    paddingHorizontal: Platform.OS === "ios" ? spacingX._20 : 0,
    paddingBottom: Platform.OS === "ios" ? spacingY._15 : 0,
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: spacingX._10,
    marginTop: spacingY._20,
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
