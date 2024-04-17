import React from 'react';
import { Navbar } from 'flowbite-react';
import { Link } from 'react-router-dom';


interface logoutProps {
    logoutHandler: CallableFunction;
}

interface loginProps {
    class_str: string;
}

export const LoginLink: React.FC<loginProps> = ({ class_str }) => {
    return (
        <li>
            <Link to="/login" className={class_str}>
                Login
            </Link>
        </li>
    )
}

export const LogOutLink: React.FC<logoutProps> = ({logoutHandler}) => {
    const handleLogout = () => {
        logoutHandler();
    };

    return (
        <>
            <Navbar.Link href="#" onClick={handleLogout}>
                Logout
            </Navbar.Link>
        </>
    )
} 