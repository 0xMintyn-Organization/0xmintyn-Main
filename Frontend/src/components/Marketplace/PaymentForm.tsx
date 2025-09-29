/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useCreateOrderMutation } from '@/redux/features/order/orderApi';

interface PaymentFormProps {
    clientSecret: string;
    productId: string;  
    setProductId ?: (id: string) => void; 
}


const PaymentForm: React.FC<PaymentFormProps> = ({ clientSecret, productId, setProductId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();

    const [isProcessing, setIsProcessing] = useState(false);

    const [createOrder, { isLoading , isSuccess , error }] = useCreateOrderMutation();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            setIsProcessing(false);
            return;
        }
        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (error) {
            toast({
                title: 'Payment Error',
                description: error.message || 'Payment failed',
                variant: 'destructive',
            });
            setIsProcessing(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            try {
                await createOrder({
                    productId,
                    payment_info: paymentIntent, 
                }).unwrap();
                setProductId(''); 


                toast({
                    title: 'Payment Successful',
                    description: 'Your order has been created successfully!',
                    variant: 'default',
                });
            } catch (orderError: any) {
                toast({
                    title: 'Order Error',
                    description: orderError?.data?.message || 'Failed to create order',
                    variant: 'destructive',
                });
            }
        }

        setIsProcessing(false);
    };

    useEffect(() => {
 

        if (error) {
            if ('data' in error) {
                const errorMessage = error as any
                toast({
                    title: 'Error',
                    description: errorMessage?.data?.message || 'An error occurred',
                    variant: 'destructive',
                });
            }
        }
        if (isSuccess) {
            toast({
                title: 'Order Created',
                description: 'Your order has been created successfully!',
                variant: 'default',
            });
        }
    }, [toast, isSuccess , error])

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-background rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Complete Your Payment</h3>

            <div className="p-4 border border-gray-300 dark:border-zinc-700 rounded-md shadow-sm">
                <CardElement
                    className="p-2 rounded-md text-gray-700 dark:text-gray-300 dark:bg-zinc-900"
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#333',
                                '::placeholder': { color: '#888' },
                                fontFamily: 'Arial, sans-serif',
                                padding: '10px',
                            },
                            invalid: {
                                color: '#dc2626', // Red color for errors
                            },
                        },
                    }}
                />
            </div>

            <Button
                type="submit"
                disabled={!stripe || isProcessing || isLoading}
                className={`w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ${isProcessing || isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
            >
                {isProcessing || isLoading ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    'Pay Now'
                )}
            </Button>
        </form>
    
    );
};

export default PaymentForm;
