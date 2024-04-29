'use client';
import React, { useState, useEffect, useCallback } from "react";
import {
    Button,
    TextInput,
    Textarea,
    Select,
    FileInput,
    Label
} from 'flowbite-react'
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";
import $ from "jquery";
import NavigationBar from "./Navbar";
import TagInput from "./tagInput";
import axios, { AxiosResponse } from "axios";

interface Listing {
    property_name: string;
    address: string;
    address2: string
    town: string;
    zip: string;
    realtor: string;
    agency: string;
    price: string;
    type: string;
    url: string;
    tags: string[];
    description: string;
}

const EditListing: React.FC = () => {
    const [ cookies ] = useCookies(['user']);
    const [ listing, setListing ] = useState<object | Listing>({});
    const [ loading, setLoading ] = useState(true);
    const [ name, setName ] = useState('');
    const [ address, setAddress ] = useState('');
    const [ address2, setAddress2 ] = useState('');
    const [ town, setTown ] = useState('');
    const [ zip, setZip ] = useState('');
    const [ type, setType ] = useState('');
    const [ price, setPrice ] = useState('');
    const [ url, setUrl ] = useState('');
    const [ tags, setTags ] = useState([]);
    const [ oldTags, setOldTags ] = useState([]);
    const [ file, setFile ] = useState<null | Blob>(null);
    const [ description, setDescription ] = useState('');
    const [ error, setErrors ] = useState<JSX.Element | null | String>(null);
    const [ tagdisable, setTagDisable ] = useState(true);
    let params = useParams();

    useEffect(() => {
        axios.get("/api/listings/get/one", {
            params: {
                listing_id: params.id
            }
        })
        .then((res: AxiosResponse) => {
            setListing(res.data.listing);
            setType(res.data.listing.type);
        })
        .catch((err) => {
            console.log(err);
        })
        
        .finally(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        axios.get("/api/listings/tags", {
            params: {
                address: (listing as Listing).address
            }
        })
        .then((res: AxiosResponse) => {
            let parsedTags = res.data.tags.map((tag: string) => ({ value: tag }));
            setOldTags(parsedTags);

            setTags(parsedTags);
        });
    }, [listing]);

    const handleTagsChange = useCallback((e: any) => {
        const tag_values: object[] = e.detail.tagify.getCleanValue();
        const tags_array: any[string] = [];

        tag_values.forEach(tag => {
            // @ts-ignore
            tags_array.push(tag.value);
        });

        setTags(tags_array);

    }, []);

    function handleEditClick(e: React.MouseEvent<HTMLElement>, input_id: string){
        e.preventDefault();
        $(`#${input_id}`).is(':disabled') ? $(`#${input_id}`).prop('disabled', false) : $(`#${input_id}`).prop('disabled', true);
    }

    const handleFileChange = (files: any) => {
        const file = files.target.files[0];
        if (file) {
            const file_reader = new FileReader();
            
            file_reader.onload = () => {
                // @ts-ignore
                const fileBlob = new Blob([file_reader.result], {type: file.type});

                setFile(fileBlob); 
            };
            file_reader.readAsArrayBuffer(file);
        }
    }


    function handleSubmit (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        // prepare data for submission
        const formData = new FormData();

        if (name !== '') {
            formData.append('property_name', name);
        }
        if (address !== '') {
            formData.append('address', address);
        }
        if (address2 !== '') {
            formData.append('address2', address2);
        }
        if (town !== '') {
            formData.append('town', town);
        }
        if (zip !== '') {
            formData.append('zip', zip);
        }
        if (type !== (listing as Listing).type) {
            formData.append('type', type);
        }
        if (price !== '') {
            formData.append('price', price);
        }
        if (url !== '') {
            formData.append('url', url);
        }
        if (tags.length > 0 && tags !== oldTags) {
            formData.append('tags', tags.join(',')); // Convert tags array to string
        }
        if (file) {
            formData.append('file', file, 'image.png');
        }
        if (description !== '') {
            formData.append('description', description);
        }

        if (formData.entries().next().done) {
            return;
        }

        if (params.id) {
            formData.append('listing_id', params.id);
        }


        axios.post("/api/listings/edit", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then((res: AxiosResponse) => {
            window.location.href = "/dashboard/listings";
        })
        .catch((err) => {
            setErrors("An error occurred while trying to edit the listing.");
        });
    }

    if (loading) {
        return <div className="dark:text-white text-4xl transition-opacity duration-300 animate-pulse">Loading...</div>; // Render loading indicator while waiting for data
    }

    if (!cookies.user || cookies.user.role !== 'realtor') {
        window.location.href = "/login";
    }

    return (
        <>
            <NavigationBar />
            <nav className="flex justify-center p-3 mt-4" aria-label="Dashboard Edit Listing Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <a href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                            </svg>
                            Dashboard
                        </a>
                    </li>
                    <li className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                        <a href="/dashboard/listings" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                            </svg>
                            Manage Listings
                        </a>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Edit Listing (ID: {params.id})</span>
                        </div>
                    </li>
                </ol>
            </nav>
            <h1 className="text-4xl font-bold text-slate-500 dark:text-white text-center mt-10">Edit Listing</h1>
            <hr className="w-1/2 mx-auto border-1 border-cyan-200 dark:border-cyan-400 mt-2 mb-10" />
            <div className="flex flex-col items-center justify-center mt-10">
                <form className="space-y-4 p-3 w-screen md:w-1/2 lg:max-w-prose" onSubmit={handleSubmit}>
                    <div className="p-px">
                        <Label htmlFor="name" className="text-slate-500 mb-2 dark:text-white">Property Name</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="name" name="name" type="text" placeholder={(listing as Listing).property_name} value={name} onChange={(e) => {setName(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "name")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="address" className="text-slate-500 mb-2 dark:text-white">Address</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="address" name="address" type="text" placeholder={(listing as Listing).address} value={address} onChange={(e) => {setAddress(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "address")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="address2" className="text-slate-500 mb-2 dark:text-white">Address 2</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="address2" name="address2" type="text" placeholder={(listing as Listing).address2} value={address2} onChange={(e) => {setAddress2(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "address2")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="city" className="text-slate-500 mb-2 dark:text-white">Town/City</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="city" name="city" type="text" placeholder={(listing as Listing).town} value={town} onChange={(e) => {setTown(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "city")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="zip" className="text-slate-500 mb-2 dark:text-white">Zip Code</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="zip" name="zip" type="text" placeholder={(listing as Listing).zip} value={zip} onChange={(e) => {setZip(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "zip")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="type" className="text-slate-500 mb-2 dark:text-white">Property Type</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <Select id="type" name="type" value={type} onChange={(e) => {setType(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled>
                                <option value="default" disabled>Select a type...</option>
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="land">Land</option>
                                <option value="commercial">Commercial</option>
                            </Select>
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "type")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="price" className="text-slate-500 mb-2 dark:text-white">Price</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="price" name="price" type="text" placeholder={`$${(listing as Listing).price}`} value={price} onChange={(e) => {setPrice(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "price")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="url" className="text-slate-500 mb-2 dark:text-white">URL</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TextInput id="url" name="url" type="text" placeholder={(listing as Listing).url} value={url} onChange={(e) => {setUrl(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "url")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="tags" className="text-slate-500 mb-2 dark:text-white">Tags</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <TagInput id="tags" handleChange={handleTagsChange} value={tags} classes="min-w-28 md:w-1/2 lg:w-full" disabled={tagdisable} />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {setTagDisable(tagdisable ? false : true)}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="file" className="text-slate-500 mb-2 dark:text-white">Image</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <FileInput id="file" onChange={handleFileChange} accept="image/png" className="min-w-28 md:w-1/2 lg:w-full" disabled />
                            <Button color="light" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "file")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Label htmlFor="description" className="text-slate-500 mb-2 dark:text-white">Description</Label>
                        <div className="flex flex-col gap-y-2 lg:flex-row lg:gap-x-5">
                            <Textarea id="description" name="description" placeholder={(listing as Listing).description} value={description} onChange={(e) => {setDescription(e.target.value)}} className="min-w-28 md:w-1/2 lg:w-full" maxLength={2500} rows={13} disabled />
                            <Button color="light" className="flex items-center" onClick={(e: React.MouseEvent<HTMLElement>) => {handleEditClick(e, "description")}}>
                                Edit
                            </Button>
                        </div>
                    </div>
                    <div className="p-px">
                        <Button type="submit" gradientMonochrome="cyan" className="w-full" pill>
                            Commit Changes
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default EditListing;