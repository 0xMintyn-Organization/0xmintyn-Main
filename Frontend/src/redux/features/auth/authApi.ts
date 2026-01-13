import { apiSlice } from "../api/apiSlice";
import { userLoggedIn, userLoggedOut, userRegistration } from "./authSlice";

type RegistrationResponse = {
    message: string;
    activationToken: string;
};
type RegistrationData = object;

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        //    all endpoints here 
        register: builder.mutation<RegistrationResponse, RegistrationData>({
            query: (data) => ({
                url: "user/register",
                method: "POST",
                body: data,
                credentials: "include" as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const result = await queryFulfilled;
                    const activationToken = result.data.activationToken;
                    
                    // Store in Redux
                    dispatch(userRegistration({
                        token: activationToken,
                    }));
                    
                    // Also store in localStorage for persistence
                    if (typeof window !== 'undefined' && activationToken) {
                        localStorage.setItem('activationToken', activationToken);
                    }

                } catch (error) {
                    console.log(error);

                }
            }
        }),
        activation: builder.mutation({
            // Supports both code-based and link-based activation.
            // If activation_code is null/undefined, backend will use token-only flow.
            query: ({ activation_token, activation_code }) => ({
                url: activation_code != null ? `user/activate-user` : `user/activate-link`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include" as const,
                body: JSON.stringify(
                    activation_code != null
                        ? { activation_code, activation_token }
                        : { activation_token }
                ),
            }),
        }),
        login: builder.mutation({
            query: ({ email, password }) => ({
                url: "user/login",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: { email, password },
                credentials: "include" as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const result = await queryFulfilled;
                    
                    // Save to localStorage immediately after successful login
                    if (typeof window !== 'undefined' && result.data) {
                        if (result.data.user) {
                            localStorage.setItem('user', JSON.stringify(result.data.user));
                        }
                        if (result.data.accessToken) {
                            localStorage.setItem('accessToken', result.data.accessToken);
                            localStorage.setItem('loginTimestamp', Date.now().toString());
                        }
                    }
                    
                    dispatch(userLoggedIn({
                        accessToken: result.data.accessToken,
                        user: result.data.user
                    }));

                } catch (error) {
                    console.log(error);

                }
            }
        }),
        socialAuth: builder.mutation({
            query: ({ email, avatar }) => ({
                url: "user/social-auth",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: { email,avatar },
                credentials: "include" as const,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const result = await queryFulfilled;
                    
                    // Save to localStorage immediately after successful social auth
                    if (typeof window !== 'undefined' && result.data) {
                        if (result.data.user) {
                            localStorage.setItem('user', JSON.stringify(result.data.user));
                        }
                        if (result.data.accessToken) {
                            localStorage.setItem('accessToken', result.data.accessToken);
                            localStorage.setItem('loginTimestamp', Date.now().toString());
                        }
                    }
                    
                    dispatch(userLoggedIn({
                        accessToken: result.data.accessToken,
                        user: result.data.user
                    }));

                } catch (error) {
                    console.log(error);

                }
            }
        }),
        
        logOut: builder.query({
            query: () => ({
                url: "user/logout",
                method: "GET",
                credentials: "include" as const,
            }),
            invalidatesTags: ['User'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    // Clear Redux state first
                    dispatch(userLoggedOut());
                    
                    // Clear localStorage
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('user');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('loginTimestamp');
                        localStorage.removeItem('refreshToken');
                        sessionStorage.clear();
                    }
                    
                    // Wait for backend logout to complete
                    await queryFulfilled;
                } catch (error) {
                    console.log(error);
                    // Even on error, clear local state
                    dispatch(userLoggedOut());
                    if (typeof window !== 'undefined') {
                        localStorage.clear();
                        sessionStorage.clear();
                    }
                }
            }
        }),

        forgotPassword: builder.mutation({
            query: ({ email }) => ({
                url: "user/forgot-password",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: { email },
                credentials: "include" as const,
            }),
        }),

        resetPassword: builder.mutation({
            query: ({ token, newPassword }) => ({
                url: "user/reset-password",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: { token, newPassword },
                credentials: "include" as const,
            }),
        }),


    }),
});

export const { useRegisterMutation, useActivationMutation, useLoginMutation, useSocialAuthMutation, useLogOutQuery, useForgotPasswordMutation, useResetPasswordMutation } = authApi;