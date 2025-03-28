import React, { useState, useEffect, useCallback } from 'react';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CustomAppBar from '../components/CustomAppBar'
import {
  Box,
  Button,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import axiosInstance from '../utils/axiosInstance';

const ReportsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState(null);
  const [reportsData, setReportsData] = useState([]);
  const [exportData, setExportData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    statusChoices: ['present', 'absent', 'late', 'pending']
  });
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  
  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axiosInstance.get('/api/attendance/reports/filters/');
        setFilterOptions(prev => ({
          ...prev,
          departments: response.data.departments || []
        }));
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Search for students when input changes
  useEffect(() => {
    const searchStudents = async () => {
      if (searchInput.length > 1) { // Only search after 2 characters
        setSearchLoading(true);
        try {
          const response = await axiosInstance.get('/api/attendance/reports/students/', {
            params: { q: searchInput }
          });
          setStudentSearchResults(response.data);
        } catch (error) {
          console.error('Error searching students:', error);
        } finally {
          setSearchLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(searchStudents, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Fetch reports based on filters - now also runs on initial load
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        statusFilter,
        departmentFilter,
      };

      // Add student filter if selected
      if (studentFilter) {
        params.studentId = studentFilter.id;
      }

      const response = await axiosInstance.get('/api/attendance/reports/', { params });
      
      setReportsData(response.data);
      setExportData(response.data.map((report) => ({
        Date: report.attendanceDate,
        Student: report.studentName,
        Status: report.status,
        Department: report.department,
        AttendancePercentage: report.attendancePercentage,
      })));
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, departmentFilter, studentFilter]);

  // Fetch data on initial load and when filters change
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Export data to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, 'attendance_reports.xlsx');
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
    <CustomAppBar openDrawer={drawerOpen} toggleDrawer={toggleDrawer} />
    <Box padding={3}>
      <Typography variant="h4" gutterBottom>
        Attendance Reports
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={2} marginBottom={3}>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Start Date"
          className="date-picker"
          selectsStart
          startDate={startDate}
          endDate={endDate}
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="End Date"
          className="date-picker"
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
        />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          displayEmpty
          variant="outlined"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Status</MenuItem>
          {filterOptions.statusChoices.map((status) => (
            <MenuItem key={status} value={status}>
              {formatStatus(status)}
            </MenuItem>
          ))}
        </Select>

        <Select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          displayEmpty
          variant="outlined"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Departments</MenuItem>
          {filterOptions.departments.map((dept) => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </Select>

        <Autocomplete
          options={studentSearchResults}
          getOptionLabel={(option) => `${option.username} (${option.student_id})`}
          value={studentFilter}
          onChange={(_, newValue) => setStudentFilter(newValue)}
          onInputChange={(_, newInputValue) => setSearchInput(newInputValue)}
          loading={searchLoading}
          sx={{ minWidth: 300 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Student (name or ID)"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchReports}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      <Box display="flex" gap={2} marginBottom={3}>
        <CSVLink data={exportData} filename="attendance_reports.csv">
          <Button variant="contained" color="success" disabled={reportsData.length === 0}>
            Export CSV
          </Button>
        </CSVLink>
        <Button 
          variant="contained" 
          color="info" 
          onClick={exportToExcel}
          disabled={reportsData.length === 0}
        >
          Export Excel
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Attendance Percentage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportsData.length > 0 ? (
              reportsData.map((report, index) => (
                <TableRow key={index}>
                  <TableCell>{report.attendanceDate}</TableCell>
                  <TableCell>{report.studentName}</TableCell>
                  <TableCell>{formatStatus(report.status)}</TableCell>
                  <TableCell>{report.department}</TableCell>
                  <TableCell>{report.attendancePercentage}%</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No attendance records found matching your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    </>
  );
};

export default ReportsPage;