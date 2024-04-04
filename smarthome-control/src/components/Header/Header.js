import './Header.scss'
import { Link } from 'react-router-dom';
import React, { useState } from 'react'
import AddDeviceModal from '../AddDeviceModal/AddDeviceModal';
import { useDispatch } from 'react-redux';
import { closeModal } from '../../store/modalSlice'; 

const Header = () => {

    let [showAddDevice, setShowAddDevice] = useState(false);

    const showAddDeviceModal = () => {
        console.log('show Modal');
        setShowAddDevice(true);
    }

    const dispatch = useDispatch();

    const handleClose = () => {
        dispatch(closeModal());
        setShowAddDevice(false);
    }

    return (
        <div className='parent-container'>
            <div className='header-container text'>
                <div className='header section'>
                    <div className='title'>
                        Smart Home Control
                    </div>
                    <nav>
                        <ul className='d-flex nav-list'>
                            {/* <li>
                                <Link to="home">Home</Link>
                            </li>
                            <li>
                                <Link to="help">Help</Link>
                            </li> */}
                            <li onClick={showAddDeviceModal} className='add-icon'>
                                <span className='plus-sign'>+</span>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
            {showAddDevice && (
               <AddDeviceModal onClose={handleClose}></AddDeviceModal>
            )}
        </div>
    )
}

export default Header