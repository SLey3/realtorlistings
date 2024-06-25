import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
import NavigationBar from "../components/Navbar";
import axios, { AxiosResponse } from "axios";


interface listings {
    id: number;
    property_name: string;
    address: string;
    price: string;
    created_at: string;
}

const ManageListings: React.FC = () => {
    const [ cookies ] = useCookies(['user']);
    const [ listings, setListings ] = useState<listings[]>([]);
    const [ loading, setLoading ] = useState(true);
    const navigate = useNavigate();

    if (!cookies.user || cookies.user.role !== 'realtor') {
        navigate("/login");
    }

    useEffect(() => {
        axios.get("/api/listings/get", {
            params: {
                realtor_id: cookies.user.id
            }
        })
        .then((res: AxiosResponse) => {
            setListings(res.data.listings);
        })
        .catch((err) => {
            console.log(err);
        })
        .finally(() => {
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="dark:text-white text-4xl transition-opacity duration-300 animate-pulse">Loading...</div>; // Render loading indicator while waiting for data
    }

    function handleArticleDelete(e: React.MouseEvent<HTMLElement>, id: number) {
        e.preventDefault();

        axios.delete(`/api/listings/delete`, {
            data: {
                listing_id: id
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            if (res.status === 200) {
                window.location.reload();
            }
        })
        .catch((err) => {
            console.log(err);
        });
    }

    return (
        <>
            <NavigationBar />
            <nav className="flex justify-center p-3 mt-4" aria-label="Dashboard ManageListings Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <a href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                            </svg>
                            Dashboard
                        </a>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Manage Listings</span>
                        </div>
                    </li>
                </ol>
            </nav>
            <div className="container mx-auto">
                <h1 className="text-6xl font-bold text-center my-10 dark:text-white underline dark:decoration-slate-400">Manage Listings</h1>
                <div id="listings" className="relative overflow-x-auto shadow-md sm:rounded-lg my-10 p-8">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Listing ID
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Property Name
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Address
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Price
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Created At
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Edit
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Delete
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((listing: listings, key: any) => {
                                return (
                                    <tr key={key} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-slate-400">
                                            {listing.id}
                                        </th>
                                        <td className="px-6 py-4">
                                            {listing.property_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {listing.address}
                                        </td>
                                        <td className="px-6 py-4">
                                            {`$${listing.price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            {listing.created_at}
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={`/dashboard/listings/edit/${listing.id}`} className="hover:cursor-pointer hover:text-cyan-300 translate-x-3 text-center">
                                                <FaPencilAlt />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href="#" onClick={(e) => {handleArticleDelete(e, listing.id)}} className="hover:text-red-300 translate-x-3 text-center">
                                                <FaRegTrashAlt />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}


export default ManageListings;