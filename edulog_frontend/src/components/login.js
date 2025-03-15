import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Grid, Box, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import loginImage from './images/loginImage.jpg'; // Adjust the path based on your folder structure
import { loginUser, storeToken } from "../utils/api";

const Login = () => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
          const credentials = { email, password };
          const data = await loginUser(credentials);
      
          // Store token and student_id in localStorage
          storeToken(data.access_token);
          localStorage.setItem('student_id', data.student_id)
      
          // Check user role and navigate accordingly
          if (data.role === "admin") {
            navigate("/adminHome");
          } else if (data.role === "student") {
            navigate("/studentHome");
          } else {
            setError("Unknown user role");
          }
        } catch (err) {
          setError(err.error || "Invalid credentials");
        }
      };
    
    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ p: 3, mt: 8, borderRadius: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    {/* School Image Placeholder */}
                    <img
                        src={loginImage} // Replace this URL with the school image URL
                        alt="School Logo"
                        style={{ width: '80%', borderRadius: 8, marginBottom: 20 }}
                    />
                </Box>
                <Typography component="h1" variant="h5" align="center" gutterBottom>
                    Sign In
                </Typography>
                {error && (
                    <Typography color="error" align="center" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <form onSubmit={handleLogin}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                label="Email" // Changed from Username to Email
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                sx={{ mt: 1, py: 1.5 }}
                            >
                                Sign In
                            </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ textAlign: 'center', mt: 1 }}>
                            <Typography variant="body2">
                                Don't have an account?
                                <Link to="/register" style={{ marginLeft: '5px', color: '#1976d2' }}>
                                    Register
                                </Link>
                            </Typography>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;