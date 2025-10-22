export interface IPaymentGateway {
  createOrder(data: any): Promise<any>;
  verifyPayment(
    data: any,
  ): Promise<{ success: boolean; transactionId?: string }>;
  capturePayment(orderId: string): Promise<any>;
  refundPayment(transactionId: string): Promise<any>;
}

export interface CreateSubscriptionData {
  userId: string;
  packageId: string;
  billingCycle: 'monthly' | 'yearly' | 'biannually' | 'quarterly';
  transactionId: string;
  paymentGateway: string;
  autoRenew?: boolean;
  //   duration?: number;
}
