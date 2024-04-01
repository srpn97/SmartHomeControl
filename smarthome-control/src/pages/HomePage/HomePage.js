import './HomePage.scss'
import React from 'react'
import { Link } from 'react-router-dom';
import { motion, useIsPresent } from "framer-motion";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDevices } from '../../store/devicesSlice.js';

const HomePage = () => {

    const isPresent = useIsPresent();

    const dispatch = useDispatch();
    const { devices } = useSelector((state) => state.devices);

    const handleFetchDevices = () => {
        dispatch(fetchDevices());
    };


    return (
        <div>
            <div className='content'>Home Page</div>
            <Link to="/help">Help</Link>
            <button onClick={handleFetchDevices}>
                Load Devices
            </button>
            <ul>
                {devices.map((device) => (
                    <li key={device.ip}>{device.ip}{device.name}</li> // Adjust based on your device data structure
                ))}
            </ul>
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0, transition: { duration: 0.5, ease: "circOut" } }}
                exit={{ scaleX: 1, transition: { duration: 0.8, ease: "circIn" } }}
                style={{ originX: isPresent ? 0 : 1 }}
                className="privacy-screen"
            />
        </div>
    )
}

export default HomePage