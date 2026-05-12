import { createContext, useState, useContext } from "react";

const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handlePrevDay = () => setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  const handleNextDay = () => setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));

  return (
    <AttendanceContext.Provider value={{ 
      selectedDate, 
      setSelectedDate, 
      handlePrevDay, 
      handleNextDay,
      refreshKey,
      triggerRefresh 
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);
