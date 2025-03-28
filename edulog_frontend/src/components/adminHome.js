import React, { useState, useEffect } from 'react';
import {
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  Container,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Box,
  Avatar,
  ListItemAvatar
} from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import AppBarComponent from './CustomAppBar';
import axiosInstance from '../utils/axiosInstance';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const AdminHome = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch username
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) setUsername(storedUsername);

        // 2. Fetch total students
        const totalRes = await axiosInstance.get('/api/attendance/stats/total-students/');
        setTotalStudents(totalRes.data.total);

        // 3. Fetch today's attendance
        const todayRes = await axiosInstance.get('/api/attendance/stats/attendance-today/');
        setAttendanceToday(todayRes.data.attendancePercentage);

        // 4. Fetch absent students
        const absentRes = await axiosInstance.get('/api/attendance/stats/absent-students/');
        setAbsentStudents(absentRes.data.absentCount);

        // 5. Fetch department stats
        const deptRes = await axiosInstance.get('/api/students/stats/department-wise/');
        setDepartmentStats(deptRes.data);

        // 6. Fetch attendance percentages
        const percentageRes = await axiosInstance.get('/api/attendance/stats/percentage/');
        setAttendanceData(percentageRes.data);

        // 7. Try to fetch recent logs (optional)
        try {
          const logsRes = await axiosInstance.get('/api/attendance/recent-logs/');
          setRecentLogs(logsRes.data);
        } catch (e) {
          console.log('Recent logs not available');
        }

        // 8. Try to fetch events (optional)
        try {
          const eventsRes = await axiosInstance.get('/api/events/upcoming/');
          setUpcomingEvents(eventsRes.data);
        } catch (e) {
          console.log('Events not available');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Chart data functions (same as before)
  const getDepartmentChartData = () => ({
    labels: departmentStats.map(stat => stat.name),
    datasets: [{
      label: 'Students per Department',
      data: departmentStats.map(stat => stat.student_count),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    }]
  });

  const getAttendancePercentageChartData = () => ({
    labels: attendanceData.map(item => item.username || `Student ${item.id}`),
    datasets: [{
      label: 'Attendance Percentage',
      data: attendanceData.map(item => item.attendance_percentage),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }]
  });

  const handleNavigation = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const renderStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'present': return <CheckCircleIcon color="success" />;
      case 'absent': return <CancelIcon color="error" />;
      case 'late': return <CheckCircleIcon color="warning" />;
      default: return <CheckCircleIcon color="info" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={80} />
      </Box>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBarComponent toggleDrawer={() => setDrawerOpen(!drawerOpen)} />
      <CssBaseline />
      
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          {['/adminHome', '/attendance', '/studentsManagement', '/reports', '/calendarPage', '/'].map((path) => (
            <ListItem button key={path} onClick={() => handleNavigation(path)}>
              <ListItemText primary={
                path === '/' ? 'Logout' : 
                path.substring(1).replace(/([A-Z])/g, ' $1').trim()
              } />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Container style={{ marginTop: '80px', marginBottom: '40px' }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {username}!
        </Typography>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={3} style={{ padding: '20px', textAlign: 'center' }}>
              <Typography variant="h6">Total Students</Typography>
              <Typography variant="h4">{totalStudents}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={3} style={{ padding: '20px', textAlign: 'center' }}>
              <Typography variant="h6">Today's Attendance</Typography>
              <Typography variant="h4">{attendanceToday}%</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={3} style={{ padding: '20px', textAlign: 'center' }}>
              <Typography variant="h6">Absent Today</Typography>
              <Typography variant="h4">{absentStudents}</Typography>
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} style={{ padding: '20px', height: '400px' }}>
              <Typography variant="h6" gutterBottom>Department Distribution</Typography>
              <Pie data={getDepartmentChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={3} style={{ padding: '20px', height: '400px' }}>
              <Typography variant="h6" gutterBottom>Student Attendance</Typography>
              <Bar data={getAttendancePercentageChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            </Paper>
          </Grid>

          {/* Recent Logs */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <Typography variant="h6" gutterBottom>Recent Attendance</Typography>
              <List>
                {recentLogs.slice(0, 5).map((log, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={`${log.student_name} (${log.student_id})`}
                      secondary={`${log.date} - ${log.status}`}
                    />
                    {renderStatusIcon(log.status)}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                style={{ marginBottom: '10px' }}
                onClick={() => navigate('/attendance')}
              >
                Manage Attendance
              </Button>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => navigate('/reports')}
              >
                Generate Reports
              </Button>
            </Paper>
          </Grid>

          {/* Upcoming Events */}
          <Grid item xs={12}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
              <List>
                {upcomingEvents.slice(0, 3).map((event, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>
                        <EventIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.title}
                      secondary={`${event.date} - ${event.location}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default AdminHome;