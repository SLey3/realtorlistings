import React, { useState } from 'react';
import { Label, Button } from 'flowbite-react';
import NavigationBar from './Navbar';
import { useCookies } from 'react-cookie';
import axios, { AxiosResponse } from 'axios';


const Register: React.FC = () => {
    const [ cookies ] = useCookies(['user']);
    const [ username, setUsername ] = useState('');
    const [ name, setName ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ confirmPwd, setConfirmPwd ] = useState('');
    const [ role, setRole ] = useState('client');
    const [ agency, setAgency ] = useState('');
    const [ currentPanel, setCurrentPanel ] = useState(1);
    const [ error, setErrors ] = useState<JSX.Element | null | String>(null);
    const [ success, setSuccess ] = useState<null | String>(null);
    const totalPanels = 3;

    if (cookies.user) {
        window.location.href = "/";
    } 


    const changePanel = (dir: string) => {
        if(dir === "nxt" && currentPanel < totalPanels){
            setCurrentPanel(prevPanel => prevPanel + 1);
        } else if (dir === "prev" && currentPanel > 1) {
            setCurrentPanel(curPanel => curPanel - 1);
        }
    }

    function handleSubmit (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // prepare agency input and payload
        const agency_value  = agency !== "" ? agency : "None";

        const payload = {
            "username" : username,
            "name" : name,
            "password" : password,
            "confirm_password" : confirmPwd,
            "role" : role,
            "agency" : agency_value
        }

        // make request
        axios.post("/api/register", payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(res: AxiosResponse){
            setSuccess(res.data.success);
        })
        .catch(function(err){
            // handle errors
            if (err.response.data.account_error){
                setErrors(err.response.data.account_error);
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
            } else if (err.response.data.server_error) {
                console.log(err.response.data.server_error); // console error for debugging purposes should it happen
                setErrors("503: Server Error Occurred. Please try again later and/or report the issue to us");
            }
        });
    }

    return (
        <>
            <NavigationBar />
            <div className="p-10 mt-10 bg-slate-100 dark:bg-transparent">
                <form className="flex flex-col justify-center max-w-sm mx-auto" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <h2 className="text-2xl font-semibold text-center dark:text-white">Register Account</h2>
                    </div>
                    <div id="res-panel" className={`${error || success ? 'block' : 'hidden'} mb-5 p-3 text-base border-2 border-b-4 rounded-md 
                    ${error === null ? 'bg-green-200 border-green-200 border-b-green-300/90' : 'bg-red-200 border-red-200 border-b-red-300/90'}`}>
                        <div className={`${error !== null ? 'text-red-500' : 'text-green-500'} text-center`}>{error ?? success}</div>
                    </div>

                    <div className={`p-3 ${currentPanel === 1 ? 'block' : 'hidden'}`}>
                        <Label htmlFor="username" className="block mb-2 text-sm font-medium text-center text-gray-900 dark:text-white">
                            Username <span className="text-red-600">*</span>
                        </Label>
                        <input type="email" id="username" placeholder="name@email.com" value={username} onChange={(e) => {setUsername(e.target.value)}}
                        className="bg-gray-50 mb-5 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ps-32 
                        dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        <Label htmlFor="name" className="block mb-2 text-sm font-medium text-center text-gray-900 dark:text-white">
                            Name <span className="text-red-600">*</span>
                        </Label>
                        <input type="text" id="name" value={name} onChange={(e) => {setName(e.target.value)}}
                        className="bg-gray-50 border border-gray-300 mb-5 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ps-32 
                        dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                        <Button size="lg" color="blue" className="w-full mb-2" pill onClick={() => changePanel("nxt")}>Next</Button>
                    </div>
                    <div className={`p-3 ${currentPanel === 2 ? 'block' : 'hidden'}`}>
                        <Label htmlFor="pwd" className="block mb-2 text-sm font-medium text-center text-gray-900 dark:text-white">
                            Password <span className="text-red-600">*</span>
                        </Label>
                        <input type="password" id="pwd" value={password} onChange={(e) => {setPassword(e.target.value)}}
                        className="bg-gray-50 border border-gray-300 mb-5 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ps-32 
                        dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                        <Label htmlFor="confirm-pwd" className="block mb-2 text-sm font-medium text-center text-gray-900 dark:text-white">
                            Confirm Password <span className="text-red-600">*</span>
                        </Label>
                        <input type="password" id="confirm-pwd" value={confirmPwd} onChange={(e) => {setConfirmPwd(e.target.value)}}
                        className="bg-gray-50 border border-gray-300 mb-5 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ps-32 
                        dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                        <Button size="lg" color="blue" className="w-full" pill onClick={() => changePanel("nxt")}>Next</Button>
                        <Button size="xs" color="light" className="relative w-1/2 mt-2 border-0 left-1/4 ps-3 bg-inherit hover:text-sky-300" onClick={() => changePanel("prev")}>Previous</Button>
                    </div>
                    <div className={`p-3 ${currentPanel === 3 ? 'block' : 'hidden'}`}>
                        <Label htmlFor="role" className="block mb-2 text-sm font-medium text-center text-gray-900 dark:text-white">
                            Role <span className="text-red-600">*</span>
                        </Label>
                        <select id="role" onChange={(e) => {setRole(e.target.value)}} 
                        className="block mb-5 py-2.5 px-0 w-full text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none 
                        dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer" defaultValue="client" required>
                            <option disabled aria-disabled="true">Choose a role</option>
                            <option value="client">Client (normal user)</option>
                            <option value="realtor">Realtor</option>
                        </select>
                        <Label htmlFor="realtor-agency" className="block mb-2 text-sm font-medium text-center text-gray-900 dark:text_white">
                            Your Agency {role === 'realtor' ? <span className="text-red-600">*</span> : ''}
                        </Label>
                        <input type="text" id="realtor-agency" value={agency} onChange={(e) => {setAgency(e.target.value)}}
                        className="bg-gray-50 border border-gray-300 mb-5 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ps-32 
                        dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" disabled={role === 'client'} required={role === 'realtor'} />
                        <input type="submit" placeholder="Create Account" className="group flex items-center justify-center p-2 text-center font-medium relative 
                        focus:z-10 focus:outline-none transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] text-white bg-blue-700 border border-transparent 
                        enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-full w-full mb-2" />
                        <Button size="xs" color="light" className="relative w-1/2 border-0 left-1/4 ps-3 bg-inherit hover:text-sky-300" onClick={() => changePanel("prev")}>Previous</Button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default Register;