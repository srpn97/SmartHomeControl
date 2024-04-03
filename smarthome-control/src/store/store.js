import { configureStore } from '@reduxjs/toolkit';
import devicesReducer from './devicesSlice';
import modalReducer from './modalSlice'

export const store = configureStore({
  reducer: {
    devices: devicesReducer,
    modal: modalReducer,
  },
});