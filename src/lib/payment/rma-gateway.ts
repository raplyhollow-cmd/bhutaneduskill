/**
 * RMA (Royal Monetary Authority) Payment Gateway Integration for Bhutan
 *
 * This module handles payment processing through Bhutan's RMA payment gateway.
 * The RMA gateway provides various payment methods including:
 * - Internet Banking
 * - Mobile Banking
 * - Card Payments
 * - QR Code Payments
 */

import crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface RMAGatewayConfig {
  // RMA API credentials
  merchantId: string;
  apiKey: string;
  apiSecret: string;

  // API endpoints
  apiUrl: string;
  redirectUrl: string;
  webhookUrl: string;

  // Environment
  isTestMode: boolean;
}

/**
 * Default configuration - load from environment variables
 */
export function getRMAConfig(): RMAGatewayConfig {
  return {
    merchantId: process.env.RMA_MERCHANT_ID || '',
    apiKey: process.env.RMA_API_KEY || '',
    apiSecret: process.env.RMA_API_SECRET || '',
    apiUrl: process.env.RMA_API_URL || 'https://api.rma.bt',
    redirectUrl: process.env.RMA_REDIRECT_URL || `${process.env.APP_URL}/payment/return`,
    webhookUrl: process.env.RMA_WEBHOOK_URL || `${process.env.APP_URL}/api/payments/webhook`,
    isTestMode: process.env.NODE_ENV !== 'production',
  };
}

// ============================================================================
// PAYMENT REQUEST TYPES
// ============================================================================

export type RMAMethod =
  | 'internet_banking'
  | 'mobile_banking'
  | 'card'
  | 'qr_code'
  | 'wallet';

export interface RMAPaymentRequest {
  // Transaction details
  referenceId: string; // Unique transaction ID from our system
  amount: number; // Amount in Ngultrum (BTN)
  currency: 'BTN' | 'USD';

  // Payment method
  paymentMethod: RMAMethod;

  // Customer details
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string;

  // URLs
  returnUrl: string; // URL to redirect after payment
  cancelUrl: string; // URL to redirect if payment cancelled

  // Additional data
  description?: string;
  metadata?: Record<string, any>;
}

export interface RMAPaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  qrCodeData?: string;
  error?: string;
  statusCode?: number;
}

export interface RMAPaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transactionId: string;
  referenceId: string;
  amount: number;
  paidAmount?: number;
  paymentMethod: RMAMethod;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// RMA GATEWAY CLASS
// ============================================================================

export class RMAGateway {
  private config: RMAGatewayConfig;

  constructor(config?: RMAGatewayConfig) {
    this.config = config || getRMAConfig();
  }

  /**
   * Generate signature for RMA API requests
   * Signature is HMAC-SHA256 hash of specific parameters
   */
  private generateSignature(params: Record<string, string>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();

    // Create signature string
    const signatureString = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    // Add API secret
    const stringToSign = signatureString + this.config.apiSecret;

    // Generate HMAC-SHA256
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, receivedSignature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(request: RMAPaymentRequest): Promise<RMAPaymentResponse> {
    try {
      // Validate request
      this.validatePaymentRequest(request);

      // Generate transaction ID (RMA format)
      const transactionId = this.generateTransactionId(request.referenceId);

      // Prepare request parameters
      const params = {
        merchant_id: this.config.merchantId,
        transaction_id: transactionId,
        amount: request.amount.toFixed(2),
        currency: request.currency,
        payment_method: request.paymentMethod,
        customer_name: request.customerName,
        customer_email: request.customerEmail || '',
        customer_phone: request.customerPhone || '',
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        webhook_url: this.config.webhookUrl,
        description: request.description || `Payment for ${request.referenceId}`,
        timestamp: Date.now().toString(),
      };

      // Generate signature
      const signature = this.generateSignature(params);

      // Call RMA API
      const apiUrl = this.buildApiUrl('/payments/initiate');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Signature': signature,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Payment initiation failed',
          statusCode: response.status,
        };
      }

      // Handle different payment methods
      if (request.paymentMethod === 'qr_code') {
        return {
          success: true,
          transactionId,
          qrCodeData: data.qr_code_data,
        };
      }

      return {
        success: true,
        transactionId,
        paymentUrl: data.payment_url || data.checkout_url,
      };
    } catch (error) {
      console.error('RMA Payment initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate payment',
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<RMAPaymentStatus | null> {
    try {
      const params = {
        merchant_id: this.config.merchantId,
        transaction_id: transactionId,
        timestamp: Date.now().toString(),
      };

      const signature = this.generateSignature(params);

      const apiUrl = this.buildApiUrl(`/payments/${transactionId}/status`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Signature': signature,
        },
      });

      if (!response.ok) {
        console.error('RMA status check failed:', response.status);
        return null;
      }

      const data = await response.json();

      return {
        status: this.mapRMAStatus(data.status),
        transactionId: data.transaction_id,
        referenceId: data.merchant_transaction_id,
        amount: parseFloat(data.amount),
        paidAmount: data.paid_amount ? parseFloat(data.paid_amount) : undefined,
        paymentMethod: data.payment_method,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        failureReason: data.failure_reason,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('RMA status check error:', error);
      return null;
    }
  }

  /**
   * Process a refund
   */
  async processRefund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const params = {
        merchant_id: this.config.merchantId,
        transaction_id: transactionId,
        refund_amount: amount ? amount.toFixed(2) : undefined,
        refund_reason: reason || 'Refund requested',
        timestamp: Date.now().toString(),
      };

      const signature = this.generateSignature(params);

      const apiUrl = this.buildApiUrl('/payments/refund');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Signature': signature,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Refund failed',
        };
      }

      return {
        success: true,
        refundId: data.refund_id,
      };
    } catch (error) {
      console.error('RMA refund error:', error);
      return {
        success: false,
        error: 'Failed to process refund',
      };
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: RMAPaymentRequest): void {
    if (!request.referenceId) {
      throw new Error('Reference ID is required');
    }

    if (request.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!['BTN', 'USD'].includes(request.currency)) {
      throw new Error('Invalid currency. Only BTN and USD are supported');
    }

    if (!request.customerName) {
      throw new Error('Customer name is required');
    }

    if (!request.returnUrl || !request.cancelUrl) {
      throw new Error('Return URL and cancel URL are required');
    }
  }

  /**
   * Generate transaction ID in RMA format
   * Format: MERCHANTID_TIMESTAMP_RANDOM
   */
  private generateTransactionId(referenceId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${this.config.merchantId}_${timestamp}_${random}`;
  }

  /**
   * Build API URL with version prefix
   */
  private buildApiUrl(endpoint: string): string {
    const baseUrl = this.config.apiUrl.replace(/\/$/, '');
    const version = this.config.isTestMode ? '/v1/test' : '/v1';
    return `${baseUrl}${version}${endpoint}`;
  }

  /**
   * Map RMA status to our internal status
   */
  private mapRMAStatus(rmaStatus: string): RMAPaymentStatus['status'] {
    const statusMap: Record<string, RMAPaymentStatus['status']> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'SUCCESS': 'completed',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded',
    };

    return statusMap[rmaStatus] || 'pending';
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create RMA gateway instance with config
 */
export function createRMAGateway(config?: RMAGatewayConfig): RMAGateway {
  return new RMAGateway(config);
}

/**
 * Get supported payment methods for display
 */
export function getSupportedPaymentMethods(): Array<{
  id: RMAMethod;
  name: string;
  description: string;
  icon: string;
}> {
  return [
    {
      id: 'internet_banking',
      name: 'Internet Banking',
      description: 'Pay using your bank internet banking',
      icon: '🏦',
    },
    {
      id: 'mobile_banking',
      name: 'Mobile Banking',
      description: 'Pay using Bhutanese mobile banking apps',
      icon: '📱',
    },
    {
      id: 'card',
      name: 'Card Payment',
      description: 'Pay with credit or debit card',
      icon: '💳',
    },
    {
      id: 'qr_code',
      name: 'QR Code Payment',
      description: 'Scan QR code to pay',
      icon: '📷',
    },
    {
      id: 'wallet',
      name: 'Mobile Wallet',
      description: 'Pay using mobile wallet',
      icon: '👛',
    },
  ];
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: 'BTN' | 'USD' = 'BTN'): string {
  const symbol = currency === 'BTN' ? 'Nu.' : '$';
  return `${symbol}${amount.toLocaleString('en-BT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
