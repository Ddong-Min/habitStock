import React, { useMemo } from "react"; // useMemo 추가
import { View, TouchableOpacity, StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams, // RenderItemParams 타입 추가
} from "react-native-draggable-flatlist";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import { colors } from "@/constants/theme";
import { Task, TasksState, TodoListProps } from "@/types";
import DifficultyHeader from "./DifficultyHeader";

// 플랫 리스트에서 사용할 아이템 타입을 정의합니다.
type ListItem =
  | { type: "header"; difficulty: keyof TasksState }
  | (Task & { type: "task" });

const TodoList: React.FC<TodoListProps> = ({ tasks, onDragEnd }) => {
  // tasks 객체가 변경될 때만 데이터를 평탄화(flatten)합니다.
  const flatData = useMemo(() => {
    return (Object.keys(tasks) as Array<keyof TasksState>).flatMap(
      (difficulty) => [
        // 섹션 헤더 아이템 추가
        { type: "header" as const, difficulty },
        // 해당 섹션의 태스크 아이템들 추가
        ...tasks[difficulty].map((task) => ({
          ...task,
          type: "task" as const,
        })),
      ]
    );
  }, [tasks]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    // 아이템 타입에 따라 다른 컴포넌트를 렌더링합니다.
    if (item.type === "header") {
      return <DifficultyHeader difficulty={item.difficulty} />;
    }
    const isPositive = item.percentage.startsWith("+");

    // 아이템 타입이 'task'인 경우
    return (
      <ScaleDecorator>
        <TouchableOpacity
          // 헤더는 드래그할 수 없도록 drag 함수를 태스크에만 연결합니다.
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.taskContainer,
            isActive && { backgroundColor: colors.sub },
          ]}
        >
          <View style={styles.task}>
            <View style={styles.taskLeft}>
              <View
                style={[styles.checkBox, item.completed && styles.checkedBox]}
              >
                {item.completed && (
                  <Feather name="check" size={16} color="white" />
                )}
              </View>
              <Typo>{item.text}</Typo>
            </View>
            <Typo
              style={{
                color: item.percentage.startsWith("+")
                  ? colors.red100
                  : colors.blue100,
              }}
            >
              {isPositive ? "▲" : "▼"}
              {item.percentage}
            </Typo>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={flatData}
        onDragEnd={({ data }) => {
          // 드래그가 끝난 후, 평탄화된 배열을 다시 원래의 tasks 객체 구조로 변환합니다.
          const newTasks: TasksState = {
            easy: [],
            medium: [],
            hard: [],
            extreme: [],
          };
          let currentDifficulty: keyof TasksState | null = null;

          data.forEach((item) => {
            if (item.type === "header") {
              currentDifficulty = item.difficulty;
            } else if (currentDifficulty && item.type === "task") {
              // 'type' 속성을 제거하고 원래 Task 객체만 저장합니다.
              const { type, ...originalTask } = item;
              newTasks[currentDifficulty].push(originalTask);
            }
          });
          onDragEnd(newTasks);
        }}
        // keyExtractor도 타입에 따라 다른 키를 사용해야 합니다.
        keyExtractor={(item) =>
          item.type === "header" ? item.difficulty : item.id
        }
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // 전체 리스트를 감싸는 컨테이너 스타일 추가
  container: {
    flex: 1,
    paddingHorizontal: 30,
  },

  taskContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.sub,
    // 헤더와의 구분을 위해 좌우 마진을 추가할 수 있습니다.
    // marginHorizontal: 10,
  },
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.sub,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: colors.main,
    borderColor: colors.main,
  },
});

export default TodoList;
