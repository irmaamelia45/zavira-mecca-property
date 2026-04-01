import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUserRole, isLoggedIn } from '../../lib/auth';

export default function ProtectedRoute({ allowRoles = [] }) {
    const location = useLocation();
    const loggedIn = isLoggedIn();

    if (!loggedIn) {
        return <Navigate to="/auth/login" replace state={{ from: location }} />;
    }

    if (allowRoles.length > 0) {
        const role = getUserRole();
        if (!allowRoles.includes(role)) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}
