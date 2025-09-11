import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  backendUrl: localStorage.getItem("fogIp") || null, // 👈 Load IP on page load
};

const backendSlice = createSlice({
  name: "backend",
  initialState,
  reducers: {
    setBackendUrl: (state, action) => {
      state.backendUrl = action.payload;
      localStorage.setItem("fogIp", action.payload); // 👈 Save IP persistently
    },
    clearBackendUrl: (state) => {
      state.backendUrl = null;
      localStorage.removeItem("fogIp");
    },
  },
});

export const { setBackendUrl, clearBackendUrl } = backendSlice.actions;
export default backendSlice.reducer;
