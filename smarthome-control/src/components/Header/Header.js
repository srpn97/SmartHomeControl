import './Header.scss'
import { Link } from 'react-router-dom';
import React from 'react'

const Header = () => {
    return (
        <div className='parent-container'>
            <div className='header text'>
                <div className='title'>
                    Smart Home Control
                </div>
                <nav>
                    <ul className='d-flex'>
                        <li>
                            <Link to="home">Home</Link>
                        </li>
                        <li>
                            <Link to="help">Help</Link>
                        </li>
                        <li>
                            Add Devices
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}

export default Header