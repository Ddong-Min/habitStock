import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typo from "@/components/Typo";
import { spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useTheme } from "@/contexts/themeContext";
import { useNews } from "@/contexts/newsContext";
import * as newsApi from "@/api/newsApi";
import { useAuth } from "@/contexts/authContext";
interface CommentWithReaction extends newsApi.Comment {
  userReaction?: "like";
}

const NewsDetail = ({
  item,
  onBack,
}: {
  item: newsApi.NewsItem;
  onBack: () => void;
}) => {
  // --- 상태 관리 ---
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentWithReaction[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editContent, setEditContent] = useState(item.content);

  const { theme } = useTheme();
  const {
    loadMyNews,
    currentUserId,
    toggleNewsLike,
    myNewsLikes,
    followingNewsLikes,
    myNews,
    followingNews,
  } = useNews();
  const { user } = useAuth();
  const isMyNews = currentUserId === item.userId;
  const isLiked = isMyNews
    ? !!myNewsLikes[item.id]
    : !!followingNewsLikes[item.id];

  // Get the most up-to-date news item from the context
  const currentNewsItem = isMyNews
    ? myNews.find((n) => n.id === item.id)
    : followingNews.find((n) => n.id === item.id);

  const displayItem = currentNewsItem || item;

  // --- 데이터 로딩 ---
  useEffect(() => {
    loadComments();
  }, [item.id, currentUserId]);

  // 댓글 목록 로드
  const loadComments = async () => {
    try {
      const fetchedComments = await newsApi.getComments(item.userId, item.id);
      if (currentUserId) {
        const reactions = await newsApi.getUserCommentReactions(
          item.userId,
          item.id,
          currentUserId
        );
        const commentsWithReactions = fetchedComments.map((c) => ({
          ...c,
          userReaction: reactions[c.id] as "like" | undefined,
        }));
        setComments(commentsWithReactions);
      } else {
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  };

  // --- 핸들러 함수 ---

  // 뉴스 좋아요 핸들러
  const handleLikeNews = () => {
    toggleNewsLike(item.userId, item.id);
  };

  // 댓글 추가 핸들러
  const handleAddComment = async () => {
    if (!comment.trim() || !currentUserId) return;
    try {
      // NOTE: Add logic to get current user's name
      await newsApi.addComment(item.userId, item.id, {
        userId: user?.uid || "unknown", // Replace with actual user ID
        userName: user?.name || "Unknown User", // Replace with actual user name
        content: comment.trim(),
      });
      setComment("");
      await loadComments();
    } catch (error) {
      Alert.alert("오류", "댓글 작성에 실패했습니다.");
    }
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: string) => {
    Alert.alert("댓글 삭제", "이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await newsApi.deleteComment(item.userId, item.id, commentId);
            await loadComments();
          } catch (error) {
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  // 댓글 좋아요 핸들러
  const handleCommentReaction = async (commentId: string) => {
    if (!currentUserId) {
      Alert.alert("알림", "로그인이 필요합니다.");
      return;
    }
    try {
      await newsApi.toggleCommentReaction(
        item.userId,
        item.id,
        commentId,
        currentUserId,
        "like"
      );
      await loadComments();
    } catch (error) {
      Alert.alert("오류", "반응 처리에 실패했습니다.");
    }
  };

  // 뉴스 삭제 핸들러
  const handleDeleteNews = () => {
    Alert.alert("뉴스 삭제", "이 뉴스를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await newsApi.deleteNews(item.userId, item.id);
            Alert.alert("성공", "뉴스가 삭제되었습니다.");
            await loadMyNews();
            onBack();
          } catch (error) {
            Alert.alert("오류", "뉴스 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  // 뉴스 수정 핸들러
  const handleEditNews = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert("오류", "제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      await newsApi.updateNews(item.userId, item.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setEditModalVisible(false);
      Alert.alert("성공", "뉴스가 수정되었습니다.");
      await loadMyNews();
      onBack();
    } catch (error) {
      Alert.alert("오류", "뉴스 수정에 실패했습니다.");
    }
  };

  // --- 렌더링 ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.neutral200 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Typo size={18} fontWeight={"600"} color={theme.text}>
          뉴스 상세
        </Typo>
        <View style={styles.headerRightContainer}>
          {isMyNews && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                style={styles.iconButton}
              >
                <Ionicons name="pencil" size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteNews}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.detailContainer}>
          <Typo size={14} color={theme.neutral500} style={styles.date}>
            {displayItem.date}
          </Typo>
          <Typo
            size={26}
            fontWeight={"700"}
            style={styles.title}
            color={theme.text}
          >
            {displayItem.title}
          </Typo>
          <View
            style={[styles.divider, { backgroundColor: theme.neutral200 }]}
          />
          <Typo
            size={18}
            style={styles.contentText}
            fontWeight={"400"}
            color={theme.text}
          >
            {displayItem.content}
          </Typo>
        </View>

        {/* 뉴스 좋아요 섹션 */}
        <View style={styles.likeSection}>
          <TouchableOpacity
            style={[styles.likeButton, { borderColor: theme.neutral200 }]}
            onPress={handleLikeNews}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#FF4444" : theme.neutral500}
            />
            <Typo
              size={16}
              color={isLiked ? "#FF4444" : theme.neutral500}
              style={styles.likeText}
              fontWeight="600"
            >
              {displayItem.likesCount || 0}
            </Typo>
          </TouchableOpacity>
        </View>

        {/* 댓글 섹션 */}
        <View
          style={[styles.commentSection, { borderTopColor: theme.neutral200 }]}
        >
          <Typo
            size={20}
            fontWeight="600"
            style={styles.commentTitle}
            color={theme.text}
          >
            댓글 ({comments.length})
          </Typo>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Typo size={16} color={theme.neutral400}>
                아직 댓글이 없습니다.
              </Typo>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              scrollEnabled={false}
              renderItem={({ item: commentItem }) => (
                <View
                  style={[
                    styles.commentItem,
                    { borderBottomColor: theme.neutral200 },
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      <Ionicons
                        name="person-circle"
                        size={32}
                        color={theme.neutral500}
                      />
                      <View style={styles.commentUserDetails}>
                        <Typo size={15} fontWeight="600" color={theme.text}>
                          {commentItem.userName}
                        </Typo>
                        <Typo size={12} color={theme.neutral400}>
                          {new Date(
                            commentItem.createdAt.toMillis()
                          ).toLocaleString("ko-KR")}
                        </Typo>
                      </View>
                    </View>
                    {currentUserId === commentItem.userId && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(commentItem.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.neutral400}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Typo
                    size={15}
                    style={styles.commentContent}
                    color={theme.text}
                  >
                    {commentItem.content}
                  </Typo>
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      style={styles.reactionButton}
                      onPress={() => handleCommentReaction(commentItem.id)}
                    >
                      <Ionicons
                        name={
                          commentItem.userReaction === "like"
                            ? "thumbs-up"
                            : "thumbs-up-outline"
                        }
                        size={18}
                        color={
                          commentItem.userReaction === "like"
                            ? theme.blue100
                            : theme.neutral400
                        }
                      />
                      <Typo
                        size={14}
                        color={
                          commentItem.userReaction === "like"
                            ? theme.blue100
                            : theme.neutral400
                        }
                        style={styles.reactionText}
                      >
                        {commentItem.likesCount || 0}
                      </Typo>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {currentUserId && (
            <View
              style={[
                styles.commentInputContainer,
                {
                  borderColor: theme.neutral200,
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <TextInput
                style={[styles.commentInput, { color: theme.text }]}
                value={comment}
                onChangeText={setComment}
                placeholder="댓글을 입력하세요"
                placeholderTextColor={theme.neutral400}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                style={[
                  styles.commentButton,
                  { backgroundColor: theme.blue100 },
                ]}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 뉴스 수정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <Typo
              size={20}
              fontWeight="600"
              color={theme.text}
              style={styles.modalTitle}
            >
              뉴스 수정
            </Typo>
            <TextInput
              style={[
                styles.modalInput,
                { borderColor: theme.neutral200, color: theme.text },
              ]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="제목"
              placeholderTextColor={theme.neutral400}
            />
            <TextInput
              style={[
                styles.modalInput,
                styles.modalContentInput,
                { borderColor: theme.neutral200, color: theme.text },
              ]}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="내용"
              placeholderTextColor={theme.neutral400}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.neutral200 },
                ]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: theme.text }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.blue100 }]}
                onPress={handleEditNews}
              >
                <Text style={{ color: "#FFFFFF" }}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
  },
  backButton: { padding: spacingX._5 },
  headerRightContainer: { minWidth: 60, alignItems: "flex-end" },
  headerActions: { flexDirection: "row" },
  iconButton: { marginLeft: spacingX._15, padding: spacingX._5 },
  content: { flex: 1 },
  detailContainer: { padding: spacingX._20 },
  date: { marginBottom: spacingY._10 },
  title: { marginBottom: spacingY._20, lineHeight: verticalScale(34) },
  divider: { height: 1, marginBottom: spacingY._20 },
  contentText: { lineHeight: verticalScale(28) },
  likeSection: { alignItems: "center", paddingVertical: spacingY._15 },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: 20,
    borderWidth: 1,
  },
  likeText: { marginLeft: spacingX._10 },
  commentSection: { padding: spacingX._20, borderTopWidth: 8 },
  commentTitle: { marginBottom: spacingY._15 },
  emptyComments: { alignItems: "center", paddingVertical: spacingY._30 },
  commentItem: { paddingVertical: spacingY._15, borderBottomWidth: 1 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacingY._10,
  },
  commentUserInfo: { flexDirection: "row", alignItems: "center" },
  commentUserDetails: { marginLeft: spacingX._10 },
  commentContent: {
    lineHeight: verticalScale(22),
    marginLeft: spacingX._10 + 32,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: spacingY._10,
    marginLeft: spacingX._10 + 32,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  reactionText: { marginLeft: spacingX._5, fontWeight: "600" },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._15,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  commentInput: { flex: 1, height: 40, fontSize: 16 },
  commentButton: { marginLeft: 8, padding: 8, borderRadius: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: { width: "90%", padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { marginBottom: 20, textAlign: "center" },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalContentInput: { height: 150, textAlignVertical: "top" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
});

export default NewsDetail;
