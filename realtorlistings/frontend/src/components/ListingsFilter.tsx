import React, { useState, useCallback } from 'react';
import { Select, Label, TextInput, Button, RangeSlider } from 'flowbite-react';
import TagInput from './tagInput';
import countries from '../assets/data/countries';
import states from '../assets/data/states';


interface FilterProps {
    handleSubmit: CallableFunction
}

const ListingsFilters: React.FC<FilterProps> = ({ handleSubmit }) => {
    const [ country, setCountry ] = useState('default');
    const [ zip, setZip ] = useState('');
    const [ state, setState ] = useState('default');
    const [ agency, setAgency ] = useState('');
    const [ tags, setTags ] = useState([]);
    const [ minpriceRange, setMinPriceRange ] = useState("10000");
    const [ maxpriceRange, setMaxPriceRange ] = useState("10000000");

    const handleTagsChange = useCallback((e: any) => {
        const tag_values: object[] = e.detail.tagify.getCleanValue();
        const tags_array: any[string] = [];

        tag_values.forEach(tag => {
            // @ts-ignore
            tags_array.push(tag.value);
        });

        setTags(tags_array);

    }, []);

    function handleReset (e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        // reset each state back to default value
        setCountry('default');
        setZip('');
        setState('default');
        setAgency('');
        setTags([]);
        setMinPriceRange("10000");
        setMaxPriceRange("10000000");
        // handle listings reset
        handleSubmit(e, []);
    }

    function handleFilterClick (e: React.MouseEvent<HTMLElement>)  {
        e.preventDefault();
        const filters = [];

        if (country !== 'default') {
            filters.push({"country" : country});
        }
        if (zip !== '') {
            filters.push({"zip" : zip});
        }
        if (state !== 'default') {
            filters.push({"zip" : state});
        }
        if (agency !== '') {
            filters.push({"agency" : agency});
        }
        if (tags.length > 0) {
            filters.push({"tags" : tags});
        }
        filters.push([minpriceRange, maxpriceRange]); 
        handleSubmit(e, filters);
      }

    return (
        <>
            <div id="listing-filters" className="hidden z-10 flex flex-col shadow-md items-center content-between justify-center w-full h-auto lg:mx-10 border-2 rounded-md dark:mt-10 max-w-prose border-slate-300">
                <div id="row-1" className="flex flex-row flex-wrap p-2 mt-px gap-x-8">
                    <h2 className="font-extrabold text-gray-500 underline underline-offset-4 decoration-from-font decoration-gray-600 dark:text-white dark:decoration-gray-200">Filter Options</h2>
                </div>
                <div id="row-2" className="flex flex-row flex-wrap gap-8 p-2 mt-px mb-2">
                    <div className="mr-2">
                        <div className="block mb-2">
                            <Label htmlFor="country" value="Filter By Country" />
                        </div>
                        <Select id="country" value={country} onChange={(e) => {setCountry(e.target.value)}}>
                                <option value="default" disabled>Choose Country...</option>
                                {countries.map((val) => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                        </Select>
                    </div>
                    <div className="mr-2">
                        <div className="block mb-2">
                            <Label htmlFor="zip" value="Filter By Zip Code" />
                        </div>
                        <TextInput id="zip" type="text" value={zip} onChange={(e) => {setZip(e.target.value)}} placeholder="Enter Zip Code..." shadow />
                    </div>
                    <div className="mr-2 basis-full">
                        <div className="relative block mb-2 lg:-translate-x-16 lg:left-1/4">
                            <Label htmlFor="states" className="text-wrap whitespace-pre-wrap lg:whitespace-normal" value="Filter By U.S., Canadian, or Mexican States,    Territories, or Provinces" />
                        </div>
                        <Select id="states" value={state} onChange={(e) => {setState(e.target.value)}}>
                            <option value="default" disabled>Choose State/Territory/Province...</option>
                            {states.map((val) => (
                                <option key={val} value={val} disabled={val.startsWith("-----") ? true : false}>{val}</option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div id="row-3" className="flex flex-row flex-wrap p-2 mt-px mb-2 gap-x-8">
                    <div className="mr-2">
                        <div className="block mb-2">
                            <Label htmlFor="agency" value="Filter By Real Estate Agency" />
                        </div>
                        <TextInput id="agency" type="text" value={agency} onChange={(e) => {setAgency(e.target.value)}} placeholder="Enter Agency Name..." shadow />
                    </div>
                    <div className="mr-2">
                        <div className="block mb-2">
                            <Label htmlFor="tags" value="Filter By Tags" />
                        </div>
                        <TagInput id="tags" handleChange={handleTagsChange} value={tags} classes="dark:caret-cyan-500 dark:placeholder:text-white" />
                    </div>
                </div>
                <div id="row-4" className="flex flex-col p-2 mt-px mb-2">
                    <div className="block gap-y-5 mb-2">
                        <Label htmlFor="price-range" value="Filter By Minimum Price Range" />
                    </div>
                    <Label className="text-center text-xs select-none text-slate-400 dark:text-white" value={`$ ${minpriceRange.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`} />
                    <RangeSlider id="price-range" className="w-72" value={minpriceRange} onChange={(e) => {setMinPriceRange(e.target.value)}} min="10000" max="10000000" />
                    <div className="block mb-2">
                        <Label htmlFor="price-range" value="Filter By Maximum Price Range" />
                    </div>
                    <Label className="text-center text-xs select-none text-slate-400 dark:text-white" value={`$ ${maxpriceRange.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`} />
                    <RangeSlider id="price-range" className="w-72" value={maxpriceRange} onChange={(e) => {setMaxPriceRange(e.target.value)}} min="200000" max="10000000" />
                </div>
                <div id="row-5" className="flex flex-row lg:content-center mt-px mb-3 gap-x-12">
                    <Button onClick={handleFilterClick} color="blue" pill>
                        Filter Listings
                    </Button>
                    <Button color="failure" onClick={handleReset} pill>
                        Reset Filters
                    </Button>
                </div>
            </div>
        </>
    )
}


export default ListingsFilters;