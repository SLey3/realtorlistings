import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Login from './components/Login';
import Register from './components/Register';
import ConfirmAccount from './components/ConfirmAcc';
import Listings from './components/Listings';
import CreateListing from './components/Createlistings';
import MyDashboard from './components/MyDashboard';
import ManageListings from './components/ManageListings';
import EditListing from './components/EditListing';

function App() {
  return (
    <Router>
      <Routes>
        <Route index path="/" Component={Home}  />
        <Route path='/about' Component={About} />
        <Route path="/login" Component={Login} />
        <Route path="/register" Component={Register} />
        <Route path="/confirmacc/:ciphered" Component={ConfirmAccount} />
        <Route path="/listings" Component={Listings} />
        <Route path="/listings/create" Component={CreateListing} />
        <Route path="/dashboard" Component={MyDashboard} />
        <Route path="/dashboard/listings" Component={ManageListings} />
        <Route path="/dashboard/listings/edit/:id" Component={EditListing} />
      </Routes>
    </Router>
  );
}

export default App;
