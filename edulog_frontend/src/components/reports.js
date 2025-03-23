import React, { useState, useEffect, useCallback } from 'react';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
} from '@mui/material';
import axiosInstance from '../utils/axiosInstance';

const ReportsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [reportsData, setReportsData] = useState([]);
  const [exportData, setExportData] = useState([]);

  // Fetch reports based on filters
  const fetchReports = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/attendance/reports/', {
        params: {
          startDate: startDate ? startDate.toISOString().split('T')[0] : null,
          endDate: endDate ? endDate.toISOString().split('T')[0] : null,
          statusFilter,
          departmentFilter,
          studentNameFilter,
        },
      });
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
    }
  }, [startDate, endDate, statusFilter, departmentFilter, studentNameFilter]);

  // Fetch reports on filter change
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

  return (
    <Box padding={3}>
      <Typography variant="h4" gutterBottom>
        Attendance Reports
      </Typography>

      <Box display="flex" gap={2} marginBottom={3}>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Start Date"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="End Date"
        />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          displayEmpty
          variant="outlined"
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="present">Present</MenuItem>
          <MenuItem value="absent">Absent</MenuItem>
        </Select>

        <Select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          displayEmpty
          variant="outlined"
        >
          <MenuItem value="">All Departments</MenuItem>
          <MenuItem value="Department 1">Department 1</MenuItem>
          <MenuItem value="Department 2">Department 2</MenuItem>
          {/* Add more departments as needed */}
        </Select>

        <Select
          value={studentNameFilter}
          onChange={(e) => setStudentNameFilter(e.target.value)}
          displayEmpty
          variant="outlined"
        >
          <MenuItem value="">All Students</MenuItem>
          {/* Optionally, fetch and add student names dynamically */}
          <MenuItem value="John Doe">John Doe</MenuItem>
          <MenuItem value="Jane Smith">Jane Smith</MenuItem>
        </Select>

        <Button variant="contained" color="primary" onClick={fetchReports}>
          Apply Filters
        </Button>
      </Box>

      <Box display="flex" gap={2} marginBottom={3}>
        <CSVLink data={exportData} filename="attendance_reports.csv" className="btn btn-success">
          <Button variant="contained" color="success">
            Export CSV
          </Button>
        </CSVLink>
        <Button variant="contained" color="info" onClick={exportToExcel}>
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
            {reportsData.map((report, index) => (
              <TableRow key={index}>
                <TableCell>{report.attendanceDate}</TableCell>
                <TableCell>{report.studentName}</TableCell>
                <TableCell>{report.status}</TableCell>
                <TableCell>{report.department}</TableCell>
                <TableCell>{report.attendancePercentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportsPage;