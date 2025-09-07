import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Feather } from '@expo/vector-icons';
import Typo from './Typo';
import { colors } from '@/constants/theme';
import { Task, TasksState } from '@/types';

interface TodoListProps {
  tasks: TasksState;
  onDragEnd: (tasks: TasksState) => void;
}

const TodoList: React.FC<TodoListProps> = ({ tasks, onDragEnd }) => {
  const renderItem = ({ item, drag, isActive }: { item: Task, drag: () => void, isActive: boolean }) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.taskContainer,
          isActive && { backgroundColor: colors.sub },
        ]}
      >
        <View style={styles.task}>
          <View style={styles.taskLeft}>
            <View style={[styles.checkBox, item.completed && styles.checkedBox]}>
              {item.completed && <Feather name="check" size={16} color="white" />}
            </View>
            <Typo>{item.text}</Typo>
          </View>
          <Typo
            style={{
              color: item.percentage.startsWith('+')
                ? colors.red100
                : colors.blue100,
            }}
          >
            {item.percentage}
          </Typo>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <>
      {(Object.keys(tasks) as Array<keyof TasksState>).map((difficulty) => (
        <View key={difficulty} style={styles.difficultySection}>
          <View style={styles.difficultyHeader}>
            {/* 수정된 부분: theme.colors -> colors */}
            <View style={[styles.difficultyBadge, { backgroundColor: colors.red100 }]}>
              <Typo color="white" fontWeight="bold">
                {difficulty}
              </Typo>
            </View>
            <TouchableOpacity>
              <Feather name="plus" size={24} color={colors.sub} />
            </TouchableOpacity>
          </View>
          <DraggableFlatList
            data={tasks[difficulty]}
            onDragEnd={({ data }) => {
              const newTasks = { ...tasks, [difficulty]: data };
              onDragEnd(newTasks);
            }}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
    difficultySection: {
      marginVertical: 10,
      paddingHorizontal: 20,
    },
    difficultyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    difficultyBadge: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    taskContainer: {
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.sub,
    },
    task: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    taskLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkBox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.sub,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkedBox: {
      backgroundColor: colors.main,
      borderColor: colors.main,
    },
  });

export default TodoList;