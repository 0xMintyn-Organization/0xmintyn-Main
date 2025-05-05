import { apiSlice } from "../api/apiSlice";


export const orderApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createOrder: builder.mutation({
            query: (productId) => ({
                url: `order/create`,
                method: 'POST',
                body: productId,
                credentials: 'include' as const,
            }),
        }),
        getAllOrders: builder.query({
            query: () => ({
                url: `order/my_orders`,
                method: 'GET',
                credentials: 'include' as const,
            }),
        }),
      
    }),
});
export const { useCreateOrderMutation , useGetAllOrdersQuery } = orderApi;