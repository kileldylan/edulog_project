import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Radio, 
  RadioGroup, 
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { registerUser, fetchDepartments } from "../utils/api";

function Register() {
  const [userType, setUserType] = useState('student');
  const [userDetails, setUserDetails] = useState({ 
    student_id: '', 
    username: '', 
    email: '', 
    password: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await fetchDepartments();
        if (depts && depts.length > 0) {
          setDepartments(depts);
        } else {
          console.warn('No departments received from API');
        }
      } catch (err) {
        console.error('Error loading departments:', err);
        setError('Failed to load departments. Please try again later.');
      }
    };
    loadDepartments();
  }, []);

  const handleRegister = async () => {
    try {
      const dataToSend = {
        username: userDetails.username,
        email: userDetails.email.trim(),
        password: userDetails.password,
        role: userType,
        student_id: userType === 'student' ? userDetails.student_id.trim() : null,
        department_id: userType === 'student' ? userDetails.department_id : null
      };
      
      console.log("Sending registration request:", dataToSend);

      const response = await registerUser(dataToSend);
      
      console.log("Registration response:", response);

      if (response.success) {
        setSuccessMessage('Registration successful!');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }

      setUserDetails({ 
        student_id: '', 
        username: '', 
        email: '', 
        password: '',
        department_id: ''
      });
    } catch (err) {
      console.error('Error during registration:', err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        width: 400,
        mx: 'auto',
        mt: 8,
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
        textAlign: 'center'
      }}
    >
      <Typography variant="h5" gutterBottom>
        <PersonAddIcon /> Register
      </Typography>

      {successMessage && <Typography color="success.main">{successMessage}</Typography>}
      {error && <Typography color="error.main">{error}</Typography>}

      <RadioGroup
        row
        value={userType}
        onChange={(e) => setUserType(e.target.value)}
        sx={{ justifyContent: 'center', mb: 2 }}
      >
        <FormControlLabel value="admin" control={<Radio />} label="Admin" />
        <FormControlLabel value="student" control={<Radio />} label="Student" />
      </RadioGroup>

      {userType === 'student' && (
        <>
          <TextField
            label="Student ID"
            variant="outlined"
            fullWidth
            margin="normal"
            value={userDetails.student_id}
            onChange={(e) => setUserDetails({ ...userDetails, student_id: e.target.value })}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              value={userDetails.department_id}
              label="Department"
              onChange={(e) => setUserDetails({ ...userDetails, department_id: e.target.value })}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        value={userDetails.username}
        onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
      />

      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        margin="normal"
        value={userDetails.email}
        onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
      />

      <TextField
        label="Password"
        variant="outlined"
        type="password"
        fullWidth
        margin="normal"
        value={userDetails.password}
        onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleRegister}
        sx={{ mt: 2 }}
      >
        Register
      </Button>
    </Box>
  );
}

export default Register;