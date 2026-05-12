/**
 * Format date to dd/mm/yyyy format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date) => {
  const rawDate = (date && typeof date === 'object' && date.date) ? date.date : date;
  if (!rawDate) return "-";
  
  const dateObj = typeof rawDate === 'string' ? new Date(rawDate.replace(' ', 'T')) : rawDate;
  
  if (isNaN(dateObj.getTime())) return "-";
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format date to dd/mm/yyyy HH:mm format
 * @param {Date|string} date - Date object or date string
 * @param {boolean} use12Hour - Whether to use 12-hour format with AM/PM (default: true)
 * @returns {string} Formatted date string in dd/mm/yyyy HH:mm format
 */
export const formatDateTime = (date, use12Hour = true) => {
  const rawDate = (date && typeof date === 'object' && date.date) ? date.date : date;
  if (!rawDate) return "-";
  
  const dateObj = typeof rawDate === 'string' ? new Date(rawDate.replace(' ', 'T')) : rawDate;
  
  if (isNaN(dateObj.getTime())) return "-";
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  if (use12Hour) {
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  } else {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
};

/**
 * Format time to HH:mm format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string in HH:mm format
 */
export const formatTime = (date, use12Hour = true) => {
  const rawDate = (date && typeof date === 'object' && date.date) ? date.date : date;
  if (!rawDate) return "-";
  
  const dateObj = typeof rawDate === 'string' ? new Date(rawDate.replace(' ', 'T')) : rawDate;
  
  if (isNaN(dateObj.getTime())) return "-";
  
  if (use12Hour) {
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${hoursStr}:${minutes} ${ampm}`;
  } else {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};
