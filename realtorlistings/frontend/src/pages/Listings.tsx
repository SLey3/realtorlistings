// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
    let x = 0

    if (!cookies.user) {
        window.location.href = "/";
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

    function handleFilterSubmit(e: React.MouseEvent<HTMLElement>, filters: string[]) {
        e.preventDefault();
        console.log(filters);
        if(filters.length == 0) { 
            axios.get('/api/listings')
            .then((res) => {
                setListings(res.data.listings);
            })
            .catch((err) => {
                console.log(err);
            });
        }

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
        console.log(listings);
    }, []);

    return (
        <>
            <NavigationBar />
            <div className='flex flex-row justify-start gap-x-28 mb-10 dark:mt-10'>
                <Button className="ml-3 lg:ml-10" gradientMonochrome="cyan" onClick={handleFilterClick} pill disabled>
                    {filterStatus? 'Hide Filters' : 'Show Filters (coming soon)'}
                </Button>
                {cookies.user.role == 'realtor' ? <Button gradientMonochrome="cyan" pill>
                    <Link to="/listings/create">
                        Create Listing
                    </Link>
                </Button>: ""}
            </div>
            <ListingsFilters handleSubmit={handleFilterSubmit} />
            <div id="search-panel">
                <form id="search" onSubmit={handleSearchSubmit} className="m-3 ml-10">
                    <div className="flex flex-row">
                        <FloatingLabel id="search" className="w-44 lg:w-[56rem]" variant="standard" sizing="sm" label="Search Address... (coming soon...)" type="search" value={searchInput} onChange={(e) => {setSearchInput(e.target.value)}} disabled />
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
                {listings.map((listing) => (
                    <ListingCard key={x += 1} listing={listing} />
                ))}
            </div>
        </>
    )
}

export default Listings;