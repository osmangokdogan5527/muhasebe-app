import React from 'react';
import { LayoutDashboard, Users, Package, Receipt, Briefcase, Wallet, Settings, Lock } from 'lucide-react';

interface MobileBottomNavProps {
  handleNavigate: (tab: any) => void;
  activeTab: string;
  userRole: string;
  sensitiveTabs: string[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  handleNavigate,
  activeTab,
  userRole,
  sensitiveTabs
}) => {
  return null;
};
