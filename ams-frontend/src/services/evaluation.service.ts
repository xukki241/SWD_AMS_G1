import api from '@/lib/axios';
import {
  AssignmentEvaluation,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  Page,
  CriterionScore,
} from '@/types';

export interface AiGradeResponse {
  submissionId: number;
  totalScore: number;
  feedback: string;
  criteria: CriterionScore[];
}

export const evaluationService = {
  getAll: async (page = 0, size = 10): Promise<Page<AssignmentEvaluation>> => {
    const res = await api.get<Page<AssignmentEvaluation>>('/evaluations', {
      params: { page, size },
    });
    return res.data;
  },
  getById: async (id: number): Promise<AssignmentEvaluation> => {
    const res = await api.get<AssignmentEvaluation>(`/evaluations/${id}`);
    return res.data;
  },
  create: async (data: CreateEvaluationRequest): Promise<AssignmentEvaluation> => {
    const res = await api.post<AssignmentEvaluation>('/evaluations', data);
    return res.data;
  },
  gradeWithAi: async (submissionId: number): Promise<AiGradeResponse> => {
    const res = await api.post<AiGradeResponse>(`/ai-grading/submissions/${submissionId}`);
    return res.data;
  },
  gradeBatchWithAi: async (submissionIds: number[]) => {
    const res = await api.post<{ results: { submissionId: number; status: string; message: string }[] }>(
      '/ai-grading/batch', { submissionIds }
    );
    return res.data;
  },
  update: async (id: number, data: UpdateEvaluationRequest): Promise<AssignmentEvaluation> => {
    const res = await api.put<AssignmentEvaluation>(`/evaluations/${id}`, data);
    return res.data;
  },
  getBySubmission: async (submissionId: number): Promise<AssignmentEvaluation> => {
    const res = await api.get<AssignmentEvaluation>(`/evaluations/submission/${submissionId}`);
    return res.data;
  },
  publish: async (submissionId: number): Promise<AssignmentEvaluation> => {
    const res = await api.post<AssignmentEvaluation>(`/evaluations/submission/${submissionId}/publish`);
    return res.data;
  },
  getPendingEvaluations: async (page = 0, size = 10): Promise<Page<AssignmentEvaluation>> => {
    const res = await api.get<Page<AssignmentEvaluation>>('/evaluations/pending', {
      params: { page, size },
    });
    return res.data;
  },
};
