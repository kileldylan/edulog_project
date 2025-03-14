import axios from "axios";

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

// Function to store token in localStorage
export const storeToken = (token) => {
  localStorage.setItem("authToken", token);
};

// Function to retrieve token from localStorage
export const getToken = () => {
  return localStorage.getItem("authToken");
};

// Function to logout student
export const logoutStudent = () => {
  localStorage.removeItem("authToken");
};
