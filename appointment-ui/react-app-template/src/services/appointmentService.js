// Mock appointment service for testing
export const fetchAppointments = jest.fn().mockResolvedValue([]);
export const createAppointment = jest.fn().mockResolvedValue({ id: 123 });
export const updateAppointment = jest.fn().mockResolvedValue({ id: 123 });
export const deleteAppointment = jest.fn().mockResolvedValue({ success: true });
export const checkApiStatus = jest.fn().mockResolvedValue(true);
