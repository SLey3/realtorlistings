import React from 'react';
import { useCookies } from 'react-cookie';
import { Link } from 'react-router-dom';
import NavigationBar from "../components/Navbar";

const Home: React.FC = () => {
    const [ cookies ] = useCookies(["user"]);

    const backgroundImageStyle = {
        background: `url('/logo.png') center no-repeat`,
        backgroundBlendMode: 'multiply',
        backgroundColor: '#4A5568', // Fallback color if the image fails to load
    };

    return (
        <>
            <NavigationBar />
            <section className="bg-center bg-no-repeat bg-blend-multiply" style={backgroundImageStyle}>
                <div className="max-w-screen-xl px-4 py-24 mx-auto text-center lg:py-56">
                    <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-white md:text-5xl lg:text-6xl">Finding your new Home</h1>
                    <p className="mb-8 text-lg font-normal text-gray-300 lg:text-xl sm:px-16 lg:px-48">Here at RealtorListings, we believe you deserve the right home and should find it easily.</p>
                    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
                        <Link className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" to={cookies.user ? "/listings" : "/register"}>
                            {cookies.user ?  "Listings" : "Get started" }
                            <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                            </svg>
                        </Link>
                        <Link className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white border border-white rounded-lg hover:text-gray-900 sm:ms-4 hover:bg-gray-100 focus:ring-4 focus:ring-gray-400" to="/about">
                            Learn more
                        </Link>  
                    </div>
                </div>
            </section>
        </>
    )
}

export default Home;
