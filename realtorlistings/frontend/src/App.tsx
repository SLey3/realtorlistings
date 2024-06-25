import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Listings from './pages/Listings';
import CreateListing from './pages/Createlistings';
import MyDashboard from './pages/MyDashboard';
import ManageAccount from './pages/ManageAccount';
import ManageListings from './pages/ManageListings';
import EditListing from './components/EditListing';
import SeeListings from './components/SeeListing';
import ConfirmAccount from './components/ConfirmAcc';

function App() {
  return (
    <Router>
      <Routes>
        <Route index path="/" Component={Home}  />
        <Route path='/about' Component={About} />
        <Route path="/login" Component={Login} />
        <Route path="/register" Component={Register} />
        <Route path="/confirmacc/:ciphered" element={<ConfirmAccount />} />
        <Route path="/listings" Component={Listings} />
        <Route path="/listings/create" Component={CreateListing} />
        <Route path="/listings/view" element={<SeeListings />} />
        <Route path="/dashboard" Component={MyDashboard} />
        <Route path="/dashboard/manageacc" Component={ManageAccount} />
        <Route path="/dashboard/listings" Component={ManageListings} />
        <Route path="/dashboard/listings/edit/:id" element={<EditListing />} />
      </Routes>
    </Router>
  );
}

export default App;
