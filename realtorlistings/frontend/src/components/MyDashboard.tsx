import React from "react";
import { useCookies } from "react-cookie";
import { Link } from "react-router-dom";
import NavigationBar from "./Navbar";


const MyDashboard: React.FC = () => {
    const [ cookies ] = useCookies(['user']);

    if (!cookies.user) {
        window.location.href = "/login";   
    }

    return (
        <>
            <NavigationBar />
            <nav className="flex justify-center p-3 mt-4" aria-label="Dashboard Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li aria-current="page">
                        <div className="flex items-center">
                        <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                        </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Dashboard</span>
                        </div>
                    </li>
                </ol>
            </nav>
            <div className={`${cookies.user.role == 'realtor' ? 'block' : 'hidden'} container mx-auto`}>
                <h1 className="text-6xl font-bold text-center my-10 dark:text-white underline dark:decoration-slate-400">My Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h2 className="text-xl font-bold">My Listings</h2>
                        <p className="text-sm">Manage your listings</p>
                        <Link to="/dashboard/listings" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">Manage Listings</Link>
                    </div>
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h2 className="text-xl font-bold">Create Listing</h2>
                        <p className="text-sm">Create a new listing</p>
                        <Link to="/listings/create" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">Create Listing</Link>
                    </div>
                </div>
            </div>
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h2 className="text-xl font-bold">My Account</h2>
                        <p className="text-sm">Manage your account</p>
                        <Link to="#" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">Manage Account (Coming Soon)</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MyDashboard;