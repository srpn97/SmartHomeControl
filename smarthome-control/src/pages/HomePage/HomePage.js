import './HomePage.scss'
import React, { useEffect, useState } from 'react'
import { motion, useIsPresent } from "framer-motion";
import { useSelector } from 'react-redux';
import { loadFromLocalStorage } from '../../store/utils.js';
import io from 'socket.io-client';

//device images

import powerstrip from '../../assets/devices/powerstrip.avif';
import smartbulb from '../../assets/devices/smartbulb.avif';
import smartplug from '../../assets/devices/smartplug.avif';
import smartswitch from '../../assets/devices/smartswitch.avif';

const HomePage = () => {


    const [devicesData, setDevicesData] = useState([]);
    const isModalClosed = useSelector(state => state.modal.isModalClosed);
    const [socket, setSocket] = useState(null);
    const [count, setCount] = useState(0);
    // const devicesDataRef = useRef(devicesData);

    const deviceImages = {
        SmartPlug: smartplug,
        SmartStrip: powerstrip,
        SmartStripChild: powerstrip,
        SmartBuld: smartbulb,
        SmartSwitch: smartswitch
        // Add other device types and their images here
    };

    //On Load and On Update Checking LocalStorage.
    useEffect(() => {
        console.log('isModalClosed', isModalClosed)
        const fetchData = () => {
            let existingDevices = loadFromLocalStorage('selectedDevices') || [];
            if (existingDevices.length > 0) {
                console.log('Existing Data', existingDevices);
                if (count === 0) {
                    getDevicesStatus(existingDevices);
                    setCount(1);
                } else {
                    sendDataToServer(existingDevices);
                }
                // setDevicesData(existingDevices);
                // sendDataToServer(existingDevices);
            }
        };
        fetchData();
        // eslint-disable-next-line
    }, [isModalClosed]);


    //establish socket connection
    // useEffect(() => {
    //     const newSocket = io('127.0.0.1:8000/ws');
    //     setSocket(newSocket);
    //     newSocket.on('connect', () => {
    //         console.log('WebSocket Connected');
    //     });
    //     newSocket.on('disconnect', () => {
    //         console.log('WebSocket Disconnected');
    //     });
    //     return () => {
    //         newSocket.disconnect();
    //     };
    // }, []);


    //used to send data on load
    // useEffect(() => {
    //     if (isSocketConnected && devicesData.length > 0) {
    //         console.log('Sending data to server...');
    //         sendDataToServer(socket, devicesData);
    //     }
    // }, [isSocketConnected, devicesData, socket]); // Depend on isSocketConnected, devicesData, and socket


    // This function gets called after the socket is confirmed to be connected
    useEffect(() => {
        const listenToSocket = () => {
            socket.on('device_status_response', (data) => {
                console.log('Received data:', data);
                // Handle data here
                setDevicesData(data);
            });
        };

        if (socket) {
            listenToSocket();
        }

        // Cleanup function to remove the listener when the component unmounts or the socket disconnects
        return () => {
            if (socket) {
                socket.off('device_status_response');
            }
        };
    }, [socket]);


    const sendDataToServer = (data) => {
        console.log(data, socket, 'sendDatatoServer')
        if (socket) {
            socket.emit('request_device_status', data);
            console.log('Data sent:', data);
        } else {
            console.log('WebSocket is not connected.');
        }
    };

    const getDevicesStatus = (data) => {
        console.log('Sending data to new API');
        const url = 'http://127.0.0.1:5000/device/details';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(jsonResponse => {
                console.log('Success:', jsonResponse);
                setDevicesData(jsonResponse);
                // Handle the jsonResponse here
            })
            .catch(error => {
                console.error('Error during fetch:', error.message);
            });
    }

    const toggleDevice = async (device) => {
        const action = device.is_on ? "off" : "on"; // Determine the action based on the current state
        const url = 'http://127.0.0.1:5000/device/control';
        const data = {
            action: action,
            ip: device.ip,
            socket_number: device.socket_number
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(jsonResponse => {
                console.log('Success:', jsonResponse);
                // getDevicesStatus(devicesData);
                // Handle the jsonResponse here
            })
            .catch(error => {
                console.error('Error during fetch:', error.message);
            });
    };

    const isPresent = useIsPresent();
    return (
        <div className='parent-container home-container'>
            <section className='section'>
                <div className='device-list'>
                    {devicesData.map((device, index) => (
                        <div key={index} className='device-info'>
                            <div className='device-img'>
                                <img src={deviceImages[device.device_type]} alt="Smart Device" />
                            </div>
                            <div className='device-content'>
                                <div className='device-name text'>
                                    {device.name}
                                </div>
                                <div className='device-control'>
                                    {/* Example toggle button, replace with your actual control logic */}
                                    {/* <button onClick={() => toggleDevice(device.ip)}>{device.is_on ? 'Turn Off' : 'Turn On'}</button> */}
                                    {device.is_on ? (
                                        <button onClick={() => toggleDevice(device, false)}>Turn Off</button> // Assume toggleDevice is your function to handle the state change
                                    ) : (
                                        <button onClick={() => toggleDevice(device, true)}>Turn On</button>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </section>
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