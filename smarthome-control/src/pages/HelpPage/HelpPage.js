import './HelpPage.scss'
import React from 'react'
import { Link } from 'react-router-dom';
import { motion, useIsPresent } from "framer-motion";
import { useSelector } from 'react-redux';

const HelpPage = () => {
    const isPresent = useIsPresent();
    const { devices} = useSelector((state) => state.devices);

    return (
        <div>
            <div>Help</div>
            <Link to="/"> Home </Link>
            <ul>
                {devices.map((device, index) => (
                    // Ensure your device object structure includes a unique identifier
                    <li key={index}>{device.name}</li>
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

export default HelpPage