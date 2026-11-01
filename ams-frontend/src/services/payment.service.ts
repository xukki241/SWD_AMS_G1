import api from '@/lib/axios';
import { PaymentTransaction, InitiatePaymentRequest, InitiatePaymentResponse } from '@/types';

export interface SePayCheckoutResponse {
  checkoutUrl: string;
  formFields: Record<string, string>;
  transactionRef: string;
  amount: number;
}

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
  payVnPay: async (registrationId: number): Promise<{ paymentUrl: string; transactionRef: string; amount: number }> => {
    const res = await api.post(`/payment/create/${registrationId}`);
    return res.data;
  },
  createSePayPayment: async (registrationId: number): Promise<SePayCheckoutResponse> => {
    const res = await api.post<SePayCheckoutResponse>(`/payment/create-sepay/${registrationId}`);
    return res.data;
  },
  confirmVietQr: async (registrationId: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>(`/payment/confirm-vietqr/${registrationId}`);
    return res.data;
  },
};
