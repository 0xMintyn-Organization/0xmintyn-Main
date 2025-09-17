import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    user: "",
    token: "",
    walletAddress: "",  

};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        userRegistration: (state, action) => {
            state.token = action.payload.token;

        },
        userLoggedIn: (state, action) => {
            state.token = action.payload.accessToken;
            state.user = action.payload.user;
        },
        userLoggedOut: (state) => {
            state.token = "";
            state.user = "";
            state.walletAddress = "";  
        },
        setWalletAddress: (state, action) => {
            state.walletAddress = action.payload.walletAddress;  
        },


    },
});

export const { userRegistration, userLoggedIn, userLoggedOut, setWalletAddress } = authSlice.actions;

export default authSlice.reducer;