import React from 'react';

interface MobileBottomNavProps {
  handleNavigate: (tab: any) => void;
  activeTab: string;
  userRole: string;
  sensitiveTabs: string[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  // Mobile bottom navigation bar disabled by user request
  return null;
};
