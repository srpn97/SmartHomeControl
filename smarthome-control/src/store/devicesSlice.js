import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadFromLocalStorage } from './utils'

// Assuming fetchDevices is defined elsewhere using createAsyncThunk
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async () => {
    const response = await fetch('http://127.0.0.1:5000/devices');
    const data = await response.json();
    return data.map(device => ({ ...device, selected: false }));
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
    toggleDeviceSelected: (state, action) => {
      const deviceIndex = state.devices.findIndex(device => device.id === action.payload);
      if (deviceIndex !== -1) {
        state.devices[deviceIndex].selected = !state.devices[deviceIndex].selected;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        const storedDevices = loadFromLocalStorage('selectedDevices') || [];
        state.devices = action.payload.map(device => {
          // Find if the current device is in storedDevices based on name and ip
          const isSelected = storedDevices.some(storedDevice => storedDevice.name === device.name && storedDevice.ip === device.ip);
          return { ...device, selected: isSelected };
        });
        // state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { toggleDeviceSelected } = devicesSlice.actions;
export default devicesSlice.reducer;
