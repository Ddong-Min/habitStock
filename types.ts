import { Firestore, Timestamp } from "firebase/firestore";
import { Icon } from "phosphor-react-native";
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ImageStyle,
  PressableProps,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};
export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};
export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;

export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type BackButtonProps = {
  style?: ViewStyle;
  iconSize?: number;
};

export type TransactionType = {
  id?: string;
  type: string;
  amount: number;
  category?: string;
  date: Date | Timestamp | string;
  description?: string;
  image?: any;
  uid?: string;
  walletId: string;
};

export type CategoryType = {
  label: string;
  value: string;
  icon: Icon;
  bgColor: string;
};
export type ExpenseCategoriesType = {
  [key: string]: CategoryType;
};

export type TransactionListType = {
  data: TransactionType[];
  title?: string;
  loading?: boolean;
  emptyListMessage?: string;
};

export type TransactionItemProps = {
  item: TransactionType;
  index: number;
  handleClick: Function;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  //   label?: string;
  //   error?: string;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  color?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

export type UserType = {
  uid: string;
  email?: string | null;
  name: string | null;
  name_lowercase?: string | null;
  image?: any;
  price?: number;
  quantity?: number;
  lastUpdated?: string;
  followersCount?: number;
  followingCount?: number;
  bio?: string; //짧은 자기소개
  isDarkMode?: boolean;
  allowAlarm?: boolean;
  duetime?: string;
  words?: string;
  registerDate?: string;
} | null;

export type UserDataType = {
  name: string;
  image?: any;
};

export type AuthContextType = {
  user: UserType;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  changeUserStock: (price: number) => void;
  isAuthLoading: boolean;
};

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type WalletType = {
  id?: string;
  name: string;
  amount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  image: any;
  uid?: string;
  created?: Date;
};

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priceChange: number;
  percentage: number;
  dueDate: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  updatedDate?: string;
  appliedPriceChange: number;
  appliedPercentage: number;
}

export interface TasksState {
  easy: Task[];
  medium: Task[];
  hard: Task[];
  extreme: Task[];
}

export interface TasksState {
  easy: Task[];
  medium: Task[];
  hard: Task[];
  extreme: Task[];
}

export interface TasksByDate {
  [date: string]: TasksState; // "2025-09-22": { easy: [...], medium: [...], ... }
}

export interface TaskTypeByDate {
  todos: TasksByDate;
  buckets: TasksByDate;
}

export interface CustomCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export interface TodoListProps {
  tasks: TasksState;
  onToggleTask: (id: string) => void; // 이 부분을 추가 또는 수정합니다.
}

export interface CustomDatePickerProps {
  onConfirm?: (selectedDate: {
    year: number;
    month: number;
    day: number;
  }) => void;
  onCancel?: () => void;
}

//chart types
export interface chartProps {
  date: string[];
  open: number[];
  close: number[];
  high: number[];
  low: number[];
  volume: number[];
}
export type CandleStickProps = {
  width?: number | undefined;
  height?: number | undefined;
  date: string[];
  open: number[];
  close: number[];
  high: number[];
  low: number[];
  volume?: number[];
  name: string[];
  clo5?: number[];
  clo20?: number[];
  clo60?: number[];
  bollinger?: number[][];
};

export type VolumeProps = {
  date: string[];
  volume: number[];
};

export type TasksContextType = {
  taskType: "todos" | "buckets";
  taskByDate: TasksByDate;
  newTaskText: string;
  selectedTaskId: string | null;
  isBottomSheetOpen: boolean;
  selectedDifficulty: keyof TasksState | null;
  showDatePicker: boolean;
  isModifyDifficultySheet: boolean;
  isAddTask: boolean;
  isEditText: boolean;
  selectedText: string;
  chooseTaskId: (taskId: string | null) => void;
  chooseDueDate: (date: string) => void;
  chooseDifficulty: (difficulty: keyof TasksState) => void;
  putTaskText: (text: string) => void;
  startModify: (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState,
    text: string
  ) => void;
  finishModify: () => void;
  addNewTask: (dueDate: string) => Promise<void>;
  deleteTask: () => Promise<void>;
  editTask: (
    mode: "task" | "difficulty" | "dueDate" | "completed",
    edit: string
  ) => void;
  completedTask: (
    taskId: string,
    difficulty: keyof TasksState
  ) => Promise<void>;
  changeBottomSheetState: () => void;
  changeShowDatePicker: () => void;
  changeDifficultySheetState: () => void;
  changeAddTaskState: () => void;
  changeEditTextState: () => void;
  changeTaskType: (type: "todos" | "buckets") => void;
};
export type StockDataType = {
  date: string;
  changePrice: number;
  changeRate: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};
export type StockDataByDateType = {
  [date: string]: StockDataType;
};

export type FriendStockType = {
  [uid: string]: StockDataByDateType;
};
