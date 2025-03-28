import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Typography, 
  CircularProgress,
  Box,
  Chip
} from '@mui/material';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { styled } from '@mui/system';
import axiosInstance from '../utils/axiosInstance';
import CustomAppBar from '../components//CustomAppBar';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';

const CalendarWrapper = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '20px',
  padding: '20px',
});

const CalendarPage = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: null,
    location: ''
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/events/');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDateClick = (date) => {
    setNewEvent(prev => ({
      ...prev,
      date: date
    }));
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEvent = async () => {
    if (!newEvent.date || !newEvent.title) {
      alert('Title and date are required!');
      return;
    }

    try {
      const payload = {
        ...newEvent,
        date: newEvent.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      };

      const response = await axiosInstance.post('/api/events/', payload);
      setEvents([...events, response.data]);
      setOpenDialog(false);
      setNewEvent({
        title: '',
        description: '',
        date: null,
        location: ''
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const renderEventsForSelectedDate = (date) => {
    if (!date) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.date === dateStr);

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    if (dayEvents.length > 0) {
      return (
        <div>
          <Typography variant="h6" gutterBottom>
            Events on {date.toLocaleDateString()}
          </Typography>
          {dayEvents.map((event, index) => (
            <Box key={index} mb={2} p={2} border={1} borderRadius={2} borderColor="divider">
              <Typography variant="subtitle1" fontWeight="bold">
                {event.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <EventIcon fontSize="small" /> {event.date}
              </Typography>
              {event.location && (
                <Typography variant="body2">
                  Location: {event.location}
                </Typography>
              )}
              {event.description && (
                <Typography variant="body2" mt={1}>
                  {event.description}
                </Typography>
              )}
            </Box>
          ))}
        </div>
      );
    } else {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6">No events scheduled</Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => handleDateClick(date)}
            sx={{ mt: 2 }}
          >
            Add Event
          </Button>
        </Box>
      );
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      <CustomAppBar openDrawer={drawerOpen} toggleDrawer={toggleDrawer} />
      <div style={{ padding: '20px', marginTop: '64px' }}>
        <Typography variant="h4" gutterBottom>Event Calendar</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <CalendarWrapper>
              <Calendar
                onChange={setDate}
                value={date}
                onClickDay={handleDateClick}
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const dateStr = date.toISOString().split('T')[0];
                    const hasEvents = events.some(event => event.date === dateStr);
                    return hasEvents ? (
                      <div style={{ marginTop: '5px' }}>
                        <Chip 
                          icon={<EventIcon style={{ fontSize: '12px' }} />}
                          label=""
                          size="small"
                          color="primary"
                          style={{ height: '18px' }}
                        />
                      </div>
                    ) : null;
                  }
                }}
              />
            </CalendarWrapper>
          </Grid>
          <Grid item xs={12} md={4}>
            <div style={{ 
              padding: '20px', 
              border: '1px solid #ccc', 
              borderRadius: '8px', 
              minHeight: '400px',
              backgroundColor: '#f9f9f9'
            }}>
              {renderEventsForSelectedDate(date)}
            </div>
          </Grid>
        </Grid>

        {/* Add Event Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Add New Event - {newEvent.date?.toLocaleDateString() || 'Select date'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Event Title"
              type="text"
              fullWidth
              variant="outlined"
              required
              value={newEvent.title}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="location"
              label="Location"
              type="text"
              fullWidth
              variant="outlined"
              value={newEvent.location}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={newEvent.description}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitEvent} variant="contained" color="primary">
              Save Event
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default CalendarPage;