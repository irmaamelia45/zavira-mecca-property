import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './components/layout/UserLayout';
import Home from './pages/Home';
import HousingList from './pages/HousingList';
import HousingDetail from './pages/HousingDetail';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Booking from './pages/Booking';
import PromoList from './pages/PromoList';
import PromoDetail from './pages/PromoDetail';
import KprInfo from './pages/KprInfo';
import KprSimulation from './pages/KprSimulation';
import CompanyProfile from './pages/CompanyProfile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import AccountHome from './pages/AccountHome';
import AccountBooking from './pages/AccountBooking';
import AccountBookingDetail from './pages/AccountBookingDetail';
import AccountFavorites from './pages/AccountFavorites';
import AccountProfile from './pages/AccountProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';

import PromoManagement from './pages/Admin/PromoManagement';
import BookingManagement from './pages/Admin/BookingManagement';
import BookingDetail from './pages/Admin/BookingDetail';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import PropertyManagement from './pages/Admin/PropertyManagement';
import AddProperty from './pages/Admin/AddProperty';
import EditProperty from './pages/Admin/EditProperty';
import PropertyDetail from './pages/Admin/PropertyDetail';
import TemplateSurat from './pages/Admin/TemplateSurat';
import KprManagement from './pages/Admin/KprManagement';
import CompanyProfileManagement from './pages/Admin/CompanyProfileManagement';
import WhatsappLogManagement from './pages/Admin/WhatsappLogManagement';
import AddPromo from './pages/Admin/AddPromo';
import EditPromo from './pages/Admin/EditPromo';
import PromoDetailAdmin from './pages/Admin/PromoDetail';
import MarketingUserManagement from './pages/Admin/MarketingUserManagement';
import AddMarketingUser from './pages/Admin/AddMarketingUser';
import AdminUserManagement from './pages/Admin/AdminUserManagement';
import AddAdminUser from './pages/Admin/AddAdminUser';
import AdminProfile from './pages/Admin/AdminProfile';

const NotFound = () => <div className="container-custom py-20 text-center text-2xl font-serif text-gray-500">404 - Halaman Tidak Ditemukan</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserLayout />}>
        <Route index element={<Home />} />
        <Route path="perumahan" element={<HousingList />} />
        <Route path="perumahan/:id" element={<HousingDetail />} />
        <Route path="promo" element={<PromoList />} />
        <Route path="promo/:id" element={<PromoDetail />} />
        <Route path="kpr" element={<KprInfo />} />
        <Route path="kpr/simulasi" element={<KprSimulation />} />
        <Route path="profil" element={<CompanyProfile />} />
        <Route path="auth/login" element={<Login />} />
        <Route path="auth/forgot-password" element={<ForgotPassword />} />
        <Route path="auth/reset-password" element={<ResetPassword />} />
        <Route path="auth/register" element={<Register />} />
        <Route element={<ProtectedRoute allowRoles={['user', 'marketing']} />}>
          <Route path="akun" element={<AccountHome />} />
          <Route path="akun/booking" element={<AccountBooking />} />
          <Route path="akun/booking/:id" element={<AccountBookingDetail />} />
          <Route path="akun/favorit" element={<AccountFavorites />} />
          <Route path="akun/profil" element={<AccountProfile />} />
          <Route path="akun/profile" element={<AccountProfile />} />
          <Route path="booking/:id" element={<Booking />} />
        </Route>
        <Route path="properti" element={<HousingList />} />
        <Route path="properti/:id" element={<HousingDetail />} />
        <Route path="login" element={<Navigate to="/auth/login" replace />} />
        <Route path="forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="register" element={<Navigate to="/auth/register" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute allowRoles={['admin', 'superadmin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="profil" element={<AdminProfile />} />
          <Route path="properties" element={<PropertyManagement />} />
          <Route path="properties/add" element={<AddProperty />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="properties/edit/:id" element={<EditProperty />} />
          <Route path="promos" element={<PromoManagement />} />
          <Route path="promos/add" element={<AddPromo />} />
          <Route path="promos/:id" element={<PromoDetailAdmin />} />
          <Route path="promos/edit/:id" element={<EditPromo />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="whatsapp-logs" element={<WhatsappLogManagement />} />
          <Route path="templates" element={<TemplateSurat />} />
          <Route path="kpr" element={<KprManagement />} />
          <Route path="company-profile" element={<CompanyProfileManagement />} />
          <Route path="marketing-users" element={<MarketingUserManagement />} />
          <Route path="marketing-users/add" element={<AddMarketingUser />} />
          <Route path="admin-users" element={<AdminUserManagement />} />
          <Route path="admin-users/add" element={<AddAdminUser />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
