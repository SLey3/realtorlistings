import React from 'react';
import NavigationBar from './Navbar';
import { Accordion } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { LoginLink } from './AuthComponents';


const About: React.FC = () => {
    return (
        <>
            <NavigationBar />
            <div id="header" className="w-full p-3 m-6">
                <h1 className="text-4xl italic font-extrabold text-center dark:text-white">About RealtorListings</h1>
            </div>
            <div id="body" className="w-full h-full p-3">
                <Accordion>
                    <Accordion.Panel>
                        <Accordion.Title>What is RealtorListings?</Accordion.Title>
                        <Accordion.Content>
                            <p className="mb-2 text-gray-500 dark:text-gray-400">
                                RealtorListings is a comprehensive online platform designed to streamline the process of browsing and accessing real estate listings from various real estate agencies. 
                                It serves as a centralized hub where potential buyers, sellers, and investors can explore a diverse range of properties, including residential homes, commercial spaces, apartments, and more. 
                                With RealtorListings, users can effortlessly navigate through listings, filter their search based on specific criteria such as location and price range, and connect directly with listing agents or agencies through provided links. 
                                This platform empowers both users and real estate professionals by facilitating efficient communication and enhancing visibility for listed properties.
                            </p>
                        </Accordion.Content>
                    </Accordion.Panel>
                    <Accordion.Panel>
                        <Accordion.Title>Our Mission</Accordion.Title>
                        <Accordion.Content>
                            <p className="text-gray-500 dark:text-gray-400">
                            At RealtorListings, our mission is to revolutionize the real estate experience by providing a seamless platform where individuals can effortlessly discover their perfect home. 
                            We are committed to empowering both consumers and real estate professionals by fostering transparent and efficient communication, ultimately guiding our users towards their ideal property with ease and confidence.
                            </p>
                        </Accordion.Content>
                    </Accordion.Panel>
                    <Accordion.Panel>
                        <Accordion.Title>Why RealtorListings?</Accordion.Title>
                        <Accordion.Content>
                            <p className="mb-4 text-gray-500 dark:text-gray-400">
                                RealtorListings stands out as the premier choice for your real estate needs due to our unwavering commitment to simplifying the property search process. 
                                With our user-friendly platform and extensive range of listings from top real estate agencies, finding your dream home or investment property has never been easier.
                                Trust RealtorListings to be your trusted partner in navigating the world of real estate, ensuring that you discover the perfect property tailored to your unique preferences and requirements. 
                            </p>
                            <p className="mb-2 text-gray-500 dark:text-gray-400">Ready to find the place to call home?</p>
                            <ul className="pl-5 text-gray-500 list-disc dark:text-gray-400">
                                <LoginLink class_str="text-cyan-600 hover:underline dark:text-cyan-500" />
                                <li>
                                    <Link to="/register" className="text-cyan-600 hover:underline dark:text-cyan-500">
                                        Get Started
                                    </Link>
                                </li>
                            </ul>
                        </Accordion.Content>
                    </Accordion.Panel>
                    <Accordion.Panel>
                        <Accordion.Title>Contact Us</Accordion.Title>
                        <Accordion.Content>
                            <p className="text-gray-500 dark:text-gray-400">
                                <b>Contact Email: </b> <a href="mailto:realtorlistings3@gmail.com" className="underline lowercase align-bottom decoration-dotted decoration-2 underline-offset-4 indent-3 decoration-sky-300 hover:decoration-sky-600 dark:decoration-sky-100 dark:hover:decoration-sky-300">realtorlistings3@gmail.com</a>
                            </p>
                        </Accordion.Content>
                    </Accordion.Panel>
                </Accordion>
            </div>
        </>
    )
}

export default About;