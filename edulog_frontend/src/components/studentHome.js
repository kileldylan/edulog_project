import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Switch,
  Divider,
  Snackbar,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import axios from 'axios';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const DashboardContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2rem',
  backgroundColor: '#f4f6f8',
  minHeight: '100vh',
});

const SwipeButton = styled(Switch)(({ theme }) => ({
  width: '60px',
  height: '34px',
  padding: '0',
  '& .MuiSwitch-switchBase': {
    padding: '6px',
    '&.Mui-checked': {
      transform: 'translateX(26px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.success.main,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: '22px',
    height: '22px',
  },
  '& .MuiSwitch-track': {
    borderRadius: 10,
    backgroundColor: theme.palette.error.main,
  },
}));

const OverviewCard = ({ title, count, icon, color }) => (
  <Card sx={{ minWidth: 250, m: 1, backgroundColor: color, color: 'white' }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>{icon}</Grid>
        <Grid item>
          <Typography variant="h5" fontWeight="bold">
            {count}
          </Typography>
          <Typography variant="subtitle1">{title}</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// Create a stable API instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

const token = localStorage.getItem('access_token');
console.log("Stored Token:", token); 

const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const response = await axios.post('/api/token/refresh/', { refresh: refreshToken });
    const newAccessToken = response.data.access;

    // Update the access token in localStorage
    localStorage.setItem('access_token', newAccessToken);

    return newAccessToken;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    // Clear tokens and redirect to login if refresh fails
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/'; // Redirect to login page
    throw error; // Re-throw the error to stop the request
  }
};

// Add a request interceptor to include the token in every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response, // Return the response if successful
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is due to an expired token (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried

      try {
        // Refresh the token
        const newAccessToken = await refreshToken();

        // Update the Authorization header with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Redirect to login if token refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // If the error is not due to an expired token, reject it
    return Promise.reject(error);
  }
);

const StudentHome = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [swipeDrawer, setSwipeDrawer] = useState(false);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
  });
  const [snackbar, setSnackbar] = useState({
    message: '',
    severity: 'success',
    open: false,
  });

  // Memoized function to fetch attendance data
  const fetchAttendanceData = useCallback(async (student_id) => {
    try {
      const response = await api.get(`attendance/${student_id}/`);
      setAttendanceStats(response.data);
    } catch (error) {
      setSnackbar({
        message: 'Failed to fetch attendance data',
        severity: 'error',
        open: true,
      });
    }
  }, []); // Empty dependency array

  // Memoized function to fetch department stats
  const fetchDepartmentStats = useCallback(async () => {
    try {
      const response = await api.get('students/stats/department-wise/');
      setDepartmentStats(response.data);
    } catch (error) {
      console.error('Failed to fetch department stats', error);
    }
  }, []); // Empty dependency array

  // Memoized function to fetch student name
  const fetchStudentName = useCallback(async (student_id) => {
    try {
      const response = await api.get(`students/${student_id}/`);
      setStudentName(response.data.name);
    } catch (error) {
      console.error('Failed to fetch student name', error);
    }
  }, []); // Empty dependency array

  // Fetch data on component mount
  useEffect(() => {
    const student_id = localStorage.getItem('student_id');
    if (student_id) {
      fetchAttendanceData(student_id);
      fetchDepartmentStats();
      fetchStudentName(student_id);
    } else {
      setSnackbar({
        message: 'Error fetching student ID',
        severity: 'error',
        open: true,
      });
      console.error("Student ID not found in localStorage.");
    }
  }, [fetchAttendanceData, fetchDepartmentStats, fetchStudentName]); // Empty dependency array

  // Handle clock-in/out
  const handleClockInOut = async () => {
    const student_id = localStorage.getItem('student_id');
    const token = localStorage.getItem('access_token');
  
    if (!student_id) {
      setSnackbar({
        message: 'Student ID is missing',
        severity: 'error',
        open: true,
      });
      return;
    }
  
    const apiUrl = isClockedIn
      ? '/attendance/clock-out/'
      : '/attendance/clock-in/';
  
    try {
      const response = await api.post(
        apiUrl,
        { student_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200 || response.status === 201) {
        setSnackbar({
          message: isClockedIn ? 'Clocked out successfully' : 'Clocked in successfully',
          severity: 'success',
          open: true,
        });
        setIsClockedIn(!isClockedIn);
        localStorage.setItem('isClockedIn', JSON.stringify(!isClockedIn));
        fetchAttendanceData(student_id); // Refresh attendance data
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error) {
      console.error("Error during clock-in/out:", error);
      setSnackbar({
        message: error.response?.data?.message || 'Error updating attendance status',
        severity: 'error',
        open: true,
      });
    }
  };

  return (
    <DashboardContainer>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Student Portal
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/studentProfile')}>
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 1200 }}>
        <Typography variant="h6" mb={2}>
          Welcome, {studentName}
        </Typography>
        <Typography variant="h6" mb={2}>
          Overview
        </Typography>
        <Grid container justifyContent="space-between">
          {attendanceStats ? (
            <>
              <OverviewCard
                title="Days Present"
                count={attendanceStats.present || 0}
                icon={<CheckCircleOutlineIcon fontSize="large" />}
                color="#66bb6a"
              />
              <OverviewCard
                title="Days Absent"
                count={attendanceStats.absent || 0}
                icon={<CancelOutlinedIcon fontSize="large" />}
                color="#ef5350"
              />
              <OverviewCard
                title="Days Late"
                count={attendanceStats.late || 0}
                icon={<CheckCircleOutlineIcon fontSize="large" />}
                color="#ffca28"
              />
            </>
          ) : (
            <Typography variant="body1">Loading attendance data...</Typography>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" mb={2}>
          Attendance Insights
        </Typography>
        <Box display="flex" justifyContent="center">
          <SwipeButton checked={isClockedIn} onChange={handleClockInOut} />
          <Typography variant="subtitle1" sx={{ ml: 1 }}>
            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
          </Typography>
        </Box>

        <SwipeableDrawer
          anchor="bottom"
          open={swipeDrawer}
          onClose={() => setSwipeDrawer(false)}
          onOpen={() => setSwipeDrawer(true)}
        >
          <Box p={2} textAlign="center">
            <Typography variant="h6">
              Swipe to {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Typography>
            <SwipeButton
              checked={isClockedIn}
              onChange={() => {
                handleClockInOut();
                setSwipeDrawer(false);
              }}
            />
          </Box>
        </SwipeableDrawer>
      </Paper>

      {/* Department-wise Stats (Chart) */}
      <Typography variant="h6" mb={2}>
        Department-wise Attendance Stats
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <Bar
          data={{
            labels: departmentStats.map((stat) => stat.department),
            datasets: [
              {
                label: 'Student Count',
                data: departmentStats.map((stat) => stat.student_count),
                backgroundColor: '#3f51b5',
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </DashboardContainer>
  );
};

export default StudentHome;