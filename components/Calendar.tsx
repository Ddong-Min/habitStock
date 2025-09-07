import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Typo from './Typo';

interface CustomButtonProps {
  style?: any;
  onPress: () => void;
  loading?: boolean;
  color?: string;
  children: React.ReactNode;
}
interface CalendarProps {
  onDatePress?: (date: Date) => void;
  habitData?: Record<string, number>;
  initialDate?: Date;
}
declare const Button: React.FC<CustomButtonProps>;

const Calendar: React.FC<CalendarProps> = ({
  onDatePress,
  habitData = {},
  initialDate = new Date(2022, 1, 15) // 2022년 2월 15일
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  const getAchievementRate = (date: Date): number => {
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return habitData[key] || 0;
  };
  
  const getAchievementText = (rate: number): string => {
    return `+${(rate * 100).toFixed(0)}%`;
  };
  
  const getMonthDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };
  
  const getWeekDays = (): Date[] => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days;
  };
  
  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };
  
  const isToday = (date: Date): boolean => {
    const today = new Date(2022, 1, 15); // 예시 날짜를 오늘로 설정
    return date.toDateString() === today.toDateString();
  };
  
  const isSameMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };
  
  const handleDatePress = (date: Date) => {
    if (onDatePress) {
      onDatePress(date);
    }
  };
  
  const renderDay = (date: Date, index: number) => {
    const rate = getAchievementRate(date);
    const hasData = rate > 0;
    const isDayToday = isToday(date);
    const isCurrentMonth = isSameMonth(date);
    const isWeekView = viewMode === 'week';
    
    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={StyleSheet.flatten([
          styles.dayCell,
          isWeekView ? styles.dayCellWeek : null,
          isDayToday ? styles.todayCell : null,
          (!isCurrentMonth && viewMode === 'month') ? styles.otherMonth : null
        ])}
        onPress={() => handleDatePress(date)}
      >
        <View style={StyleSheet.flatten([
          isDayToday ? styles.todayIndicator : null
        ])}>
          <Typo
            size={isWeekView ? 18 : 16}
            color={
              isDayToday 
                ? colors.white 
                : !isCurrentMonth && viewMode === 'month'
                ? colors.neutral400
                : colors.text
            }
            fontWeight="500"
          >
            {date.getDate()}
          </Typo>
        </View>
        {hasData && (
          <Typo
            size={10}
            color={colors.red75}
            fontWeight="500"
            style={styles.achievementText}
          >
            {getAchievementText(rate)}
          </Typo>
        )}
      </TouchableOpacity>
    );
  };
  
  const days = viewMode === 'month' ? getMonthDays() : getWeekDays();
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Typo size={20} fontWeight="600" color={colors.text}>
            {currentYear}년 {currentMonth}
          </Typo>
          
          <View style={styles.viewModeToggle}>
            <Button
              style={[
                styles.toggleButton,
                viewMode === 'week' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('week')}
              color={viewMode === 'week' ? colors.white : 'transparent'}
            >
              <Typo
                size={12}
                color={viewMode === 'week' ? colors.text : colors.neutral500}
                fontWeight="500"
              >
                주
              </Typo>
            </Button>
            <Button
              style={[
                styles.toggleButton,
                viewMode === 'month' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('month')}
              color={viewMode === 'month' ? colors.white : 'transparent'}
            >
              <Typo
                size={12}
                color={viewMode === 'month' ? colors.text : colors.neutral500}
                fontWeight="500"
              >
                월
              </Typo>
            </Button>
          </View>
        </View>
        
        <View style={styles.navigation}>
          <Button
            style={styles.navButton}
            onPress={() => navigateDate(-1)}
            color="transparent"
          >
            <ChevronLeft size={20} color={colors.neutral600} />
          </Button>
          <Button
            style={styles.navButton}
            onPress={() => navigateDate(1)}
            color="transparent"
          >
            <ChevronRight size={20} color={colors.neutral600} />
          </Button>
        </View>
      </View>
      
      {/* 요일 헤더 */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((day, index) => (
          <View key={day} style={styles.dayNameCell}>
            <Typo
              size={12}
              color={
                index === 0 
                  ? colors.red75 
                  : index === 6 
                  ? colors.blue75 
                  : colors.neutral600
              }
              fontWeight="500"
            >
              {day}
            </Typo>
          </View>
        ))}
      </View>
      
      {/* 캘린더 그리드 */}
      <View style={styles.calendar}>
        {days.slice(0, viewMode === 'month' ? days.length : 7).map((date, index) => 
          renderDay(date, index)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._15,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral100,
    borderRadius: radius._6,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._5,
    borderRadius: radius._3,
    minWidth: 32,
  },
  toggleButtonActive: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navigation: {
    flexDirection: 'row',
    gap: spacingX._5,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius._17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayNamesRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral50,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  dayNameCell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.neutral200,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%', // 7분의 1
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: colors.neutral200,
    borderBottomColor: colors.neutral200,
    backgroundColor: colors.white,
  },
  dayCellWeek: {
    height: 80,
  },
  todayCell: {
    backgroundColor: colors.blue25,
  },
  otherMonth: {
    opacity: 0.3,
  },
  todayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.blue75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  achievementText: {
    marginTop: 2,
  },
});

export default Calendar;