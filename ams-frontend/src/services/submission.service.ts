import api from '@/lib/axios';
import { Submission } from '@/types';

export interface SubmitOptions {
  signal?: AbortSignal;
  timeout?: number;
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void;
}

export const submissionService = {
  /** Multipart submit for a course enrollment (file uploaded to Cloudinary server-side). */
  submit: async (
    enrollmentId: number,
    assignmentId: number,
    file: File,
    options?: SubmitOptions
  ): Promise<Submission> => {
    const form = new FormData();
    form.append('courseEnrollmentId', String(enrollmentId));
    form.append('assignmentId', String(assignmentId));
    form.append('file', file);
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
  /** Unsubmit (withdraw) own non-graded submission. */
  unsubmit: async (submissionId: number): Promise<void> => {
    await api.delete(`/submissions/${submissionId}`);
  },
};
