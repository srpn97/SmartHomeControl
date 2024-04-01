import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Assuming fetchDevices is defined elsewhere using createAsyncThunk
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async () => {
    const response = await fetch('http://127.0.0.1:5000/devices');
    const data = await response.json();
    return data;
  }
);

const devicesSlice = createSlice({
  name: 'devices',
  initialState: {
    devices: [],
    loading: false,
    error: null
  },
  reducers: {
    // Your reducers here
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default devicesSlice.reducer;
