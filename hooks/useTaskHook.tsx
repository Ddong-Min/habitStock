// hooks/useTasks.ts
import { useState } from "react";
import { Task, TasksState } from "../types";
import { Gaussian } from "ts-gaussian";
import { addTodo, loadTodos } from "@/api/todoApi";
import { useAuth } from "@/contexts/authContext";

//difficulty headr는 첨부터 있어야 하기 때문에 초기값 설정
//아래처럼 설정하지 않으면 header가 안나타남
const initialTasks: TasksState = {
  easy: [],
  medium: [],
  hard: [],
  extreme: [],
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<TasksState>(initialTasks); //tasks : 유저의 할일을 저장하고 있는 state
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<
    keyof typeof tasks | null
  >(null); //새로운 할일을 추가할 때, 어떤 난이도의 할일인지 저장하기 위한 state
  const [newTaskText, setNewTaskText] = useState(""); //새로운 할일의 텍스트를 저장하기 위한 state

  const { user } = useAuth(); //userId를 통해 firebase에서 해당 유저의 할일들을 가져오기 위해서 uid필요

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

  const addNewTask = async () => {
    if (!newTaskText.trim()) return; // remove the whitespaces both start and end
    // call parent callback to add task

    // Add new task , task collection에 새로운 할일 추가
    // firestore에 연결하면, newTaskText만 넘기고, 잘 저장되면 결과를 받은 후에 이걸 changeTasks로 반영
    const randomWeight =
      newTaskDifficulty === "extreme"
        ? 4
        : newTaskDifficulty === "hard"
        ? 3
        : newTaskDifficulty === "medium"
        ? 2
        : 1;
    const gaussian = new Gaussian(randomWeight, 1);

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      percentage: `+${gaussian.ppf(Math.random()).toFixed(3).toString()}%`,
      date: new Date().toISOString().split("T")[0], // today's date
      difficulty: newTaskDifficulty!,
    };

    // add firebase store

    await addTodo(newTask, user!.uid!).then((res) => {
      if (res.success) {
        // only update local state if firestore update is successful
        // update local state
        // changeTasks(newTaskDifficulty!, newTask);
        changeTasks(newTaskDifficulty!, newTask);
      } else {
        // handle error (e.g., show a message to the user)
        console.error(res.msg);
      }
    });

    // reset input
    setNewTaskText("");
    setNewTaskDifficulty(null);
  };

  const loadTasks = async () => {
    // load from firestore
    loadTodos(user?.uid!).then((loadedTasks) => {
      // transform loadedTasks (array) into TasksState (grouped by difficulty)
      const groupedTasks: TasksState = {
        easy: [],
        medium: [],
        hard: [],
        extreme: [],
      };
      loadedTasks.forEach((task) => {
        groupedTasks[task.difficulty].push(task);
      });
      setTasks(groupedTasks);
    });
  };

  const makeNewTask = (text: string) => {
    setNewTaskText(text);
  };
  const selectNewTaskDifficulty = (difficulty: keyof typeof tasks) => {
    setNewTaskDifficulty(difficulty);
  };

  // 3. 컴포넌트에서 사용할 상태와 함수들을 반환합니다.
  return {
    tasks,
    newTaskText,
    newTaskDifficulty,
    handleToggleTask,
    changeTasks,
    addNewTask,
    loadTasks,
    makeNewTask,
    selectNewTaskDifficulty,
  };
};
