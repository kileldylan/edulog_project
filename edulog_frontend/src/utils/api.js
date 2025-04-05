import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"; // Backend URL

// Function to handle login
export const loginUser = async (credentials) => {
  try {
    console.log("Sending login request with credentials:", credentials);
    const response = await axios.post(`${API_BASE_URL}/api/login/`, {
      email: credentials.email,
      password: credentials.password
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Full error object:", error);
    throw error.response ? error.response.data : { error: "Network error" };
  }
};

export const registerUser = async (userData) => {
    try {
        console.log("Sending payload:", userData); // Log the payload
        const response = await axios.post(`${API_BASE_URL}/api/register/`, userData);
        return response.data; 
    } catch (error) {
        console.error('Registration error:', error.response ? error.response.data : error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

export const fetchDepartments = async () => {
  try {
    const response = await axiosInstance.get('/departments/');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

// Function to store token in session
export const storeToken = (token) => {
  sessionStorage.setItem("access_token", token);
};

// Function to retrieve token from sessionStorage
export const getToken = () => {
  return sessionStorage.getItem("access_token");
};

// Function to logout student
export const logout = () => {
  // Clear current tab's session
  sessionStorage.clear();
  
  // Notify other tabs via sessionstorage
  sessionStorage.setItem('logout_event', Date.now().toString());
  sessionStorage.removeItem('logout_event');
  
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
    const token = sessionStorage.getItem("access_token");
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
    const token = sessionStorage.getItem("access_token");
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
    const token = sessionStorage.getItem("access_token");
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
    const token = sessionStorage.getItem("access_token");
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
    const token = sessionStorage.getItem("access_token");
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