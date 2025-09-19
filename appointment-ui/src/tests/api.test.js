import { 
  fetchAppointments, 
  createAppointment, 
  updateAppointment, 
  deleteAppointment,
  loginUser,
  registerUser
} from '../api';

// Mock fetch
global.fetch = jest.fn();

describe('API Functions', () => {
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockReset();
    
    // Mock localStorage for token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'fake-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  describe('fetchAppointments', () => {
    test('fetches appointments for a specific date', async () => {
      const mockResponse = [
        { id: 1, title: 'Meeting', startTime: '09:00', endTime: '10:00' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await fetchAppointments('2023-05-15');
      
      // Verify fetch was called with correct URL and headers
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments?date=2023-05-15'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });

    test('throws error when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(fetchAppointments('2023-05-15')).rejects.toThrow('Error 404: Not Found');
    });
  });

  describe('createAppointment', () => {
    test('creates a new appointment', async () => {
      const newAppointment = {
        title: 'Meeting',
        description: 'Team meeting',
        startTime: '09:00',
        endTime: '10:00',
        color: '#4285f4'
      };
      
      const mockResponse = { id: 1, ...newAppointment };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await createAppointment('2023-05-15', newAppointment);
      
      // Verify fetch was called with correct URL, method, and body
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
          }),
          body: JSON.stringify({ ...newAppointment, date: '2023-05-15' })
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateAppointment', () => {
    test('updates an existing appointment', async () => {
      const updatedAppointment = {
        title: 'Updated Meeting',
        description: 'Team meeting',
        startTime: '10:00',
        endTime: '11:00',
        color: '#4285f4'
      };
      
      const mockResponse = { id: 1, ...updatedAppointment };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await updateAppointment('2023-05-15', 1, updatedAppointment);
      
      // Verify fetch was called with correct URL, method, and body
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
          }),
          body: JSON.stringify({ ...updatedAppointment, date: '2023-05-15' })
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteAppointment', () => {
    test('deletes an appointment', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
      
      await deleteAppointment('2023-05-15', 1);
      
      // Verify fetch was called with correct URL and method
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
    });
  });

  describe('loginUser', () => {
    test('logs in a user', async () => {
      const mockResponse = {
        token: 'new-token',
        user: { id: 1, email: 'test@example.com' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await loginUser('test@example.com', 'password123');
      
      // Verify fetch was called with correct URL, method, and body
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });

    test('throws error when login fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });
      
      await expect(loginUser('test@example.com', 'wrong-password')).rejects.toThrow('Error 401: Unauthorized');
    });
  });

  describe('registerUser', () => {
    test('registers a new user', async () => {
      const mockResponse = {
        success: true,
        user: { id: 1, email: 'test@example.com' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await registerUser('test@example.com', 'password123');
      
      // Verify fetch was called with correct URL, method, and body
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
  });
});
