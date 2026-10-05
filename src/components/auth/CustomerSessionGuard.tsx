import React from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { SessionClosedView } from '../customer/SessionClosedView';
import { securityGateway } from '../../services/securityGateway';

interface CustomerSessionGuardProps {
  children: React.ReactNode;
}

export const CustomerSessionGuard: React.FC<CustomerSessionGuardProps> = ({ children }) => {
  const { session } = useCustomer();

  const authCheck = securityGateway.authorizeCustomerAction(session, 'VIEW_MENU');

  if (!authCheck.allowed || session.status === 'CLOSED') {
    return <SessionClosedView />;
  }

  return <>{children}</>;
};
