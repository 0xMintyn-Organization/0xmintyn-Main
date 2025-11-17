
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../auth/authSlice";

// Custom base query with automatic token refresh
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    let result = await fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_SERVER_URI,
        credentials: 'include',
    })(args, api, extraOptions);

    // If we get a 401, try to refresh the token
    if (result.error && result.error.status === 401) {
        console.log('Access token expired, attempting to refresh...');
        
        // Try to refresh the token
        const refreshResult = await fetchBaseQuery({
            baseUrl: process.env.NEXT_PUBLIC_SERVER_URI,
            credentials: 'include',
        })({ url: 'refreshtoken', method: 'GET' }, api, extraOptions);

        if (refreshResult.data) {
            console.log('Token refreshed successfully');
            // Retry the original request with the new token
            result = await fetchBaseQuery({
                baseUrl: process.env.NEXT_PUBLIC_SERVER_URI,
                credentials: 'include',
            })(args, api, extraOptions);
        } else {
            console.log('Token refresh failed, logging out user');
            // Refresh failed, log out the user
            api.dispatch(userLoggedOut());
        }
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        refreshToken: builder.query({
            query: () => ({
                url: 'refreshtoken',
                method: 'GET',
                credentials: 'include' ,
            }),
        }),
        loadUser: builder.query({
            query: () => ({
                url: 'me',
                method: 'GET',
                credentials: 'include',
            }),
            providesTags: ['User'],
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                try {
                    const result = await queryFulfilled;
                    
                    // Only log in if user is not already logged out
                    // Check Redux state to prevent auto-login after logout
                    const state = getState() as any;
                    const isLoggedOut = !state.auth?.isAuthenticated && !state.auth?.user;
                    
                    if (!isLoggedOut && result.data?.user) {
                        dispatch(userLoggedIn({
                            accessToken: result.data.accessToken,
                            user: result.data.user
                        }));
                    }
                } catch (error) {
                    console.log(error);
                    // On error (401, etc.), ensure user is logged out
                    dispatch(userLoggedOut());
                }
            }
        }),
    }),
})

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;    