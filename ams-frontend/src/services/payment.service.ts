import api from '@/lib/axios';
import {
  PaymentTransaction,
  PaymentUrlResponse,
  PayOSCheckoutResponse,
  SePayCheckoutResponse,
  TeacherPayment,
} from '@/types';

export const paymentService = {
  /** VNPay redirect for a course enrollment. */
  payVnPay: async (enrollmentId: number): Promise<PaymentUrlResponse> => {
    const res = await api.post<PaymentUrlResponse>(`/payment/course/create/${enrollmentId}`);
    return res.data;
  },
  /** SePay hosted-checkout form fields for a course enrollment. */
  createSePayPayment: async (enrollmentId: number): Promise<SePayCheckoutResponse> => {
    const res = await api.post<SePayCheckoutResponse>(`/payment/course/create-sepay/${enrollmentId}`);
    return res.data;
  },
  /** PayOS payment link for a course enrollment. */
  createPayOSPayment: async (enrollmentId: number): Promise<PayOSCheckoutResponse> => {
    const res = await api.post<PayOSCheckoutResponse>(`/payment/course/create-payos/${enrollmentId}`);
    return res.data;
  },
  confirmVietQr: async (enrollmentId: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>(
      `/payment/course/confirm-vietqr/${enrollmentId}`
    );
    return res.data;
  },
  getMyPayments: async (): Promise<PaymentTransaction[]> => {
    const res = await api.get<PaymentTransaction[]>('/payment/my');
    return res.data;
  },
  getTeacherPayments: async (): Promise<TeacherPayment[]> => {
    const res = await api.get<TeacherPayment[]>('/payment/teacher');
    return res.data;
  },
  handleVnpayReturn: async (params: Record<string, string>): Promise<{ success: boolean; message: string }> => {
    const res = await api.get<{ success: boolean; message: string }>('/payment/vnpay-return', { params });
    return res.data;
  },
};
