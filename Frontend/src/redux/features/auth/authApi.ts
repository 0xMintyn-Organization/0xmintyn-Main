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
                url: "register",
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
                url: activation_code != null ? `activate-user` : `activate-link`,
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
                url: "login",
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

                    // Log role and marketplace_role on login (for verification)
                    if (result.data?.user) {
                        const u = result.data.user as { role?: string; marketplace_role?: string | null };
                        console.log('[Login] role:', u.role ?? '—', '| marketplace_role:', u.marketplace_role ?? '—');
                    }
                } catch (error) {
                    console.log(error);

                }
            }
        }),
        socialAuth: builder.mutation({
            query: ({ email, avatar }) => ({
                url: "social-auth",
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
                url: "logout",
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
                    // Suppress 400 errors when user is not logged in (expected behavior)
                    try {
                        await queryFulfilled;
                    } catch (error: any) {
                        // 400 error is expected when user is not logged in - silently handle it
                        if (error?.status === 400 || error?.error?.status === 400) {
                            // User was already logged out, this is fine
                            return;
                        }
                        throw error; // Re-throw other errors
                    }
                } catch (error: any) {
                    // Only log non-400 errors (400 means user wasn't logged in, which is fine)
                    if (error?.status !== 400 && error?.error?.status !== 400) {
                        console.log('Logout error:', error);
                    }
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
                url: "forgot-password",
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
                url: "reset-password",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: { token, newPassword },
                credentials: "include" as const,
            }),
        }),

        completeStartupOnboarding: builder.mutation<{ success: boolean; user: any; message: string }, { startupName?: string; startupDescription?: string } | void>({
            query: (body = {}) => ({
                url: "me/onboarding/startup",
                method: "PUT",
                body: body || {},
                credentials: "include" as const,
            }),
            invalidatesTags: ['User'],
        }),
        completeContributorOnboarding: builder.mutation<{ success: boolean; user: any; message: string }, void>({
            query: () => ({
                url: "me/onboarding/contributor",
                method: "PUT",
                credentials: "include" as const,
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const { useRegisterMutation, useActivationMutation, useLoginMutation, useSocialAuthMutation, useLogOutQuery, useForgotPasswordMutation, useResetPasswordMutation, useCompleteStartupOnboardingMutation, useCompleteContributorOnboardingMutation } = authApi;