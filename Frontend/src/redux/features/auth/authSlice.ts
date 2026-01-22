import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    user: null,
    token: "",
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        userRegistration: (state, action) => {
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        userLoggedIn: (state, action) => {
            state.token = action.payload.accessToken;
            state.user = action.payload.user;
            state.isAuthenticated = true;
        },
        userLoggedOut: (state) => {
            state.token = "";
            state.user = null;
            state.isAuthenticated = false;
        },


    },
});

export const { userRegistration, userLoggedIn, userLoggedOut, setWalletAddress } = authSlice.actions;

export default authSlice.reducer;