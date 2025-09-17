import React, { useMemo } from "react"; // useMemo 추가
import { View, TouchableOpacity, StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams, // RenderItemParams 타입 추가
} from "react-native-draggable-flatlist";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { Task, TasksState, TodoListProps } from "@/types";
import DifficultyHeader from "./DifficultyHeader";

// 플랫 리스트에서 사용할 아이템 타입을 정의합니다.
type ListItem =
  | { type: "header"; difficulty: keyof TasksState }
  | (Task & { type: "task" });

const TodoList: React.FC<TodoListProps> = ({ tasks, onDragEnd }) => {
  // tasks 객체가 변경될 때만 데이터를 평탄화(flatten)합니다.
  // useMemo를 사용하여 성능 최적화를 합니다.
  // 서로 다른 type의 아이템들을 하나의 배열로 합칩니다.
  /* flatData example : [{type: "header", difficulty : "easy"}, {id : 1, text : task1, type : "taks"}] */
  const flatData = useMemo(() => {
    //as Array<keyof TasksState>를 사용하여 타입을 명시적으로 지정합니다.
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

  /* 
  renderItem 함수는 RenderItemParams<ListItem> 타입을 사용하여 각 아이템을 렌더링합니다.
  item : 현재 렌더링할 아이템
  drag : 드래그 시작 함수
  isActive : 현재 아이템이 드래그 중인지 여부
  */
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
              {item.completed &&
                `${isPositive ? "▲" : "▼"} ${item.percentage.substring(1)}`}
            </Typo>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  /* DraggableFlatList의 data는 onDragEnd에서 drag and drop을 한 이후로 바뀐 순서를 복사해서 새로운 배열로써 보관합니다.
    renderItem  : 각 아이템을 어떻게 그릴지에 대한 함수
  */
  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={flatData}
        onDragEnd={({ data }) => {
          //data는 드래그가 끝난 후의 순서를 나타냅니다.
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
        renderItem={renderItem} // how to draw a single item, it says give me your item design here
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // 전체 리스트를 감싸는 컨테이너 스타일 추가
  container: {
    flex: 1,
    paddingHorizontal: spacingX._30,
  },

  taskContainer: {
    backgroundColor: colors.white,
    padding: spacingY._15,
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
});

export default TodoList;
