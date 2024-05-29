import React, { useState } from 'react';
import { Link, redirect } from 'react-router-dom';
import { Label } from 'flowbite-react';
import NavigationBar from '../components/Navbar';
import { useCookies } from 'react-cookie';
import axios, { AxiosResponse } from 'axios';
import { object } from 'prop-types';

const Login: React.FC = () => {
    const [ cookies, setCookies ] = useCookies(['user']);
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ error, setError ] = useState<null | String>('');

    if (cookies.user) {
        window.location.href = '/';
    }

    function handleSubmit (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        axios.post("/api/login", {'username': username, 'password': password}, {
            headers: {
                'Content-Type': 'application/json'
            }})
            .then((res: AxiosResponse) => {
                if (typeof res.data === 'object') { // prevents accidental logins in case of error on the backend
                    setCookies('user', res.data, { path: '/' });
                    redirect("/listings");
                } else {
                    setError("Something went wrong. Try again Later.")
                }
            })
            .catch((err) => {
                setError(err.response.data.error);
            });
    }

    return (
        <>
            <NavigationBar />
            <div className="mt-10">
                <form className="max-w-sm mx-auto" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <h2 className="text-2xl font-semibold text-center dark:text-white">Sign In</h2>
                    </div>
                    <div id="res-panel" className={`${error ? 'block' : 'hidden'} mb-5 p-3 text-base border-2 border-b-4 rounded-md 
                    ${error === null ? 'bg-green-200 border-green-200 border-b-green-300/90' : 'bg-red-200 border-red-200 border-b-red-300/90'}`}>
                        <div className={`${error !== null ? 'text-red-500' : 'text-green-500'} text-center`}>{error}</div>
                    </div>
                    <div className="mb-5">
                        <Label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</Label>
                        <input type="email" id="email" onChange={(e) => {setUsername(e.target.value);}} value={username} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@email.com" required />
                    </div>
                    <div className="mb-5">
                        <Label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</Label>
                        <input type="password" id="password" onChange={(e) => {setPassword(e.target.value)}} value={password} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                    </div>
                    <div className="flex items-start mb-5">
                        <div className="flex items-center h-5">
                            <input id="remember" type="checkbox" value="" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" />
                        </div>
                        <Label htmlFor="remember" className="text-sm font-medium text-gray-900 ms-2 dark:text-gray-300">Remember me</Label>
                    </div>
                    <input type="submit" placeholder="Log In" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" />
                </form>
                <div className="p-3 mb-5">
                    <Link to="/register" className="block max-w-sm p-1 mx-auto text-gray-900 hover:text-cyan-500 dark:hover:text-cyan-200 dark:text-gray-300">Don't have an account? Register</Link>
                </div>
            </div>
        </>
    )
}

export default Login;