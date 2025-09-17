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
            query: ({ activation_token, activation_code }) => ({
                url: `activate-user`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include" as const,
                body: JSON.stringify({ activation_code, activation_token }),
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
            async onQueryStarted(arg, { dispatch }) {
                try {
                    dispatch(userLoggedOut());

                } catch (error) {
                    console.log(error);

                }
            }
        }),


    }),
});

export const { useRegisterMutation, useActivationMutation, useLoginMutation, useSocialAuthMutation, useLogOutQuery } = authApi;