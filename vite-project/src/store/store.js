import { configureStore } from "@reduxjs/toolkit";
import backendReducer from "./backendSlice";

export const store = configureStore({
  reducer: {
    backend: backendReducer,
  },
});
