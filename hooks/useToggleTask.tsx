// hooks/useTasks.ts
import { useState } from "react";
import { Task, TasksState } from "../types";

const initialTasks: TasksState = {
  easy: [
    {
      id: "1",
      text: "Easy Task 1",
      completed: false,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "easy",
    },
    {
      id: "2",
      text: "Easy Task 2",
      completed: true,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "easy",
    },
  ],
  medium: [
    {
      id: "3",
      text: "Medium Task 1",
      completed: false,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "medium",
    },
    {
      id: "4",
      text: "Medium Task 2",
      completed: true,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "medium",
    },
  ],
  hard: [
    {
      id: "5",
      text: "Hard Task 1",
      completed: false,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "hard",
    },
    {
      id: "6",
      text: "Hard Task 2",
      completed: true,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "hard",
    },
  ],
  extreme: [
    {
      id: "7",
      text: "Extreme Task 1",
      completed: false,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "extreme",
    },
    {
      id: "8",
      text: "Extreme Task 2",
      completed: true,
      percentage: "+0%",
      date: "2024-06-01",
      difficulty: "extreme",
    },
  ],
};

export const useTasks = () => {
  // 1. useState 훅을 커스텀 훅 안에서 직접 호출합니다.
  const [tasks, setTasks] = useState<TasksState>(initialTasks);

  // 2. 상태를 변경하는 함수도 훅 내부에 정의합니다.
  //    이 함수는 더 이상 tasks, setTasks를 인자로 받을 필요가 없습니다.
  const handleToggleTask = (taskId: string) => {
    setTasks((currentTasks) => {
      // 이전 상태를 기반으로 안전하게 업데이트
      const newTasks = JSON.parse(JSON.stringify(currentTasks));
      for (const difficulty in newTasks) {
        const taskList = newTasks[difficulty as keyof TasksState];
        const taskIndex = taskList.findIndex(
          (task: { id: string }) => task.id === taskId
        );

        if (taskIndex !== -1) {
          taskList[taskIndex].completed = !taskList[taskIndex].completed;
          break;
        }
      }
      return newTasks;
    });
  };

  const changeTasks = (difficulty: keyof typeof tasks, task: Task) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [difficulty]: [...prevTasks[difficulty], task],
    }));
  };
  // 여기에 나중에 addTask, deleteTask 같은 함수들을 추가하면 됩니다.

  // 3. 컴포넌트에서 사용할 상태와 함수들을 반환합니다.
  return {
    tasks,
    handleToggleTask,
    changeTasks,
  };
};
