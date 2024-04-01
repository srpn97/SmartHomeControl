import { configureStore } from '@reduxjs/toolkit';
import devicesReducer from './devicesSlice';

export const store = configureStore({
  reducer: {
    devices: devicesReducer,
  },
});