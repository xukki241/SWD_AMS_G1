import api from '@/lib/axios';
import { PaymentTransaction, InitiatePaymentRequest, InitiatePaymentResponse } from '@/types';

export const paymentService = {
  initiate: async (data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
    const res = await api.post<InitiatePaymentResponse>('/payment/initiate', data);
    return res.data;
  },
  getByRegistration: async (classRegistrationId: number): Promise<PaymentTransaction[]> => {
    const res = await api.get<PaymentTransaction[]>(
      `/payment/registration/${classRegistrationId}`
    );
    return res.data;
  },
  getById: async (id: number): Promise<PaymentTransaction> => {
    const res = await api.get<PaymentTransaction>(`/payment/${id}`);
    return res.data;
  },
  handleVnpayReturn: async (params: Record<string, string>): Promise<PaymentTransaction> => {
    const res = await api.get<PaymentTransaction>('/payment/vnpay-return', { params });
    return res.data;
  },
};
