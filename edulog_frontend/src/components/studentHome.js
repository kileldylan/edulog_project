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
import axiosInstance from '../utils/axiosInstance';
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

const StudentHome = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [swipeDrawer, setSwipeDrawer] = useState(false);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();
  // Removed todaysAttendance because it was unused
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
      const [stats] = await Promise.all([
        axiosInstance.get(`/api/attendance/${student_id}/`)
        // Removed attendance/today if not used
      ]);
      
      setAttendanceStats(stats.data);
    } catch (error) {
      setSnackbar({
        message: 'Failed to fetch attendance data',
        severity: 'error',
        open: true,
      });
    }
  }, []);

  // Memoized function to fetch department stats
  const fetchDepartmentStats = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/students/stats/department-wise/');
      setDepartmentStats(response.data);
    } catch (error) {
      console.error('Failed to fetch department stats', error);
    }
  }, []);

  // Memoized function to fetch student name
  const fetchStudentName = useCallback(async (student_id) => {
    try {
      const response = await axiosInstance.get(`/api/students/${student_id}/`);
      setStudentName(response.data.student_name);
    } catch (error) {
      console.error('Failed to fetch student name', error);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const student_id = sessionStorage.getItem('student_id');
    const storedStudentName = sessionStorage.getItem('student_name');
    console.log('Student ID:', student_id); // Debugging
    console.log('Stored Student Name:', storedStudentName); // Debugging
  
    if (student_id) {
      fetchAttendanceData(student_id);
      fetchDepartmentStats();
  
      // Only fetch student name if it's not already set
      if (!storedStudentName) {
        fetchStudentName(student_id);
      } else {
        setStudentName(storedStudentName);
      }
    } else {
      setSnackbar({
        message: "Error fetching student ID",
        severity: "error",
        open: true,
      });
      console.error("Student ID not found in localStorage.");
    }
    const checkClockStatus = async () => {
      try {
        const student_id = sessionStorage.getItem('student_id');
        if (student_id) {
          const response = await axiosInstance.get(`/api/attendance/${student_id}/status/`);
          setIsClockedIn(response.data.is_clocked_in);
        }
      } catch (error) {
        console.error('Error checking clock status:', error);
      }
    };
    checkClockStatus();
  }, [fetchAttendanceData, fetchDepartmentStats, fetchStudentName]);
  
  // Handle clock-in/out
  const handleClockInOut = async () => {
    try {
      const endpoint = isClockedIn ? '/api/attendance/clock-out/' : '/api/attendance/clock-in/';
      const response = await axiosInstance.post(endpoint);
      
      setSnackbar({
        message: response.data.message,
        severity: 'success',
        open: true,
      });
      
      // When clocking in, update the present count from the API response
      if (!isClockedIn && response.data.updated_present_count !== undefined) {
        setAttendanceStats(prev => ({
          ...prev,
          present: response.data.updated_present_count
        }));
      }
      
      // Toggle clock status
      setIsClockedIn(!isClockedIn);
    } catch (error) {
      setSnackbar({
        message: error.response?.data?.error || 'Clock operation failed',
        severity: 'error',
        open: true,
      });
    }
  };  

  // Use the computed present days count
  const presentDaysCount = attendanceStats.present || 0;

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
                count={presentDaysCount}
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
            {isClockedIn ? 'Clock Out' : 'Clock In'}
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
