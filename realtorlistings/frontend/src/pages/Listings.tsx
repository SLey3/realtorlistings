// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, FloatingLabel } from 'flowbite-react';
import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import $ from 'jquery';
import { useCookies } from 'react-cookie';
import ListingsFilters from '../components/ListingsFilter';
import ListingCard from '../components/ListingCards';
import NavigationBar from '../components/Navbar';
import axios, { AxiosResponse } from 'axios';

const Listings: React.FC = () => {
    const [ cookies ] = useCookies(['user']);
    const [ listings, setListings ] = useState([{}]);
    const [ searchInput, setSearchInput ] = useState('');
    const [ filterStatus, setFilterStatus ] = useState(false);
    const navigate = useNavigate();

    if (!cookies.user) {
        navigate("/login");
    }

    function handleFilterClick(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        $("#listing-filters").toggleClass("hidden");

        if(filterStatus) {
            setFilterStatus(false);
        } else {
            setFilterStatus(true);
        }
    }

    function handleFilterSubmit(e: React.MouseEvent<HTMLElement>, filters: object[], reset: boolean = false) {
        e.preventDefault();

        if (reset) { 
            axios.post('/api/listings/filter')
            .then((res) => {
                setListings(res.data.listings);
            })
            .catch((err) => {
                console.log(err);
            });
            return
        } else {
            axios.post('/api/listings/filter', {filters: filters}, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then((res: AxiosResponse) => {
                setListings(res.data.listings);
            })
            .catch((err) => {
                console.log(err);
            });   
        }
    }

    function handleSearchSubmit (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log(searchInput);
    }

    useEffect(() => {
        axios.get('/api/listings')
        .then((res) => {
            setListings(res.data.listings);
        })
        .catch((err) => {
            // do nothing
        });
    }, []);

    useEffect(() => {
        if (!searchInput) {
            axios.get('/api/listings')
            .then((res) => {
                setListings(res.data.listings);
            })
            return;
        }

        const source = axios.CancelToken.source();
    
        axios.post('/api/listings/livesearch', {
            query: searchInput
        }, {
            headers: {
                'Content-Type' : 'application/json'
            },
            cancelToken: source.token
        })
        .then((res: AxiosResponse) => {
            setListings(res.data.live_listings);
        })
        .catch((err) => {
            if (axios.isCancel(err)) {
                console.log("Request cancelled: ", err.message);
            } else {
                console.error(err);
            }
        });
    
        return () => {
            source.cancel('Operation cancelled.');
        }
    }, [searchInput]);

    return (
        <>
            <NavigationBar />
            <div className='flex flex-row justify-start gap-x-28 mb-10 dark:mt-10'>
                <Button className="ml-3 lg:ml-10" gradientMonochrome="cyan" onClick={handleFilterClick} pill>
                    {filterStatus ? 'Hide Filters' : 'Show Filters'}
                </Button>
                {cookies.user.role == 'realtor' ? 
                <Button gradientMonochrome="cyan" pill>
                    <Link to="/listings/create">
                        Create Listing
                    </Link>
                </Button>: ""}
            </div>
            <ListingsFilters handleSubmit={handleFilterSubmit} />
            <div id="search-panel">
                <form id="search" onSubmit={handleSearchSubmit} className="m-3 ml-10">
                    <div className="flex flex-row">
                        <FloatingLabel id="search" className="w-44 lg:w-[56rem]" variant="standard" sizing="sm" label="Search Address..." type="search" value={searchInput} onChange={(e) => {setSearchInput(e.target.value)}} />
                        <button type="submit" className="bg-transparent text-slate-300 hover:text-cyan-200 translate-x-2">
                            <FaSearch />
                        </button>
                    </div>
                </form>
            </div>
            <div id="header" className="w-full p-3 mt-2 mb-2">
                <h2 className="text-4xl font-bold text-slate-500 dark:text-white">Listings:</h2>
            </div>
            <div id="cards" className="relative z-20 w-fit space-y-8 lg:w-3/4 h-full p-px">
                {listings.length > 0 ? listings.map((listing) => (
                    <ListingCard key={listing.listing_id} listing={{...listing}} />
                )) : (<p className="indent-4 text-2xl font-semibold dark:text-white p-8">No listings Found</p>)}
            </div>
        </>
    )
}

export default Listings;