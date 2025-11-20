
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
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('loginTimestamp');
                localStorage.removeItem('refreshToken');
            }
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
                    
                    // If API returns user data, log them in
                    // On page refresh, Redux state is empty, so we trust the API response
                    if (result.data?.user) {
                        const state = getState() as any;
                        
                        // Only check Redux state if it explicitly says user is logged out
                        // On initial load, state.auth will be empty (not explicitly logged out)
                        const explicitlyLoggedOut = state.auth?.isAuthenticated === false && 
                                                     state.auth?.user === null &&
                                                     !localStorage.getItem('user'); // Also check localStorage
                        
                        // If not explicitly logged out, log in the user
                        if (!explicitlyLoggedOut) {
                            dispatch(userLoggedIn({
                                accessToken: result.data.accessToken,
                                user: result.data.user
                            }));
                            
                            // Also update localStorage for persistence
                            if (typeof window !== 'undefined') {
                                localStorage.setItem('user', JSON.stringify(result.data.user));
                                if (result.data.accessToken) {
                                    localStorage.setItem('accessToken', result.data.accessToken);
                                }
                            }
                        }
                    }
                } catch (error: any) {
                    console.log('Load user error:', error);
                    
                    // Check if it's an authentication error
                    // Backend might return 400 with "Please login" message, which is also an auth error
                    const errorStatus = error?.status || error?.error?.status;
                    const errorData = error?.data || error?.error?.data;
                    const errorMessage = typeof errorData === 'string' 
                        ? errorData 
                        : errorData?.error || errorData?.message || '';
                    
                    const isAuthError = errorStatus === 401 || 
                                       errorStatus === 403 ||
                                       (errorStatus === 400 && (
                                           errorMessage.toLowerCase().includes('login') ||
                                           errorMessage.toLowerCase().includes('authenticate') ||
                                           errorMessage.toLowerCase().includes('unauthorized') ||
                                           errorMessage.toLowerCase().includes('access')
                                       ));
                    
                    // Only log out if:
                    // 1. It's an auth error AND
                    // 2. There's actually a user logged in (check localStorage or Redux state)
                    // 3. AND the error message explicitly says to login (not just a network issue)
                    if (isAuthError) {
                        const state = getState() as any;
                        const hasUserInState = state.auth?.user || state.auth?.isAuthenticated;
                        const hasUserInStorage = typeof window !== 'undefined' && localStorage.getItem('user');
                        
                        // Only log out if there's actually a user to log out
                        // AND the error is a real auth error (not just a bad request format)
                        if ((hasUserInState || hasUserInStorage) && 
                            (errorStatus === 401 || errorStatus === 403 || 
                             errorMessage.toLowerCase().includes('login') ||
                             errorMessage.toLowerCase().includes('authenticate'))) {
                            // Clear localStorage on auth error
                            if (typeof window !== 'undefined') {
                                localStorage.removeItem('user');
                                localStorage.removeItem('accessToken');
                                localStorage.removeItem('loginTimestamp');
                                localStorage.removeItem('refreshToken');
                            }
                            dispatch(userLoggedOut());
                        }
                        // If no user is logged in, just silently fail - don't log out nothing
                        // This handles the case where /me is called before login
                    }
                    // For other errors (network, etc.), don't log out - user might still be valid
                }
            }
        }),
    }),
})

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;    