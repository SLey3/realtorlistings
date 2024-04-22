
import React, { useState, useEffect } from "react";
import { Badge } from "flowbite-react";
import axios, { AxiosResponse } from "axios";


interface Listing {
    id: number;
    address: string;
    property_name: string;
    country: string;
    realtor: string;
    agency: string;
    price: string;    
}

interface ListingCardProps {
    listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
    const [ img, setImg ] = useState<null | any>(null);
    const [ tags, setTags ] = useState([]);
    const [ loading, setLoading ] = useState(true);


    useEffect(() => {
        axios.get('/api/listings/getimg', {
            params: {
                address: listing.address
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            const imageData = res.data.image;
    
            setImg("data:image/png;base64," + imageData);
        })
        .catch((err) => {
            // do nothing
        });
    
        axios.get('/api/listings/tags', {
            params: {
                address: listing.address
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            setTags(res.data.tags);
        })
        .catch((err) => {
            // do nothing
        })
        .finally(() => {
            setLoading(false);
        });
    }, [listing.address])

    if (loading) {
        return <div className="dark:text-white text-4xl transition-opacity duration-300 animate-pulse">Loading...</div>; // Render loading indicator while waiting for data
    }

    return (
        <>
            <div id={`card-${listing.id}`} className="card">
                <div className="mb-3 lg:card-row">
                    <div id="thumbnail-" className="card-thumbnail-sep">
                        <img src={img} alt={listing.property_name} className="backdrop-brightness-125 backdrop-contrast-150 backdrop-opacity-5 backdrop-saturate-125" />
                    </div>
                    <div id={`title-${listing.id}`} className="ml-6">
                        <h3 className="card-title-txt">{listing.property_name}</h3>
                    </div>
                </div>
                <div id={`content-${listing.id}`} className="card-body">
                    <div className="flex flex-col max-w-[136px]">
                        <h6 className="text-sm font-semibold underline text-slate-600 dark:text-white leading-tight">Address:</h6>
                        <p id={`addr-${listing.id}`} className="text-xs leading-snug indent-2 text-slate-400 dark:text-white truncate">{listing.address}</p>
                    </div>
                    <div className="flex flex-col">
                        <h6 className="text-sm font-semibold underline text-slate-600 dark:text-white leading-tight">Country:</h6>
                        <p id={`country-${listing.id}`} className="text-xs truncate leading-snug indent-2 text-slate-400 dark:text-white">{listing.country}</p>
                    </div>
                    <div className="flex flex-col">
                        <h6 className="text-sm font-semibold underline text-slate-600 dark:text-white leading-tight">Realtor:</h6>
                        <p id={`realtor-${listing.id}`} className="text-xs truncate leading-snug indent-2 text-slate-400 dark:text-white">{listing.realtor}</p>
                    </div>
                    <div className="flex flex-col">
                        <h6 className="text-sm font-semibold underline text-slate-600 dark:text-white leading-tight">Agency:</h6>
                        <p id={`agency-${listing.id}`} className="text-xs truncate leading-snug indent-2 text-slate-400 dark:text-white">{listing.agency}</p>
                    </div>
                    <div className="flex flex-col">
                        <h6 className="text-sm font-semibold underline text-slate-600 dark:text-white leading-tight">Price</h6>
                        <p id={`price-${listing.id}`} className="text-xs truncate leading-snug indent-2 text-slate-400 dark:text-white">${listing.price}</p>
                    </div>
                    <div className="flex flex-col">
                        <h6 className="mb-2 text-sm font-semibold underline text-slate-600 dark:text-white leading-tight">Tags:</h6>
                        <div className="grid grid-cols-2 gap-2">
                            {Array.isArray(tags) && tags.map((tag) => (
                                <Badge key={tag} color="indigo">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
                <div id={`link-${listing.id}`} className="flex flex-row-reverse">
                    <a href="#" className="no-underline hover:underline hover:decoration-sky-400 mr-3 mb-3 p-px after:content-['_↗'] align-top text-base font-extralight text-gray-600 hover:text-sky-400 dark:text-white align-end">See Listing (Coming Soon)</a>
                </div>
            </div>
        </>
    )
}


export default ListingCard;