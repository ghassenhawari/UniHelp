import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api';

const AuthGuard: React.FC = () => {
    const user = api.getCurrentUser();
    const location = useLocation();

    if (!user) {
        // Rediriger vers login en gardant la page actuelle en mémoire
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default AuthGuard;
