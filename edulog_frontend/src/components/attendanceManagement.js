import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Drawer, Table, TableBody, TableCell, TableContainer, 
        TableHead, TableRow, List, ListItem, ListItemText, Paper, 
        IconButton, Snackbar, Alert, Dialog, DialogActions, 
        DialogContent, DialogTitle, TextField, Button } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import AppBarComponent from '../components/CustomAppBar';
import axiosInstance from '../utils/axiosInstance';

const AttendanceManagement = () => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState({
        id: '',
        student_id: '',
        student_name: '',
        date: '',
        status: 'present',
        clock_in_time: '',
        clock_out_time: ''
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const fetchAttendanceRecords = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/admin/attendance/');
            setAttendanceRecords(response.data);
        } catch (error) {
            console.error('Fetch error:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.error || 'Failed to load attendance records',
                severity: 'error'
            });
        }
    }, []);

    useEffect(() => {
        fetchAttendanceRecords();
    }, [fetchAttendanceRecords]);

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await axiosInstance.delete(`/admin/attendance/${id}/`);
                fetchAttendanceRecords();
                showSnackbar('Record deleted successfully', 'success');
            } catch (error) {
                showSnackbar(error.response?.data?.error || 'Failed to delete record', 'error');
            }
        }
    };

    const handleEdit = (record) => {
        setCurrentRecord({
            id: record.id,
            date: record.date,
            status: record.status,
            clock_in_time: record.clock_in_time || '',
            clock_out_time: record.clock_out_time || ''
        });
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            // Prepare payload - only include fields that can be updated
            const payload = {
                date: currentRecord.date,
                status: currentRecord.status,
                clock_in_time: currentRecord.clock_in_time || null,
                clock_out_time: currentRecord.clock_out_time || null
            };
    
            await axiosInstance.put(
                `/api/attendance/update/${currentRecord.id}/`,
                payload
            );
            fetchAttendanceRecords();
            showSnackbar('Record updated successfully', 'success');
            setEditDialogOpen(false);
        } catch (error) {
            // Enhanced error logging
            console.error('Update error details:', {
                status: error.response?.status,
                data: error.response?.data,
                request: error.config
            });
            showSnackbar(
                error.response?.data?.error || 
                JSON.stringify(error.response?.data) || 
                'Failed to update record', 
                'error'
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentRecord(prev => ({ ...prev, [name]: value }));
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        if (typeof time === 'string') {
            return time.split('.')[0]; // Remove microseconds if present
        }
        return time;
    };

    const handleNavigation = (path) => {
        setDrawerOpen(false);
        navigate(path);
    };

    return (
        <>
            <AppBarComponent toggleDrawer={() => setDrawerOpen(!drawerOpen)} />
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <List>
                    {['/adminHome', '/attendance', '/studentsManagement', '/reports', '/calendarPage', '/'].map((path) => (
                        <ListItem 
                            button 
                            key={path} 
                            onClick={() => handleNavigation(path)}
                        >
                            <ListItemText primary={
                                path === '/' ? 'Logout' : 
                                path.substring(1).replace(/([A-Z])/g, ' $1').trim()
                            } />
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            <Box sx={{ p: 10 }}>
                <Typography variant="h4" sx={{ mb: 3 }}>Attendance Records</Typography>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Student ID</TableCell>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Clock-In</TableCell>
                                <TableCell>Clock-Out</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendanceRecords.length > 0 ? (
                                attendanceRecords.map((record) => ( 
                                    <TableRow key={record.id}>
                                        <TableCell>{record.id}</TableCell>
                                        <TableCell>{record.student_id || record.user?.student_id || 'N/A'}</TableCell>
                                        <TableCell>{record.student_name}</TableCell>
                                        <TableCell>{record.date}</TableCell>
                                        <TableCell>{record.status}</TableCell>
                                        <TableCell>{formatTime(record.clock_in_time)}</TableCell>
                                        <TableCell>{formatTime(record.clock_out_time)}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(record)} color="primary">
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(record.id)} color="error">
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">No records found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                    <DialogTitle>Edit Attendance Record</DialogTitle>
                    <DialogContent>
                        <TextField
                            margin="normal"
                            fullWidth
                            type="date"
                            label="Date"
                            name="date"
                            value={currentRecord.date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            select
                            label="Status"
                            name="status"
                            value={currentRecord.status}
                            onChange={handleChange}
                            SelectProps={{ native: true }}
                        >
                            {['present', 'absent', 'late', 'pending'].map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </TextField>
                        <TextField
                            margin="normal"
                            fullWidth
                            type="time"
                            label="Clock-In Time"
                            name="clock_in_time"
                            value={currentRecord.clock_in_time}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            type="time"
                            label="Clock-Out Time"
                            name="clock_out_time"
                            value={currentRecord.clock_out_time}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} color="primary">Save</Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                >
                    <Alert 
                        severity={snackbar.severity}
                        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </>
    );
};

export default AttendanceManagement;
