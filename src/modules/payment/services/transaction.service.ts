import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../schemas/transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(PaymentTransaction.name)
    private transactionModel: Model<PaymentTransactionDocument>,
  ) {}

  async createTransaction(data: Partial<PaymentTransaction>) {
    return this.transactionModel.create(data);
  }

  async findByGatewayOrderId(orderId: string, gateway: string) {
    return this.transactionModel.findOne({
      gatewayOrderId: orderId,
      paymentGateway: gateway,
    });
  }

  async updateTransactionStatus(
    transactionId: string,
    status: string,
    gatewayResponse?: any,
    gatewayPaymentId?: string,
  ) {
    return this.transactionModel.findByIdAndUpdate(
      transactionId,
      {
        status,
        ...(gatewayResponse && { gatewayResponse }),
        ...(gatewayPaymentId && { gatewayPaymentId }),
      },
      { new: true },
    );
  }

  async getUserTransactions(userId: string) {
    return this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('packageId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
