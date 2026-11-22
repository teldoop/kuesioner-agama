export type QType = 'multiple_choice' | 'slider' | 'rating' | 'card_swipe' | 'branching_choice' | 'open_text';
export interface Question {
  id: string; order_index: number; question_type: QType; title: string;
  subtitle: string | null; options: any; config: any; is_active: boolean;
}
export interface ResultType { id: string; name: string; description: string; icon: string; min_score: number }
export interface Settings {
  id: number; title: string; description: string; estimated_minutes: number; is_open: boolean; result_types?: ResultType[];
}
export interface ResponseRow { id: string; session_id: string; answers: Record<string, any>; duration_seconds: number; created_at: string }
export const TYPE_LABEL: Record<QType, string> = {
  multiple_choice: 'Pilihan (satu atau lebih)', slider: 'Slider', rating: 'Skala angka',
  card_swipe: 'Kartu geser', branching_choice: 'Pilihan bercabang', open_text: 'Jawaban teks',
};
