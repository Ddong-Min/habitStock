import { firestore } from "@/config/firebase"; // stockApi.ts와 동일한 firestore 인스턴스 import
import {
  collection,
  addDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore"; // @react-native-firebase/firestore 에서 import

/**
 * 신고 데이터 타입 정의
 * @param type - 신고 유형 (뉴스 또는 댓글)
 * @param contentId - 신고된 콘텐츠의 고유 ID
 * @param reporterUid - 신고한 사용자의 UID
 * @param reportedUid - (선택) 신고된 콘텐츠 작성자의 UID (주로 댓글에 사용)
 * @param reason - 신고 사유 (키 값)
 * @param details - (선택) '기타' 사유일 경우 상세 내용
 */
export interface ReportData {
  type: "news" | "comment";
  contentId: string;
  reporterUid: string;
  reportedUid?: string;
  reason: string;
  details?: string;
}

/**
 * Firestore 'reports' 컬렉션에 신고 데이터를 제출합니다.
 * @param data - ReportData 객체
 * @returns { success: boolean, error?: any }
 */
export const submitReport = async (data: ReportData) => {
  try {
    // 'reports' 컬렉션을 'firestore' 인스턴스를 사용해 참조
    const reportsCollection = collection(firestore, "reports");

    // 새 문서를 추가합니다.
    await addDoc(reportsCollection, {
      ...data,
      status: "pending", // 초기 상태는 'pending'(처리 대기)
      reportedAt: serverTimestamp(), // 서버 시간 기준 타임스탬프 기록
    });
    return { success: true };
  } catch (error) {
    console.error("Error submitting report: ", error);
    return { success: false, error };
  }
};
