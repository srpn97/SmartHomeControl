import { createSlice } from '@reduxjs/toolkit';

export const modalSlice = createSlice({
  name: 'modal',
  initialState: {
    isModalClosed: 0,
  },
  reducers: {
    closeModal: (state) => {
      state.isModalClosed = state.isModalClosed + 1; // Set isModalClosed to true when the modal closes
    },
    resetModal: (state) => {
      state.isModalClosed = 0; // Optionally, reset the modal state if needed
    },
  },
});

// Export actions
export const { closeModal, resetModal } = modalSlice.actions;

export default modalSlice.reducer;
