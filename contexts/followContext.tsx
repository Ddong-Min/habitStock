import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import * as followApi from "../api/followApi";
import { UserType } from "../types";
import { useAuth } from "./authContext";
import { useStock } from "./stockContext";
interface FollowContextType {
  // 상태
  searchQuery: string;
  searchResults: UserType[];
  suggestedUsers: UserType[];
  followingIds: Set<string>;
  loading: boolean;
  currentUserId: string | null;
  followingUsers: UserType[]; // 팔로잉 유저 정보 배열
  selectedFollowId: string | null;
  // 함수
  setSearchQuery: (query: string) => void;
  toggleFollow: (targetUserId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  refreshSuggestedUsers: () => Promise<void>;
  loadDetailFriendInfo: () => Promise<void>;
  changeSelectedFollowId: (followId: string | null) => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserType[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFollowId, setSelectedFollowId] = useState<string | null>(null);
  const { user } = useAuth();
  const { loadTodayFriendStocks, loadAllFriendStocksData } = useStock();
  const currentUserId = user?.uid || null;

  // 팔로잉 목록 실시간 업데이트

  // 나중에 cleanup할 때
  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = followApi.subscribeToFollowingList(
      currentUserId,
      (ids) => {
        setFollowingIds(ids);
      },
      (users) => {
        setFollowingUsers(users); // 예시: useState로 저장
      }
    );
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    loadTodayFriendStocks(Array.from(followingIds));
  }, [followingIds]);

  // 추천 사용자 로드
  const loadSuggestedUsers = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const users = await followApi.getSuggestedUsers(currentUserId, 10);
      setSuggestedUsers(users);
    } catch (error) {
      console.error("Error loading suggested users:", error);
    }
  }, [currentUserId]);

  //loadSuggestedUsers의 주소가 바뀌면 실행
  //이 함수가 re rendering되면 주소가 바뀌므로 다시실행됨
  //따라서 이를 막기위해서 useCallback으로 감싸서 주소가 바뀌지 않도록함
  //useCallback이 없으면 ui가 re rendering될때마다 함수가 새로 만들어지므로 주소가 바뀜
  //하지만 useCallback을 사용하면 의존성 배열이 바뀌지 않는한 함수의  주소가 바뀌지 않음
  useEffect(() => {
    loadSuggestedUsers();
  }, [loadSuggestedUsers]);

  // 사용자 검색 (Debounced)
  const searchUsers = useCallback(
    async (query: string) => {
      if (!currentUserId) return;
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        // 이름과 이메일 모두 검색
        const [nameResults, emailResults] = await Promise.all([
          followApi.searchUsersByName(query, currentUserId),
          followApi.searchUsersByEmail(query, currentUserId),
        ]);
        console.log("Name search results:", nameResults);
        console.log("Email search results:", emailResults);

        // 중복 제거
        const usersMap = new Map<string, UserType>();
        nameResults.forEach((user) => {
          if (user) {
            usersMap.set(user.uid, user);
          }
        });
        emailResults.forEach((user) => {
          if (user) {
            usersMap.set(user.uid, user);
          }
        });
        console.log("Users map after name/email search:", usersMap);
        setSearchResults(Array.from(usersMap.values()));
        console.log("Combined search results:", Array.from(usersMap.values()));
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

  // Debounced(반송된) search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500); // searchUsers 함수 호출을 500ms 지연 사용자가 타이핑을 다 쳤다고 판단되는 대기 시간

    return () => clearTimeout(timer); //searchQuery와 searchUsers가 바뀌면 타이머 초기화
  }, [searchQuery, searchUsers]); //serachUser는 필요없는거같은데 의존성 배열에 왜냐면 usecallback이라 안바뀌는데 usecallback의 의존성 배열인 currentUserId가 바뀌지 않음

  // 팔로우/언팔로우 토글 => 이따 찾아볼거 이건 왜 useCallback으로 감싸는지
  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (!currentUserId) return;

      const isCurrentlyFollowing = followingIds.has(targetUserId); // 현재 팔로우 상태 확인

      try {
        if (isCurrentlyFollowing) {
          await followApi.unfollowUser(currentUserId, targetUserId);
        } else {
          await followApi.followUser(currentUserId, targetUserId);
        }
      } catch (error) {
        console.error("Error toggling follow:", error);
        // 필요시 Alert나 Toast 추가
      }
    },
    [currentUserId, followingIds] //의존성 배열에 followingIds가 들어가있는 이유는 followingIds가 바뀌면 이 함수도 다시 만들어져야 하기 때문임 안그러면 이전 followingIds를 참조하게됨 (즉 구버전을 참조하는꼴)
  );

  // 팔로우 여부 확인
  const isFollowing = useCallback(
    (userId: string) => {
      return followingIds.has(userId);
    },
    [followingIds]
  );

  //팔로워 정보 불러오기
  const loadDetailFriendInfo = async () => {
    if (!user || !user.uid || !selectedFollowId) return;
    const userObj = followingUsers.find((u) => u?.uid === selectedFollowId);
    const startDate = userObj?.registerDate;
    loadAllFriendStocksData(selectedFollowId, startDate || "");
  };

  const changeSelectedFollowId = (followId: string | null) => {
    setSelectedFollowId(followId);
  };
  const value: FollowContextType = {
    searchQuery,
    searchResults,
    suggestedUsers,
    followingIds,
    loading,
    currentUserId,
    followingUsers,
    selectedFollowId,
    setSearchQuery,
    toggleFollow,
    isFollowing,
    refreshSuggestedUsers: loadSuggestedUsers,
    loadDetailFriendInfo,
    changeSelectedFollowId,
  };

  return (
    <FollowContext.Provider value={value}>{children}</FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
};
