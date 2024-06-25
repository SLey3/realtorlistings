import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Badge } from 'flowbite-react';
import { useCookies } from 'react-cookie';
import NavigationBar from './Navbar';
import axios, { AxiosResponse, AxiosError } from 'axios';


interface Listing {
    id: number;
    property_name: string;
    address: string;
    realtor: string;
    agency: string;
    description: string;
    price: number;
    town: string;
    zip: string;
    country: string;
    state: string;
    url: string;
    status: string;
    type: string;   
}

const SeeListings: React.FC = () => {
    const [ listing, setListing ] = useState({});
    const [ img, setImg ] = useState<null | any>(null);
    const [ tags, setTags ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    const [ searchParams ] = useSearchParams();
    const [ cookies ] = useCookies(['user']);
    const navigate = useNavigate();

    if(!cookies.user) {
        navigate("/login");
    }

    useEffect(() => {
        let id = searchParams.get("id");

        axios.get("/api/listings/get/one", {
            params: {
                listing_id: id
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            setListing(res.data.listing);
        })
        .catch((err: AxiosError) => {
            console.error("Error on GET request to /api/listings/get/one: ", err, "\n Message: ", err.message);
        });
    }, []);

    useEffect(() => {
        axios.get("/api/listings/getimg", {
            params: {
                address: (listing as Listing).address
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            setImg("data:image/png;base64," + res.data.image);
        })
        .catch((err: AxiosError) => {
            console.error("Error on GET request to /api/listings/getimg: ", err, "\n Message: ", err.message);
        });

        axios.get("/api/listings/tags", {
            params: {
                address: (listing as Listing).address
            },
            headers: {
                'Content-Type' : 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            setTags(res.data.tags);
        })
        .catch((err: AxiosError) => {
            console.error("Error on GET request to /api/listings/tags: ", err, "\n Message: ", err.message);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [listing]);

    if (loading) {
        return (
            <>
                <NavigationBar />
                <div className="relative top-48 left-40 -translate-x-20 text-center dark:text-white text-8xl transition-opacity duration-300 animate-pulse">Loading...</div>;
            </>
        );
    }

    return (
        <>
            <NavigationBar />
            <div className="grid md:grid-cols-2 gap-y-14 gap-x-16 hover:gap-y-10 items-stretch justify-items-center mt-20">
                <div className="md:col-span-2">
                    <img src={img} alt={(listing as Listing).property_name} className="backdrop-brightness-150 drop-shadow-lg rounded-md saturate-200 backdrop-contrast-125 w-[75vw] h-3/4" />
                </div>
                <div className="md:col-span-2">
                    <h1 className="text-2xl text-slate-400 dark:text-white antialiased italic md:not-italic">{(listing as Listing).property_name}</h1>
                </div>

                <div className="md:col-span-2 translate-x-20 md:translate-x-0">
                    <h2 className="text-xl text-slate-300 dark:text-white underline underline-offset-4">Property Address:</h2>
                    <p className="pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased text-balance">
                        {(listing as Listing).address} {(listing as Listing).town} {(listing as Listing).state} {(listing as Listing).country} {(listing as Listing).zip}
                    </p>
                </div>
                <div>
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">Realtor:</h2>
                    <p className="pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased">{(listing as Listing).realtor}</p>
                </div>
                <div>
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">Agency:</h2>
                    <p className="pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased">{(listing as Listing).agency}</p>
                </div>
                <div className="md:col-span-2">
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2 text-center">Description:</h2>
                    <p className="px-6 indent-3 pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased hyphens-none md:hyphens-auto leading-7">{(listing as Listing).description}</p>
                </div>
                <div>
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">Price:</h2>
                    <p className="pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased">${`${(listing as Listing).price}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                </div>
                <div>
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">Status:</h2>
                    <p className="pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased">{(listing as Listing).status}</p>
                </div>
                <div>
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">Type:</h2>
                    <p className="pt-3 text-lg text-slate-200 dark:text-white subpixel-antialiased">{(listing as Listing).type}</p>
                </div>
                <div>
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">Tags:</h2>
                    <div className="pt-3 flex flex-wrap">
                        {tags.map((tag: string, index: number) => {
                            return (
                                <Badge key={index} className="mr-3 mb-3">{tag}</Badge>
                            );
                        })}
                    </div>
                </div>
                <div className="md:col-span-2 -translate-x-10 md:translate-x-0">
                    <h2 className="text-xl text-slate-300 dark:text-white border-b-2">URL:</h2>
                    <a href={(listing as Listing).url} className="pt-3 text-lg after:content-['_↗'] text-slate-200 dark:text-white hover:underline hover:decoration-sky-200 hover:text-sky-200" target="_blank" rel="noreferrer">to agency site</a>
                </div>
            </div>
        </>
    );
}

export default SeeListings;