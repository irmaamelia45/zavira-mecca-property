import React from 'react';
import AccountDashboard from './AccountDashboard';
import MarketingDashboard from './MarketingDashboard';
import { getUserRole } from '../lib/auth';

export default function AccountHome() {
    const role = getUserRole();

    if (role === 'marketing') {
        return <MarketingDashboard />;
    }

    return <AccountDashboard />;
}
