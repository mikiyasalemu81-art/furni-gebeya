/**
 * Payment Service Interface
 * Prepared for pluggable payment gateways (e.g., Chapa, Telebirr, CBE Birr)
 * Without implementing Chapa right now as specified in the prompt.
 */

export interface InitializePaymentParams {
  userId: string;
  userEmail?: string;
  userPhone: string;
  userName: string;
  amount: number;
  currency: "ETB" | "USD";
  planName: string;
  callbackUrl: string;
  returnUrl: string;
  customization?: {
    title: string;
    description: string;
    logo?: string;
  };
}

export interface PaymentInitResult {
  checkoutUrl: string;
  txRef: string;
  status: "pending" | "success" | "failed";
}

export interface VerifyPaymentResult {
  txRef: string;
  status: "success" | "failed" | "pending";
  amount: number;
  currency: string;
  reference: string;
  paymentMethod: string;
  paidAt?: string;
}

export interface PaymentGatewayService {
  name: string;
  initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult>;
  verifyPayment(txRef: string): Promise<VerifyPaymentResult>;
  handleWebhook(payload: Record<string, any>, signature: string): Promise<VerifyPaymentResult | null>;
}

/**
 * Placeholder implementation of the Chapa Payment Gateway.
 * Fully typed and ready for Chapa API keys and webhook integration in the future.
 */
export class ChapaPaymentGateway implements PaymentGatewayService {
  name = "Chapa";

  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult> {
    const txRef = `furni-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    // Placeholder returning checkout URL structure
    return {
      checkoutUrl: `https://checkout.chapa.co/checkout/payment-placeholder/${txRef}`,
      txRef,
      status: "pending",
    };
  }

  async verifyPayment(txRef: string): Promise<VerifyPaymentResult> {
    return {
      txRef,
      status: "pending",
      amount: 500,
      currency: "ETB",
      reference: txRef,
      paymentMethod: "chapa_pending",
    };
  }

  async handleWebhook(payload: Record<string, any>, signature: string): Promise<VerifyPaymentResult | null> {
    // Verified when webhook secret is provided
    return null;
  }
}

export const defaultPaymentGateway: PaymentGatewayService = new ChapaPaymentGateway();
