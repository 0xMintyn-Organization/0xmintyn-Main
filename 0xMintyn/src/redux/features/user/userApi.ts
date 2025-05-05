import { apiSlice } from "../api/apiSlice";


export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateAvatar: builder.mutation({
            query: (formData) => ({
                url: `update-user-avatar`,
                method: 'PUT',
                body:  formData ,
                credentials: 'include' as const,
            }),
        }),
        updateBanner: builder.mutation({
            query: (formData) => ({
                    url: `update-user-banner`,
                method: 'PUT',
                body: formData,
                credentials: 'include' as const,
            }),
        }),
        editProfile: builder.mutation({
            query: ({ name }) => ({
                url: `update-user-info`,
                method: 'PUT',
                body: { name },
                credentials: 'include' as const,
            }),
        }),
        editUsername: builder.mutation({
            query: ({ username }) => ({
                url: `update-username`,
                method: 'PUT',
                body: { username },
                credentials: 'include' as const,
            }),
        }),
        updatePassword: builder.mutation({
            query: ({ oldPassword, newPassword }) => ({
                url: `change-password`,
                method: 'PUT',
                body: { oldPassword, newPassword },
                credentials: 'include' as const,
            }),
        }),
       

    }),
});

export const { useUpdateAvatarMutation, useEditProfileMutation, useUpdatePasswordMutation , useUpdateBannerMutation , useEditUsernameMutation } = userApi;