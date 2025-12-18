import React, { useContext } from 'react';
import StatsGrid from './StatsGrid';
import VisitorChart from './VisitorChart';
import ReminderSection from './ReminderSection';
import { ThemeContext } from '../App';

export default function Dashboard() {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className="flex flex-col gap-6">
      <StatsGrid />
      <VisitorChart />
      <ReminderSection />
    </div>
  );
}