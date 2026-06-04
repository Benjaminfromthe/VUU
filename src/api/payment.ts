import { supabase } from '../lib/supabase';

interface InitiatePaymentParams {
  amount: number;
  phone_number: string;
  ride_id: string;
}

interface PaymentResponse {
  status: 'success' | 'failed';
  message: string;
  ref?: string;
  amount?: number;
  phone?: string;
  operator?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Invokes the 'pay-ride' Supabase Edge Function to securely process MTM MoMo or Airtel Money payments.
 * @param params Object containing ride details & recipient phone number
 * @returns Server-side response payload containing transaction reference status
 */
export async function initiateRwandaMomoPayment({
  amount,
  phone_number,
  ride_id,
}: InitiatePaymentParams): Promise<PaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('pay-ride', {
      body: {
        amount,
        phone_number,
        ride_id,
      },
    });

    if (error) {
      console.error('[Supabase Function Invoke Error]:', error);
      return {
        status: 'failed',
        message: error.message || 'Mobile Money request invocation failed.',
        error: error.message,
      };
    }

    return data as PaymentResponse;
  } catch (err: any) {
    console.error('[initiateRwandaMomoPayment Exception]:', err);
    return {
      status: 'failed',
      message: err.message || 'An unexpected networking exception occurred.',
      error: err.toString(),
    };
  }
}
