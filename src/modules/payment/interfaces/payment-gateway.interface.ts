export interface IPaymentGateway {
  createOrder(data: any): Promise<any>;
  verifyPayment(data: any): Promise<boolean>;
  capturePayment?(orderId: string): Promise<any>;
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
