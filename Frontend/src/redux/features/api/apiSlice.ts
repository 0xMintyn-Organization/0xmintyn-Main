
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
    }),
})

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;    