import React from 'react';
import { useCookies } from 'react-cookie';
import { Navbar, Flowbite, DarkThemeToggle } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { LoginLink, LogOutLink } from './AuthComponents';

const NavigationBar: React.FC = () => {
    const [cookies, setCookie, removeCookie] = useCookies(['user']);


    function handleLogout() {
        // use axios to have the backend handle the logout on its side (maybe?)
        removeCookie("user");
    }
    
    return (
        <>
            <Navbar fluid rounded className="dark:bg-slate-700">
                <Navbar.Brand  href="#">
                    <img src='/logo.png' className="h-10 mr-3 sm:h-20" alt="RealEstateListingsLogo" />
                    <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">RealtorListings</span>
                </Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <li>
                        <Link to="/" className="text-gray-700 border-b border-gray-100 md:p-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link to="/about" className="text-gray-700 border-b border-gray-100 md:p-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                            About
                        </Link>
                    </li>
                    {cookies.user ?
                    <li>
                        <Link to="/listings" className="text-gray-700 border-b border-gray-100 md:p-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                            Listing
                        </Link>
                    </li>
                    : ""}
                    {cookies.user ? <LogOutLink logoutHandler={handleLogout} /> : <LoginLink class_str="text-gray-700 border-b border-gray-100 md:p-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white" />}
                    <li>
                        {cookies.user ? 
                        <Link to="/dashboard" className="text-gray-700 border-b border-gray-100 md:p-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                            My Dashboard
                        </Link>
                        : ""}
                    </li>
                   <Flowbite>
                        <DarkThemeToggle />
                    </Flowbite>
                </Navbar.Collapse>
            </Navbar>
        </>
    )
}

export default NavigationBar;