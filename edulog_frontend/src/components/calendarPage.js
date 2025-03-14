import React, { useState, useEffect } from 'react';
import { Grid, Drawer, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, List, ListItem, ListItemText, } from '@mui/material';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Default styling for Calendar
import { styled } from '@mui/system';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Correct import
import AppBarComponent from './CustomAppBar';

const CalendarWrapper = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '20px',
  padding: '20px',
});

const CalendarPage = () => {
  const [date, setDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [open, setOpen] = useState(false);
  const [attendanceRemark, setAttendanceRemark] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  // Fetch attendance data from the backend
  useEffect(() => {
    // Replace with your actual endpoint
    axios.get('/api/attendance/records')
      .then(response => {
        setAttendanceData(response.data); // Assuming data is an array of records
      })
      .catch(err => console.log('Error fetching attendance data: ', err));
  }, []);

  // Handle date selection
  const handleDateClick = (selectedDate) => {
    setSelectedDate(selectedDate);
    setOpen(true);
  };

  // Handle form submission for remarks
  const handleSubmit = () => {
    if (selectedDate && attendanceRemark) {
      // Save the remark for the selected date
      const newRecord = {
        date: selectedDate.toISOString(),
        remark: attendanceRemark
      };

      axios.post('/api/attendance/add-remark', newRecord)
        .then(response => {
          setAttendanceData([...attendanceData, response.data]);
          setOpen(false);
        })
        .catch(error => {
          console.error("Error saving remark:", error);
        });
    } else {
      alert("Please provide a remark!");
    }
  };

  // Render attendance for the selected date
  const renderAttendanceForSelectedDate = (date) => {
    const record = attendanceData.find(item => item.date === date.toISOString());

    if (record) {
      return (
        <div>
          <Typography variant="h6">Attendance Record</Typography>
          <Typography>{record.remark}</Typography>
        </div>
      );
    } else {
      return (
        <div>
          <Typography variant="h6">No attendance recorded for this day.</Typography>
        </div>
      );
    }
  };

  const handleNavigation = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
    <AppBarComponent toggleDrawer={toggleDrawer} />
    <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          <ListItem button onClick={() => handleNavigation('/adminHome')}>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/attendance')}>
            <ListItemText primary="Attendance Records" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/studentsManagement')}>
            <ListItemText primary="Students" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/reports')}>
            <ListItemText primary="Reports" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/calendarPage')}>
            <ListItemText primary="Calendar" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/')}>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Student Attendance Calendar</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={8}>
          <CalendarWrapper>
            <Calendar
              onChange={setDate}
              value={date}
              onClickDay={handleDateClick} // Trigger when a day is clicked
            />
          </CalendarWrapper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            {renderAttendanceForSelectedDate(selectedDate || date)}
          </div>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Attendance Remark</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Remark"
            type="text"
            fullWidth
            variant="outlined"
            value={attendanceRemark}
            onChange={(e) => setAttendanceRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
    </>
  );
};

export default CalendarPage;
