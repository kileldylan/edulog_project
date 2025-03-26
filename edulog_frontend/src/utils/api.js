import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"; // Backend URL

// Function to handle student login
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login/`, credentials, {
      headers: {
        'Content-Type': 'application/json',  // Explicitly set the content type
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Network error" };
  }
};
export const registerUser = async (userData) => {
    try {
        console.log("Sending payload:", userData); // Log the payload
        const response = await axios.post(`${API_BASE_URL}/api/register/`, userData);
        return response.data; // Returns success or error response from backend
    } catch (error) {
        console.error('Registration error:', error.response ? error.response.data : error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

// Function to store token in localStorage
export const storeToken = (token) => {
  localStorage.setItem("access_token", token);
};

// Function to retrieve token from localStorage
export const getToken = () => {
  return localStorage.getItem("access_token");
};

// Function to logout student
export const logout = () => {
  // Clear current tab's session
  sessionStorage.clear();
  
  // Notify other tabs via localStorage
  localStorage.setItem('logout_event', Date.now().toString());
  localStorage.removeItem('logout_event');
  
  // Redirect
  window.location.href = '/login';
};
// Function to get authenticated user details
export const getStudentProfile = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/student-profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Failed to fetch user" };
  }
};

// Function to fetch attendance stats for a student
export const fetchAttendanceData = async (student_id) => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.get(`${API_BASE_URL}/api/attendance/${student_id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Failed to fetch attendance data" };
  }
};

export const fetchAllAttendanceRecords = async () => {
  try {
    const response = await axiosInstance.get('/admin/attendance/');
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response || error);
    throw error.response?.data || { error: 'Failed to fetch records' };
  }
};

// Function to fetch department-wise stats
export const fetchDepartmentStats = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.get(`${API_BASE_URL}/api/students/stats/department-wise/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Failed to fetch department stats" };
  }
};

// Function to fetch student details
export const fetchStudentName = async (student_id) => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.get(`${API_BASE_URL}/api/students/${student_id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Failed to fetch student details" };
  }
};

// Function to handle clock-in
export const clockIn = async (student_id) => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.post(
      `${API_BASE_URL}/api/attendance/clock-in/`,
      { student_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Failed to clock in" };
  }
};

// Function to handle clock-out
export const clockOut = async (student_id) => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.post(
      `${API_BASE_URL}/api/attendance/clock-out/`,
      { student_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Failed to clock out" };
  }
};