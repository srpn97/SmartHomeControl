import './AddDeviceModal.scss'
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDevices, toggleDeviceSelected } from '../../store/devicesSlice';
import { saveToLocalStorage, loadFromLocalStorage } from '../../store/utils.js';
import { motion } from "framer-motion";

import kasalogo from '../../assets/brands/kasa-logo.png'
import smartrent from '../../assets/brands/smartrent-logo.svg'
import Loader from '../Loader/Loader.js';
import { closeModal } from '../../store/modalSlice'; 

//device images

import powerstrip from '../../assets/devices/powerstrip.avif';
import smartbulb from '../../assets/devices/smartbulb.avif';
import smartplug from '../../assets/devices/smartplug.avif';
import smartswitch from '../../assets/devices/smartswitch.avif';



const AddDeviceModal = ({ onClose }) => {

    const deviceImages = {
        SmartPlug: smartplug,
        SmartStrip: powerstrip,
        SmartStripChild: powerstrip,
        SmartBuld: smartbulb,
        SmartSwitch: smartswitch
        // Add other device types and their images here
    };
    const [step, setStep] = useState('chooseBrand');
    // eslint-disable-next-line
    const [selectedBrand, setSelectedBrand] = useState('');
    const dispatch = useDispatch();
    const { devices, loading } = useSelector((state) => state.devices);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Define the handler for choosing a brand
    const handleChooseBrand = (brand) => {
        setSelectedBrand(brand);
        setStep('loadingDevices');
        dispatch(fetchDevices());
    };


    const handleCloseModal = () => {
        onClose();
    };

    const handleAddDevices = () => {
        const existingDevices = loadFromLocalStorage('selectedDevices') || [];
        const selectedDevices = devices.filter(device => selectedIds.includes(device.id));
        // const newDevicesToSave = selectedDevices.map(({ name, ip }) => ({ name, ip }));
        const combinedDevices = [...existingDevices, ...selectedDevices].reduce((acc, current) => {
            const x = acc.find(item => item.name === current.name && item.ip === current.ip);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        // Save the merged list back to local storage
        saveToLocalStorage('selectedDevices', combinedDevices);

        selectedDevices.forEach(device => {
            dispatch(toggleDeviceSelected(device.id));
        });
        dispatch(closeModal());
        handleCloseModal();
    };

    const whileHover = { scale: 1.05, boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.5)' };
    const whileTap = { scale: 0.95 };

    const [selectedIds, setSelectedIds] = useState([]);

    const handleChange = (id) => (event) => {
        if (event.target.checked) {
            setSelectedIds(prevIds => [...prevIds, id]); // Add ID if checked
        } else {
            setSelectedIds(prevIds => prevIds.filter(prevId => prevId !== id)); // Remove ID if unchecked
        }
        // dispatch(toggleDeviceSelected(id));
    };


    return (
        <div className='parent-container add-device-modal'>
            <div className='modal-content'>
                {/* Conditional rendering based on the `step` state */}
                {step === 'chooseBrand' && (
                    <div className='choose-brand'>
                        <div className='brand-choice'>
                            <motion.img
                                src={kasalogo} // Replace with the path to your Kasa image
                                alt="Kasa by TP-Link"
                                whileHover={whileHover}
                                whileTap={whileTap}
                                onClick={() => handleChooseBrand('Kasa')}
                                className="brands"
                                style={{ cursor: 'pointer', borderRadius: '10px' }} // Add borderRadius if you want rounded corners
                            />
                            <motion.img
                                src={smartrent} // Replace with the path to your SmartRent image
                                alt="SmartRent"
                                whileHover={whileHover}
                                whileTap={whileTap}
                                className="brands"
                                onClick={() => handleChooseBrand('SmartRent')}
                                style={{ cursor: 'pointer', borderRadius: '10px' }} // Add borderRadius for rounded corners
                            />
                        </div>
                        <motion.div
                            whileHover={whileHover}
                            whileTap={whileTap}
                            className='cancel-btn text'
                            onClick={() => handleCloseModal()}
                            style={{ cursor: 'pointer', borderRadius: '10px' }}
                        >
                            Cancel
                        </motion.div>
                    </div>
                )}

                {step === 'loadingDevices' && loading && (
                    <div className='loader'>
                        <Loader></Loader>
                        <div className='text'>searching for devices in your local network...</div>
                    </div>
                )}

                {step === 'loadingDevices' && !loading && (
                    <div>
                        <ul className='device-list-container text'>
                            {devices
                                .filter(device => !device.selected) // Filter to only include devices that are not selected
                                .map((device, index) => (
                                    <li className='info-container' key={index}>
                                        <div className='info-check'>
                                            <input type="checkbox" checked={selectedIds.includes(device.id)} onChange={handleChange(device.id)} />
                                        </div>
                                        <div className='info-image'>
                                            <img src={deviceImages[device.device_type]} alt="Smart Device" />
                                        </div>
                                        <div className='info-name'>
                                            {device.name}
                                        </div>
                                    </li>
                                ))}
                        </ul>
                        <div className='final-btns'>
                            <motion.div
                                whileHover={whileHover}
                                whileTap={whileTap}
                                className='add-btn text'
                                onClick={() => handleAddDevices(devices)}
                                style={{ cursor: 'pointer', borderRadius: '10px' }}
                            >
                                Add Devices
                            </motion.div>
                            <motion.div
                                whileHover={whileHover}
                                whileTap={whileTap}
                                className='cancel-btn final-btn text'
                                onClick={() => handleCloseModal()}
                                style={{ cursor: 'pointer', borderRadius: '10px' }}
                            >
                                Cancel
                            </motion.div>
                        </div>

                        {/* Implement additional logic to select and add specific devices */}
                    </div>
                )}
            </div>
        </div>
    );
};



export default AddDeviceModal;
