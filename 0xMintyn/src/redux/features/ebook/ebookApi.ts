import { apiSlice } from "../api/apiSlice";



export const productApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createProduct: builder.mutation({
            query: (formData) => ({
                url: `product/create`,
                method: 'POST',
                body: formData,
                credentials: 'include' as const,
            }),
        }),
        getAllProductsByUser : builder.query({
            query: () => ({
                url: `product/all/user`,
                method: 'GET',
                credentials: 'include' as const,
            }),
        }),
        getAllProducts: builder.query({
            query: () => ({
                url: `product/all`,
                method: 'GET',
                credentials: 'include' as const,
            }),
        }),
        getAllProductsByPagination: builder.query({
            query: ({ page = 1, search = '', category = '', sort = '' }) => {
                const params = new URLSearchParams();

                params.append('page', page.toString());
                if (search) params.append('search', search);
                if (category) params.append('category', category);
                if (sort) params.append('sortBy', sort);

                return {
                    url: `product/all/pagination?${params.toString()}`,
                    method: 'GET',
                    credentials: 'include' as const,
                };
            },
        }),

        updateProduct: builder.mutation({
            query: ({ id, formData }) => ({
                url: `product/${id}`,
                method: 'PUT',
                body: formData,
                credentials: 'include' as const,
            }),
        }),
        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `product/${id}`,
                method: 'DELETE',
                credentials: 'include' as const,
            }),
        }),
        
    }),
});

export const { useCreateProductMutation, useUpdateProductMutation, useGetAllProductsByPaginationQuery , useGetAllProductsByUserQuery, useGetAllProductsQuery , useDeleteProductMutation } = productApi;