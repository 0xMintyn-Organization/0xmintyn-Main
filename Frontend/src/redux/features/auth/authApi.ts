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
                    dispatch(userRegistration({
                        token: result.data.activationToken,
                    }));

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


    }),
});

export const { useRegisterMutation, useActivationMutation, useLoginMutation, useSocialAuthMutation, useLogOutQuery } = authApi;