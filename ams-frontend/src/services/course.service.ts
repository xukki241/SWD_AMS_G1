import api from '@/lib/axios';
import {
  CourseContent,
  CourseDetail,
  CourseListParams,
  CourseRequestPayload,
  CourseSummary,
  Lesson,
  LessonRequestPayload,
  ModuleOrderPayload,
  OutlineRequestPayload,
  OutlineResponse,
  Page,
} from '@/types';

/**
 * The API uses `@RequestPart("data")` for course writes so a thumbnail can be
 * sent in the same request. The JSON part needs its own content type or Spring
 * refuses to bind it to the DTO.
 */
function buildCourseFormData(data: CourseRequestPayload, thumbnail?: File | null) {
  const formData = new FormData();
  formData.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  );
  if (thumbnail) formData.append('thumbnail', thumbnail);
  return formData;
}

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export const courseService = {
  list: async (params: CourseListParams = {}): Promise<Page<CourseSummary>> => {
    const res = await api.get<Page<CourseSummary>>('/courses', {
      params: {
        keyword: params.keyword?.trim() || undefined,
        categoryId: params.categoryId,
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
    return res.data;
  },

  getById: async (id: number): Promise<CourseDetail> => {
    const res = await api.get<CourseDetail>(`/courses/${id}`);
    return res.data;
  },

  /** Public, read-only catalog (published courses only). Works without a token. */
  listPublic: async (params: CourseListParams = {}): Promise<Page<CourseSummary>> => {
    const res = await api.get<Page<CourseSummary>>('/public/courses', {
      params: {
        keyword: params.keyword?.trim() || undefined,
        categoryId: params.categoryId,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
    return res.data;
  },

  getPublicById: async (id: number): Promise<CourseDetail> => {
    const res = await api.get<CourseDetail>(`/public/courses/${id}`);
    return res.data;
  },

  create: async (
    data: CourseRequestPayload,
    thumbnail?: File | null
  ): Promise<CourseDetail> => {
    const res = await api.post<CourseDetail>(
      '/courses',
      buildCourseFormData(data, thumbnail),
      multipartConfig
    );
    return res.data;
  },

  update: async (
    id: number,
    data: CourseRequestPayload,
    thumbnail?: File | null
  ): Promise<CourseDetail> => {
    const res = await api.put<CourseDetail>(
      `/courses/${id}`,
      buildCourseFormData(data, thumbnail),
      multipartConfig
    );
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

export const courseContentService = {
  get: async (courseId: number): Promise<CourseContent> => {
    const res = await api.get<CourseContent>(`/courses/${courseId}/content`);
    return res.data;
  },
  getForStudent: async (courseId: number): Promise<CourseContent> => {
    const res = await api.get<CourseContent>(`/student/courses/${courseId}/content`);
    return res.data;
  },

  addModule: async (courseId: number, title: string) => {
    const res = await api.post(`/courses/${courseId}/modules`, { title });
    return res.data;
  },

  updateModule: async (moduleId: number, title: string) => {
    const res = await api.put(`/modules/${moduleId}`, { title });
    return res.data;
  },

  deleteModule: async (moduleId: number): Promise<void> => {
    await api.delete(`/modules/${moduleId}`);
  },

  addLesson: async (
    moduleId: number,
    data: LessonRequestPayload
  ): Promise<Lesson> => {
    const res = await api.post<Lesson>(`/modules/${moduleId}/lessons`, data);
    return res.data;
  },

  updateLesson: async (lessonId: number, data: LessonRequestPayload): Promise<Lesson> => {
    const res = await api.put<Lesson>(`/lessons/${lessonId}`, data);
    return res.data;
  },

  deleteLesson: async (lessonId: number): Promise<void> => {
    await api.delete(`/lessons/${lessonId}`);
  },

  reorder: async (
    courseId: number,
    modules: ModuleOrderPayload[]
  ): Promise<CourseContent> => {
    const res = await api.patch<CourseContent>(`/courses/${courseId}/content/reorder`, {
      modules,
    });
    return res.data;
  },
};

export const courseAiService = {
  /** Generates a draft only — nothing is persisted until accept(). */
  generateOutline: async (
    courseId: number,
    data: OutlineRequestPayload
  ): Promise<OutlineResponse> => {
    const res = await api.post<OutlineResponse>(`/courses/${courseId}/ai/outline`, data, {
      // The AI call can be slow; give up after 30s so the user can retry.
      timeout: 30_000,
    });
    return res.data;
  },

  acceptOutline: async (
    courseId: number,
    modules: OutlineResponse['modules']
  ): Promise<CourseContent> => {
    const res = await api.post<CourseContent>(`/courses/${courseId}/ai/outline/accept`, {
      modules,
    });
    return res.data;
  },
};
