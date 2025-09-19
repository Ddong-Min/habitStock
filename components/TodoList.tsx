import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
// 1. react-native-gesture-handler에서 TouchableOpacity를 import 합니다.
import { TouchableOpacity } from "react-native-gesture-handler";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Feather } from "@expo/vector-icons"; // 핸들 아이콘을 위해 사용
import Typo from "./Typo"; // (사용자 프로젝트의 Typo 컴포넌트)
import { colors, radius, spacingX, spacingY } from "@/constants/theme"; // (사용자 프로젝트의 테마)
import { Task, TasksState, TodoListProps } from "@/types"; // (사용자 프로젝트의 타입)
import DifficultyHeader from "./DifficultyHeader"; // (사용자 프로젝트의 헤더 컴포넌트)

// 플랫 리스트에서 사용할 아이템 타입 정의
type ListItem =
  | { type: "header"; difficulty: keyof TasksState }
  | (Task & { type: "task" });

const TodoList: React.FC<TodoListProps> = ({ tasks, onDragEnd }) => {
  const flatData = useMemo(() => {
    return (Object.keys(tasks) as Array<keyof TasksState>).flatMap(
      (difficulty) => [
        { type: "header" as const, difficulty },
        ...tasks[difficulty].map((task) => ({
          ...task,
          type: "task" as const,
        })),
      ]
    );
  }, [tasks]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    // 헤더 아이템 렌더링
    if (item.type === "header") {
      return <DifficultyHeader difficulty={item.difficulty} />;
    }

    // 태스크 아이템 렌더링
    const isPositive = item.percentage.startsWith("+");

    return (
      <ScaleDecorator>
        {/* 2. 아이템 전체를 감싸던 TouchableOpacity를 View로 변경 */}
        <View
          style={[
            styles.taskContainer,
            isActive && { backgroundColor: colors.sub },
          ]}
        >
          <View style={styles.task}>
            {/* --- 왼쪽 컨텐츠 (체크박스, 텍스트 등) --- */}
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

            {/* --- 오른쪽 컨텐츠 (퍼센티지 텍스트) --- */}
            <Typo
              style={{
                color: item.percentage.startsWith("+")
                  ? colors.red100
                  : colors.blue100,
              }}
            >
              {item.completed &&
                `${isPositive ? "▲" : "▼"} ${item.percentage.substring(1)}`}
            </Typo>

            {/* 3. 드래그 핸들을 위한 작은 TouchableOpacity 추가 */}
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={styles.dragHandle}
            >
              <Feather name="menu" size={24} color="#AAAAAA" />
            </TouchableOpacity>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={flatData}
        onDragEnd={({ data }) => {
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
              const { type, ...originalTask } = item;
              newTasks[currentDifficulty].push(originalTask);
            }
          });
          onDragEnd(newTasks);
        }}
        keyExtractor={(item) =>
          item.type === "header" ? item.difficulty : item.id
        }
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._30,
    backgroundColor: colors.neutral50,
  },
  taskContainer: {
    backgroundColor: colors.white,
    padding: spacingY._20,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
    borderWidth: 1,
    borderColor: colors.sub,
  },
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    // 4. 핸들 영역을 제외한 나머지 공간을 모두 차지하도록 flex: 1 추가
    flex: 1,
    marginRight: 10,
  },
  checkBox: {
    width: spacingX._20,
    height: spacingX._20,
    borderRadius: radius._15,
    borderWidth: 2,
    borderColor: colors.sub,
    marginRight: spacingX._10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: colors.main,
    borderColor: colors.main,
  },
  // 5. 드래그 핸들 스타일 추가
  dragHandle: {
    paddingLeft: 10,
    paddingVertical: 5,
  },
});

export default TodoList;
