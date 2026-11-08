import api from '@/lib/axios';
import { Submission } from '@/types';

export interface SubmitOptions {
  signal?: AbortSignal;
  timeout?: number;
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void;
}

export interface GradingClaim {
  submissionId: number;
  ownerId: number;
  expiresAt: string;
}

export const submissionService = {
  /** Multipart submit for a course enrollment (file uploaded to Cloudinary server-side). */
  submit: async (
    enrollmentId: number,
    assignmentId: number,
    file: File | null,
    options?: SubmitOptions,
    answerText?: string
  ): Promise<Submission> => {
    const form = new FormData();
    form.append('courseEnrollmentId', String(enrollmentId));
    form.append('assignmentId', String(assignmentId));
    if (file) form.append('file', file);
    if (answerText?.trim()) form.append('answerText', answerText.trim());
    const res = await api.post<Submission>('/submissions', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: options?.signal,
      timeout: options?.timeout,
      onUploadProgress: options?.onUploadProgress,
    });
    return res.data;
  },
  getByAssignment: async (assignmentId: number): Promise<Submission[]> => {
    const res = await api.get<Submission[]>(`/submissions/assignment/${assignmentId}`);
    return res.data;
  },
  getMySubmissions: async (): Promise<Submission[]> => {
    const res = await api.get<Submission[]>('/submissions/my');
    return res.data;
  },
  acquireGradingClaim: async (submissionId: number): Promise<GradingClaim> => {
    const res = await api.post<GradingClaim>(`/submissions/${submissionId}/grading-claim`);
    return res.data;
  },
  renewGradingClaim: async (submissionId: number): Promise<GradingClaim> => {
    const res = await api.post<GradingClaim>(`/submissions/${submissionId}/grading-claim/renew`);
    return res.data;
  },
  releaseGradingClaim: async (submissionId: number): Promise<void> => {
    await api.delete(`/submissions/${submissionId}/grading-claim`);
  },
  /** Unsubmit (withdraw) own non-graded submission. */
  unsubmit: async (submissionId: number): Promise<void> => {
    await api.delete(`/submissions/${submissionId}`);
  },
};
