import React from 'react';
import { Navbar } from 'flowbite-react';
import { Link, useNavigate } from 'react-router-dom';


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

export const LogOutLink: React.FC<logoutProps> = ({ logoutHandler }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutHandler();
        navigate("/");
    };

    return (
        <>
            <Navbar.Link href="#" className="-translate-x-3 lg:translate-x-0" onClick={handleLogout}>
                Logout
            </Navbar.Link>
        </>
    )
} 