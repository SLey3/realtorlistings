import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavigationBar from './Navbar';
import axios, { AxiosResponse } from 'axios';


const ConfirmAccount: React.FC = () => {
    const params = useParams();
    let [ expired_or_not, setStatus ] = useState('Processing...');

    useEffect(() => {
        confirmAccount();
    }, []);

    const confirmAccount = () => {
        axios.post(`/api/confirmacc`, {
            'jwt': params.ciphered
        })
        .then(function(res: AxiosResponse){
            setStatus(res.data.success);
        })
        .catch(function(err){
            setStatus(err.response.data.expired);
        });
    }


    return (
        <>
            <NavigationBar />
            <div className="container mx-auto">
                <h1 className="mb-2 text-xl text-gray-400">Account Creation Confirmation</h1>
                <p className="p-3 text-base subpixel-antialiased leading-relaxed text-slate-600">{expired_or_not}</p>
            </div>
        </>
    )
}

export default ConfirmAccount;