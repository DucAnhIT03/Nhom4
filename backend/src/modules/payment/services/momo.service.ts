import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class MomoService {
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  private readonly returnUrl: string;
  private readonly notifyUrl: string;

  constructor() {
    // MoMo Sandbox credentials (thay đổi khi deploy production)
    this.partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    this.accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
    this.secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    this.apiUrl = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
    this.returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/callback';
    this.notifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/payments/momo/callback';
  }

  /**
   * Tạo payment link từ MoMo
   */
  async createPaymentLink(data: {
    orderId: string;
    amount: number;
    orderInfo: string;
    requestId?: string;
  }): Promise<{ payUrl: string; orderId: string }> {
    const requestId = data.requestId || `REQ${Date.now()}`;
    const orderId = data.orderId || `ORD${Date.now()}`;
    const amount = data.amount;
    const orderInfo = data.orderInfo;
    const extraData = '';

    // Tạo raw signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.returnUrl}&requestId=${requestId}&requestType=captureWallet`;

    // Tạo signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Tạo request body
    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'The Miraculous',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: this.returnUrl,
      ipnUrl: this.notifyUrl,
      lang: 'vi',
      extraData: extraData,
      requestType: 'captureWallet',
      autoCapture: true,
      orderGroupId: '',
      signature: signature,
    };

    try {
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.resultCode === 0) {
        return {
          payUrl: response.data.payUrl,
          orderId: orderId,
        };
      } else {
        throw new Error(`MoMo API error: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('MoMo payment error:', error.response?.data || error.message);
      throw new Error(`Failed to create MoMo payment: ${error.message}`);
    }
  }

  /**
   * Xác thực callback từ MoMo
   */
  verifyCallback(data: {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: string;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
  }): boolean {
    const rawSignature = `accessKey=${this.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature === data.signature;
  }
}

