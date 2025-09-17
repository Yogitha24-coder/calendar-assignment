const BASE_URL = "http://localhost:5169/appointments";

// helper: build headers with auth
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchAppointments(date) {
  try {
    const res = await fetch(`${BASE_URL}?date=${date}`, {
      headers: getAuthHeaders(),
    });
    
    const text = await res.text();
    
    if (!res.ok) {
      throw new Error(`Failed to fetch appointments: ${text || res.status}`);
    }
    
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("API Error in fetchAppointments:", error);
    throw error;
  }
}

export async function createAppointment(appointment) {
  try {
    const payload = {
      title: appointment.title,
      description: appointment.description,
      date:
        appointment.date.length === 10
          ? appointment.date + "T00:00:00"
          : appointment.date,
      startTime:
        appointment.startTime.length === 5
          ? appointment.startTime + ":00"
          : appointment.startTime,
      endTime:
        appointment.endTime.length === 5
          ? appointment.endTime + ":00"
          : appointment.endTime,
      color: appointment.color || "blue",
      attendees: appointment.attendees || "",
    };

    console.log("Creating appointment with payload:", payload);

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    
    if (!res.ok) {
      throw new Error(`Failed to create appointment: ${text || res.status}`);
    }

    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("API Error in createAppointment:", error);
    throw error;
  }
}

export async function updateAppointment(id, appointment) {
  try {
    const payload = {
      title: appointment.title,
      description: appointment.description,
      date:
        appointment.date.length === 10
          ? appointment.date + "T00:00:00"
          : appointment.date,
      startTime:
        appointment.startTime.length === 5
          ? appointment.startTime + ":00"
          : appointment.startTime,
      endTime:
        appointment.endTime.length === 5
          ? appointment.endTime + ":00"
          : appointment.endTime,
      color: appointment.color || "blue",
      attendees: appointment.attendees || "",
    };

    console.log(`Updating appointment ${id} with payload:`, payload);

    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    
    if (!res.ok) {
      throw new Error(`Failed to update appointment: ${text || res.status}`);
    }

    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("API Error in updateAppointment:", error);
    throw error;
  }
}

export async function deleteAppointment(id) {
  try {
    console.log(`Deleting appointment ${id}`);
    
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const text = await res.text();
    
    if (!res.ok) {
      throw new Error(`Failed to delete appointment: ${text || res.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("API Error in deleteAppointment:", error);
    throw error;
  }
}

// Update the checkApiStatus function to use GET instead of HEAD
export async function checkApiStatus() {
  try {
    const res = await fetch(BASE_URL, {
      method: "GET", // Changed from HEAD to GET
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (error) {
    console.error("API is not reachable:", error);
    return false;
  }
}

