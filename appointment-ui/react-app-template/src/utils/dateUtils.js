/**
 * Formats a Date object to YYYY-MM-DD string format
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDateString(date) {
  if (!date) return '';
  
  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Convert to Date object if it's not already
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format as YYYY-MM-DD
  return dateObj.toISOString().slice(0, 10);
}

/**
 * Checks if two dates are the same day (ignoring time)
 * @param {string|Date} date1 - First date to compare
 * @param {string|Date} date2 - Second date to compare
 * @returns {boolean} True if dates are the same day
 */
export function isSameDay(date1, date2) {
  // Convert to string format if they aren't already
  const dateStr1 = typeof date1 === 'string' ? date1 : formatDateString(date1);
  const dateStr2 = typeof date2 === 'string' ? date2 : formatDateString(date2);
  
  // Compare the date strings
  return dateStr1 === dateStr2;
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns {string} Today's date as YYYY-MM-DD
 */
export function getTodayString() {
  return formatDateString(new Date());
}

/**
 * Parses a date string in YYYY-MM-DD format and returns a Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} The parsed Date object
 */
export function parseDate(dateString) {
  if (!dateString) return new Date();
  
  // If it's already a Date object, return it
  if (dateString instanceof Date) return dateString;
  
  // Parse the date string
  return new Date(dateString);
}

/**
 * Formats a date for display in the UI
 * @param {string|Date} date - The date to format
 * @param {string} format - The format to use (short, medium, long)
 * @returns {string} The formatted date string
 */
export function formatDateForDisplay(date, format = 'medium') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'medium':
    default:
      return dateObj.toLocaleDateString(undefined, { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
  }
}
