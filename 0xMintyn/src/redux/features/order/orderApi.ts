import { apiSlice } from "../api/apiSlice"

const ordersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
       
        getStripePublishableKey: builder.query({
            query: () => ({
                url: 'order/payment/stripepublishablekey',
                method: 'GET',
                credentials: 'include' as const
            }),
        }),
        createPaymentIntent: builder.mutation({
            query: (amount) => ({
                url: 'order/payment',
                method: 'POST',
                body: { amount },
                credentials: 'include' as const
            }),
        }),
        createOrder: builder.mutation({
            query: ({ productId, payment_info }) => ({
                url: 'order/create-order',
                method: 'POST',
                body: { productId, payment_info },
                credentials: 'include' as const
            }),
        }),
        getAllOrders: builder.query({
            query: () => ({
                url: `order/my_orders`,
                method: 'GET',
                credentials: 'include' as const,
            }),
        }),

    })
})

export const { useGetAllOrdersQuery, useCreateOrderMutation , useCreatePaymentIntentMutation, useGetStripePublishableKeyQuery } = ordersApi