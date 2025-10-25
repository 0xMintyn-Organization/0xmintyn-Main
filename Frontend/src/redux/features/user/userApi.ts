/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiSlice } from "../api/apiSlice";
import { userLoggedIn } from "../auth/authSlice";


export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateAvatar: builder.mutation({
            query: (formData) => ({
                url: `update-user-avatar`,
                method: 'PUT',
                body:  formData ,
                credentials: 'include' as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const result = await queryFulfilled;
                    const state: any = getState();
                    dispatch(userLoggedIn({
                        accessToken: state.auth.token,
                        user: result.data.user
                    }));
                } catch (error) {
                    console.log(error);
                }
            }
        }),
        updateBanner: builder.mutation({
            query: (formData) => ({
                    url: `update-user-banner`,
                method: 'PUT',
                body: formData,
                credentials: 'include' as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const result = await queryFulfilled;
                    const state: any = getState();
                    dispatch(userLoggedIn({
                        accessToken: state.auth.token,
                        user: result.data.user
                    }));
                } catch (error) {
                    console.log(error);
                }
            }
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
        updateSocialAccount: builder.mutation({
            query: ({ platform, username }) => ({
                url: `update-social-account`,
                method: 'PUT',
                body: { platform, username },
                credentials: 'include' as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const result = await queryFulfilled;
                    const state: any = getState();
                    dispatch(userLoggedIn({
                        accessToken: state.auth.token,
                        user: result.data.user
                    }));
                } catch (error) {
                    console.log(error);
                }
            }
        }),
        removeSocialAccount: builder.mutation({
            query: ({ platform }) => ({
                url: `remove-social-account`,
                method: 'DELETE',
                body: { platform },
                credentials: 'include' as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const result = await queryFulfilled;
                    const state: any = getState();
                    dispatch(userLoggedIn({
                        accessToken: state.auth.token,
                        user: result.data.user
                    }));
                } catch (error) {
                    console.log(error);
                }
            }
        }),

    }),
});

export const { useUpdateAvatarMutation, useEditProfileMutation, useUpdatePasswordMutation , useUpdateBannerMutation , useEditUsernameMutation, useUpdateSocialAccountMutation, useRemoveSocialAccountMutation } = userApi;