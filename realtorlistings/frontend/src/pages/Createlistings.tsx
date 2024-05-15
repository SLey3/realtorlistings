import React, { useState, useCallback } from 'react';
import { redirect } from 'react-router-dom';
import { FloatingLabel,
         Select, 
         Label, 
         FileInput, 
         Textarea,
         Button } from 'flowbite-react';
import { useCookies } from 'react-cookie';
import NavigationBar from '../components/Navbar';
import TagInput from '../components/tagInput';
import axios from 'axios';
import countries from '../assets/data/countries';
import states from '../assets/data/states';


const CreateListing: React.FC = () => {
    const [ cookies ] = useCookies(['user']);
    const [ property_name, setPropertyName ] = useState('');
    const [ address, setAddress ] = useState('');
    const [ address2, setAddress2 ] = useState('');
    const [ town, setTown ] = useState('');
    const [ zip, setZip ] = useState('');
    const [ state, setState ] = useState('default');
    const [ country, setCountry ] = useState('default');
    const [ property_type, setPropertyType ] = useState('default');
    const [ price, setPrice ] = useState('');
    const [ url, setUrl ] = useState('');
    const [ tags, setTags ] = useState([]);
    const [ file, setFile ] =  useState<null | Blob>(null);
    const [ desc, setDesc ] = useState('');
    const [ error, setErrors ] = useState<JSX.Element | null | String>(null);

    function handleFormSubmit (e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        // prepare payload
        const payload = {
            status: "sale",
            realtor: cookies.user.name,
            realtor_id: parseInt(cookies.user.id),
            agency: cookies.user.agency,
            name: property_name,
            address: address,
            address2: address2,
            town: town,
            zip: zip,
            state: state,
            country: country,
            type: property_type,
            price: parseInt(price),
            url: url,
            tags: tags,
            desc: desc
        }

        const formdata = new FormData();
        // @ts-ignore
        formdata.append('file', file, 'image.png');
        formdata.append('payload', JSON.stringify(payload));

        axios.post('/api/listings/new', formdata, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then((res) => {
            window.location.href = '/listings';
        })
        .catch((err) => {
            if (err.response.data.server_error) {
                setErrors(err.response.data.server_error);
            } else if (err.response.data.validation_error) {
                let validation_array: string[] = [];

                Object.keys(err.response.data.validation_error).forEach(key => {
                    const validator = err.response.data.validation_error[key];
                    Object.keys(validator).forEach(key => {
                        validation_array.push(validator[key])
                    })
                });
                let error_list = (
                    <ul className="flex flex-col justify-center px-2 space-y-2 list-disc list-outside">
                        {validation_array.map((validation_err: string, index: number) => {
                            return <li key={index} className="text-sm font-light tracking-tight hover:text-red-700">{validation_err}</li>
                        })}
                    </ul>
                );

                setErrors(error_list);
            }
        });

    }

    const handleTagsChange = useCallback((e: any) => {
        const tag_values: object[] = e.detail.tagify.getCleanValue();
        const tags_array: any[string] = [];

        tag_values.forEach(tag => {
            // @ts-ignore
            tags_array.push(tag.value);
        });

        setTags(tags_array);

    }, []);

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

    if (!cookies.user && cookies.user.role === "realtor") {
        window.location.href = "/";
    }

    return (
        <>
            <NavigationBar />
            <div id="header" className="dark:my-10 p-3">
                <h1 className="text-4xl font-semibold text-slate-600 dark:text-white">Create Listings</h1>
                <hr className="max-w-5x" />
            </div>
            <div id="err-panel" className={`${error ? 'block' : 'hidden'} mb-5 p-3 text-base border-2 border-b-4 rounded-md bg-red-200 border-red-200 border-b-red-400/90`}>
                        <div className="text-red-500' text-center`">{error}</div>
            </div>
            <div id="form-container" className="ml-10 mt-10 mb-10">
                <form id="form-contents" onSubmit={handleFormSubmit} method="POST" encType="multipart/form-data" className="grid grid-flow-row auto-rows-auto space-y-10">
                    <div id="property-name">
                        <FloatingLabel id="property-name-input" variant="outlined" value={property_name} onChange={(e) => {setPropertyName(e.target.value)}} label="Property Name *" required />
                    </div>
                    <div id="address">
                        <FloatingLabel id="address-input" variant="outlined" value={address} onChange={(e) => {setAddress(e.target.value)}} label="Address *" required />
                    </div>
                    <div id="address-2">
                        <FloatingLabel id="address-2-input" variant="outlined" value={address2} onChange={(e) => {setAddress2(e.target.value)}} label="Address 2" />
                    </div>
                    <div id="town">
                        <FloatingLabel id="town-input" variant="outlined" value={town} onChange={(e) => {setTown(e.target.value)}} label="Town *" required />
                    </div>
                    <div id="zip">
                        <FloatingLabel id="zip-input" variant="outlined" value={zip} onChange={(e) => {setZip(e.target.value)}} label="Zip Code *" required />
                    </div>
                    <div id="state">
                        <div className="block mb-2">
                            <Label htmlFor="state-select">
                                State (If your country doesnt have a state, select N/A) *
                            </Label>
                        </div>
                        <Select id="state-select" value={state} onChange={(e) => {setState(e.target.value)}} required>
                            <option value="default" disabled>Choose State/Territory/Province...</option>
                            <option value="None">N/A</option>
                            {states.map((val) => (
                                <option key={val} value={val} disabled={val.startsWith("-----") ? true : false}>{val}</option>
                            ))}
                        </Select>
                    </div>
                    <div id="country">
                        <div className="block mb-2">
                            <Label htmlFor="country-select">
                                Country *
                            </Label>
                        </div>
                        <Select id="country-select" value={country} onChange={(e) => {setCountry(e.target.value)}} required>
                            <option value="default" disabled>Choose Country...</option>
                            {countries.map((val) => (
                                    <option key={val} value={val}>{val}</option>
                            ))}
                        </Select>
                    </div>
                    <div id="property-type">
                        <div className="block mb-2">
                            <Label htmlFor="property-type-select">
                                Property Type *
                            </Label>
                        </div>
                        <Select id="property-type-select" value={property_type} onChange={(e) => {setPropertyType(e.target.value)}} required>
                            <option value="default" disabled>Choose Type...</option>
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="townhouse">Townhouse</option>
                            <option value="farm">Farm</option>
                            <option value="office">Office</option>
                            <option value="store">Store</option>
                            <option value="industrial">Industrial</option>
                        </Select>
                    </div>
                    <div id="property-status">
                        <FloatingLabel id="property-status-input" variant="outlined" label="Property Status" value="sale" disabled />
                    </div>
                    <div id="price">
                        <FloatingLabel id="price-input" variant="outlined" label="Price" value={price} onChange={(e) => {setPrice(e.target.value.replace(/[^0-9.-]/g, ''))}} required />
                    </div>
                    <div id="url">
                        <FloatingLabel id="url" variant="outlined" label="Listing Url on Agency Website" value={url} onChange={(e) => {setUrl(e.target.value)}} required />
                    </div>
                    <div id="tags">
                        <div className="block mb-2">
                            <Label htmlFor="tag-input">
                                Tags (Make sure to include all relevant tags for this listing) *
                            </Label>
                        </div>
                        <TagInput id="tag-input" handleChange={handleTagsChange}  value={tags} classes="w-1/4 border border-gray-300 bg-transparent text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500" />
                    </div>
                    <div id="img">
                        <div className="block mb-2">
                            <Label htmlFor="img-input">
                                Image *
                            </Label>
                        </div>
                        <FileInput id="img-input" className="max-w-96" helperText="only accepts PNG" accept="image/png" onChange={handleFileChange} />
                    </div>
                    <div id="desc">
                        <div className="block mb-2">
                            <Label htmlFor="desc-text">
                                Description *
                            </Label>
                        </div>
                        <Textarea id="desc-text" placeholder="Enter Description" value={desc} onChange={(e) => {setDesc(e.target.value)}} maxLength={2500} rows={13} required />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">500characters min | 2500 characters max</p>
                    </div>
                    <div id="realtor">
                        <FloatingLabel id="realtor-input" variant="outlined" label="Sold By" value={cookies.user.name} disabled />
                    </div>
                    <div id="agency">
                        <FloatingLabel id="agency-input" variant="outlined" label="Agency" value={cookies.user.agency} disabled />
                    </div>
                    <div className="mb-10">
                        <Button type="submit" gradientMonochrome="cyan" pill>
                            Create Listing
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default CreateListing;