// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import Profile from '../../components/Profile';
import Toggle from '../../components/Toggle';
import CalendarViewToggle from '../../components/CalendarViewToggle';
import Calendar from '../../components/Calendar';
import TodoList from '../../components/TodoList';
import { TasksState } from '../../types';


const initialTasks: TasksState = {
  easy: [{ id: '1', text: 'Task 1', completed: false, percentage: '+0.13%' }],
  medium: [{ id: '2', text: 'Task 1', completed: true, percentage: '+0.44%' }],
  hard: [{ id: '3', text: 'Task 1', completed: false, percentage: '-0.55%' }],
  extreme: [{ id: '4', text: '뉴스 보내기', completed: false, percentage: '' }],
};

const TodoScreen = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'bucket'>('todo');
  const [isWeekView, setIsWeekView] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2022-02-15');
  const [currentDate, setCurrentDate] = useState('2022-02-15');
  const [tasks, setTasks] = useState<TasksState>(initialTasks);
  
  const handleViewToggle = (mode: 'week' | 'month') => {
    setIsWeekView(mode === 'week');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Profile
          name="Ddongmin (DMN)"
          price={1033}
          changeValue={15}
          changePercentage={0.3}
        />
        <Toggle  onToggle={setActiveTab} />
        
        <CalendarViewToggle
          viewMode={isWeekView ? 'week' : 'month'}
          onToggle={handleViewToggle}
        />

        <Calendar
  onDatePress={(date) => console.log('선택된 날짜:', date)}
  habitData={{
    '2022-2-15': 0.5,
    '2022-2-16': 0.3,
  }}
  initialDate={new Date(2022, 1, 15)}
/>

        <TodoList tasks={tasks} onDragEnd={setTasks} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
});

export default TodoScreen;