import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, Slide, toast } from 'react-toastify'
import { Button, Label, TextInput, Modal, Tooltip } from 'flowbite-react';
import { FaCircleInfo } from 'react-icons/fa6';
import { useCookies } from 'react-cookie';
import NavigationBar from '../components/Navbar';
import axios, { AxiosResponse } from 'axios';
import 'react-toastify/dist/ReactToastify.css';


const ManageAccount: React.FC = () => {
    const [ name, setName ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ confirmdel, setConfirmDel ] = useState("");
    const [ changableerr, setChangableErr ] = useState(false);
    const [ changableerrmsg, setChangableErrMsg ] = useState<String | String[]>("");
    const [ confirmdelerr, setConfirmDelErr ] = useState(false);
    const [ confirmdelerrmsg, setConfirmDelErrMsg ] = useState<null | String>("");
    const [ openDeleteAccModal, setOpenDeleteAccModal ] = useState(false);
    const [ openEmailChangeModal, setOpenEmailChangeModal ] = useState(false);
    const [ emailChangeErr, setEmailChangeErr ] = useState(false);
    const [ emailChangeErrMsg, setEmailChangeErrMsg ] = useState<null | String>("");
    const [ emailChange, setEmailChange ] = useState("");
    const [ openAgencyChangeModal, setAgencyChangeModal ] = useState(false);
    const [ newAgency, setNewAgency ] = useState("");
    const [ cookies, _, removeCookies ] = useCookies(['user']);
    const navigate = useNavigate();
    
    if (!cookies.user) {
        navigate('/login');
    }

    const logoutandredirect = () => {
        removeCookies("user");
        navigate("/");
    }

    function handleAccDel() {
        if(!confirmdel) {
            setConfirmDelErrMsg("Input must not be blank");
            setConfirmDelErr(true);
            return;
        }

        setConfirmDelErr(false);

        axios.post("/api/account/del", {
            "username" : cookies.user.username,
            "confirmation" : confirmdel
        }, {
            headers: {
                'Content-Type' : 'application/json'
            }
        })
        .then((res: AxiosResponse) => {
            setOpenDeleteAccModal(false);

            toast.success("Account Deleted", {
                onClose: () => logoutandredirect()
            });
        })
        .catch((err) => {
            console.error(err.response);
            if (err.response.data.validation_err) {
                setConfirmDelErr(true);
                setConfirmDel("");
                setConfirmDelErrMsg(err.response.data.validation_err.confirmation[0]);
            } else  {
                toast.error("unable to process request currently. Try again later.");
            }
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name && !password) {
            return;
        }

        const formdata = new FormData();

        if (name !== '') {
            formdata.append("name", name);
        }

        if (password !== '') {
            formdata.append("pwd", password);
        }

        formdata.append("id", cookies.user.id);

        axios.post('/api/account/update', formdata, {
            headers: {
                'Content-Type' : 'multipart/form-data'
            }
        })
        .then((res: AxiosResponse) => {
            setChangableErr(false);
            setChangableErrMsg("");
            toast.success("Account Successfully Updated", {
                onClose: () => logoutandredirect()
            });
        })
        .catch((err) => {
            console.error(err.response);

            if(err.response.data.validation_err) {
                setChangableErr(true);
                if (err.response.data.validation_err.pwd) {
                    setChangableErrMsg(err.response.data.validation_err.pwd);
                } else {
                    setChangableErrMsg(err.response.data.validation_err.username);
                } 
            } else {
                toast.error("Unable to process request currently. Try again later");
            }
        });
    }

    function handleConfirmDelCancel() {
        setOpenDeleteAccModal(false)
        setConfirmDelErr(false);
        setConfirmDel("");
        setConfirmDelErrMsg("");
    }

    function handleChangeRoleReq() {
        const formdata = new FormData();
        const requested_role = cookies.user.role == 'client' ? 'realtor' : 'client';

        formdata.append("acc_email", cookies.user.username);
        formdata.append("acc_name", cookies.user.name);
        formdata.append("req_role", requested_role);

        axios.post("/api/account/req/role", formdata, {
            headers: {
                'Content-Type' : 'multipart/form-data'
            }
        })
        .then((res: AxiosResponse) => {
            toast.success("Request sent successfully");
        })
        .catch((err) => {
            toast.error("Failed to send request. Try again later.");
        });
    }

    function handleEmailChangeReq() {
        if (!emailChange) {
            setEmailChangeErr(true);
            setEmailChangeErrMsg("Email must not be blank");
            return;
        }

        setEmailChangeErr(false);

        const formdata = new FormData();

        formdata.append("acc_id", cookies.user.id);
        formdata.append("acc_email", cookies.user.username);
        formdata.append("new_email", emailChange);

        axios.post("/api/account/req/email", formdata, {
            headers: {
                'Content-Type' : 'multipart/form-data'
            }
        })
        .then((res: AxiosResponse) => {
            toast.success("Request sent successfully");
        })
        .catch((err) => {
            setEmailChangeErr(true);
            setEmailChangeErrMsg(err.response.data.validation_err.username[0]);
        });
    }

    function handleAgencyChangeReq() {
        if (!newAgency) {
            toast.error("Agency must not be blank");
            return;
        }

        if (newAgency == cookies.user.agency) {
            toast.error("Must be a different agency to request changes");
            return;
        }

        const formdata = new FormData();

        formdata.append("acc_email", cookies.user.username);
        formdata.append("current_agency", cookies.user.agency);
        formdata.append("new_agency", newAgency);

        axios.post("/api/account/req/agency", formdata, {
            headers: {
                'Content-Type' : 'multipart/form-data'
            }
        })
        .then((res: AxiosResponse) => {
            toast.success("Request sent successfully");
        })
        .catch((err) => {
            toast.error("Failed to send request. Try again later.");
        });
    }

    return (
        <>
            <NavigationBar />
            <nav className="flex justify-center p-3 mt-4" aria-label="Dashboard ManageListings Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <a href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                            </svg>
                            Dashboard
                        </a>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Manage Account</span>
                        </div>
                    </li>
                </ol>
            </nav>
            <div className="container h-screen mx-auto">
                <h1 className="text-4xl text-gray-500 dark:text-white my-10 font-extrabold no-underline md:underline underline-offset-8 text-center decoration-auto decoration-double decoration-black dark:decoration-slate-300">
                    Manage Account (ID: {cookies.user.id})
                </h1>
                <div className='flex flex-col md:flex-row justify-center space-y-4 space-x-0 md:space-x-4 md:space-y-0'>
                    <section className="flex flex-col md:flex-row justify-start bg-slate-100 dark:bg-white rounded-lg shadow-2xl shadow-cyan-300 hover:shadow-cyan-500 dark:hover:shadow-cyan-100 p-3 z-10 md:max-w-prose">
                        <div className={`${changableerr ? 'block' : 'hidden'} m-3 pb-3 text-base border-2 border-b-4 rounded-md bg-red-200 border-red-200 border-b-red-300/90`}>
                                <div className="text-red-500 text-center">
                                    <span className="inline-block align-middle">
                                        {Array.isArray(changableerrmsg) ? (changableerrmsg.map((msg, k) => (
                                            <p key={k}>{msg}</p>
                                        ))) : (
                                            ""
                                        )}
                                    </span>
                                </div>
                            </div>
                        <form onSubmit={handleSubmit} className="flex flex-col justify-center content-center align-middle space-y-6 py-4 max-w-lg">
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="name" className="text-lg dark:text-black" value="Change Name" />
                                </div>
                                <TextInput id="name" type="text" sizing="lg" value={name} placeholder={cookies.user.name} onChange={(e) => {setName(e.target.value)}} autoComplete="off" />
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="pwd" className="text-lg dark:text-black" value="Change Password" />
                                </div>
                                <TextInput id="pwd" type="password" placeholder="*************" value={password} onChange={(e) => {setPassword(e.target.value)}} sizing="lg" />
                            </div>
                            <div className="flex flex-row space-x-3">
                                <Tooltip content="Note: submitting will log you out" style="auto" className="-translate-x-[0.8rem]" animation="duration-500">
                                    <FaCircleInfo className="translate-y-1/2 text-slate-400 dark:text-black" />
                                </Tooltip>
                                <Button type="submit" gradientMonochrome="info" pill size="md">Submit Change(s)</Button>
                            </div>
                        </form>
                    </section>
                    <section className="flex flex-col justify-start items-start content-start space-y-5 bg-slate-100 dark:bg-white rounded-lg shadow-2xl shadow-cyan-300 hover:shadow-cyan-500 dark:hover:shadow-cyan-100 p-3 z-10 md:max-w-prose overflow-auto">
                        <div id="delete-acc-section" className="text-left pt-3">
                            <h3 className="text-balance underline underline-offset-1 font-semibold text-2xl text-gray-600">Delete Account</h3>
                            <p className="indent-1 text-pretty text-sm px-3 my-2 text-gray-400">
                                <span className="text-red-400 font-extrabold underline decoration-red-400">Unreversable Action:</span> No longer interested in Realtor Listings? Don't have a need for it? This option will delete your account with a press of the button.
                            </p>
                            <Button size="sm" gradientMonochrome="failure" onClick={() => setOpenDeleteAccModal(true)} pill>Delete Account</Button>
                        </div>
                        <div id="request-section" className="text-left pb-3">
                            <h3 className="underline underline-offset-1 font-semibold text-2xl text-balance overflow-hidden text-clip text-gray-600">Request Changes</h3>
                            <p className="indent-1 text-sm text-pretty px-3 my-2 overflow-hidden text-clip text-gray-400">
                                Changes to account that can be made by administrator: <span className="italic text-black"><b>Role Change, Email Change, Agency Change</b></span>
                            </p>
                            <Button.Group outline>
                                <Button size="sm" gradientMonochrome="teal" onClick={handleChangeRoleReq} pill>Change Role (client to realtor or vice versa)</Button>
                                <Button size="sm" gradientMonochrome="teal" onClick={() => setOpenEmailChangeModal(true)} pill>Change Email</Button>
                                {cookies.user.role == "realtor" ? <Button size="sm" gradientMonochrome="teal" onClick={() => setAgencyChangeModal(true)} pill>Agency Change</Button> : ""}
                            </Button.Group>
                        </div>
                    </section>
                </div>
                <ToastContainer
                position="bottom-right"
                role="success"
                autoClose={2000}
                hideProgressBar={false}
                closeOnClick={false}
                theme="dark"
                draggable={false}
                limit={1}
                pauseOnHover={false}
                transition={Slide}
                />

                {/* Modals */}
                {/* Delete Account Modal */}
                <Modal show={openDeleteAccModal} onClose={() => setOpenDeleteAccModal(false)}>
                    <Modal.Header>Confirm Deletion of account</Modal.Header>
                    <Modal.Body>
                        <div className="space-y-6">
                            <div className="m-3 p-2">
                                <p className="text-base leading-relaxed text-gray-400 selection:bg-red-500">
                                    To confirm that you want to delete your account, write exactly below: <br /> <span className="underline font-bold text-black dark:text-white italic">I confirm to delete this account</span>
                                </p>
                            </div>
                            <div className={`${confirmdelerr ? 'block' : 'hidden'} m-3 pb-3 text-base border-2 border-b-4 rounded-md bg-red-200 border-red-200 border-b-red-300/90`}>
                                <div className="text-red-500 text-center">
                                    <span className="inline-block align-middle">{confirmdelerrmsg}</span>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor='confirm-del' className="text-lg dark:text-white" value="Confirm Deletion" />
                                </div>
                                <TextInput
                                id="confirm-del"
                                placeholder="I confirm to delete this account"
                                value={confirmdel}
                                onChange={(e) => setConfirmDel(e.target.value)}
                                autoComplete="off"
                                required
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button gradientDuoTone="pinkToOrange" onClick={() => handleAccDel()} pill>Delete Account</Button>
                        <Button id="confirm-del-cancel" color="gray" onClick={() => handleConfirmDelCancel()} pill>Cancel</Button>
                    </Modal.Footer>
                </Modal>

                {/* Email Change Modal */}
                <Modal show={openEmailChangeModal} onClose={() => setOpenEmailChangeModal(false)}>
                    <Modal.Header>Change Email Request Form</Modal.Header>
                    <Modal.Body>
                        <div className="space-y-6">
                            <div className="m-3 p-2">
                                <p className="text-base leading-relaxed text-gray-400">
                                    To request a change to your email, input your new email address below and submit.
                                </p>
                            </div>
                            <div className={`${emailChangeErr ? 'block' : 'hidden'} m-3 pb-3 text-base border-2 border-b-4 rounded-md bg-red-200 border-red-200 border-b-red-300/90`}>
                                <div className="text-red-500 text-center">
                                    <span className="inline-block align-middle">{emailChangeErrMsg}</span>
                                </div>
                            </div>
                            <div>
                                <div className="mb-3 block">
                                    <Label htmlFor="email-change" className="text-lg dark:text-white" value="New Email" />
                                </div>
                                <TextInput
                                id="email-change"
                                placeholder="xxxx@example.com"
                                value={emailChange}
                                onChange={(e) => setEmailChange(e.target.value)}
                                autoComplete="off"
                                required
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button gradientDuoTone="pinkToOrange" onClick={() => handleEmailChangeReq()} pill>Submit Request</Button>
                        <Button color="gray" onClick={() => setOpenEmailChangeModal(false)} pill>Cancel</Button>
                    </Modal.Footer>
                </Modal>

                {/* Agency Change Modal */}
                <Modal show={openAgencyChangeModal} onClose={() => setAgencyChangeModal(false)}>
                    <Modal.Header />
                    <Modal.Body>
                        <div className="space-y-6">
                            <div className="px-5 my-2">
                                <h3 className="tracking-wider text-3xl font-semibold text-gray-500 dark:text-white">Request to Change Agency</h3>
                            </div>
                            <div className="m-3 p-2">
                                <p className="text-base tracking-wide leading-relaxed text-gray-400">
                                    To request a change to your agency, input the new agency name below and submit.
                                </p>
                            </div>
                            <div>
                                <TextInput
                                id="agency-change"
                                sizing="md"
                                className="py-3 ml-4 w-1/2"
                                placeholder={cookies.user.agency}
                                value={newAgency}
                                onChange={(e) => setNewAgency(e.target.value)}
                                autoComplete='off'
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button gradientDuoTone="pinkToOrange" onClick={() => handleAgencyChangeReq()} pill>Submit Agency Change</Button>
                        <Button color="gray" onClick={() => setAgencyChangeModal(false)} pill>Cancel</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </>
    )
}

export default ManageAccount;