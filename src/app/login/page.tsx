'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Link,
    Stack
} from '@mui/material';

const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [formType, setFormType] = useState<'login' | 'signup' | 'forgot'>('login');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let newErrors: typeof errors = {};

        if (!validateEmail(email)) {
            newErrors.email = 'Invalid email address';
        }
        if (formType !== 'forgot' && password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Handle login, signup, or forgot password logic here
            alert(`${formType} successful!`);
        }
    };

    return (
      <Box
    component={Paper}
    elevation={6} // Increased elevation for more shadow
    sx={{
        maxWidth: 400,
        height: 'auto',
        mx: 'auto',
        mt: 6,
        p: 3,
        borderRadius: 2,
        marginBottom: 4,
    }}
>
            <Typography variant="h5" align="center" gutterBottom>
                {formType === 'login' && 'Login'}
                {formType === 'signup' && 'Sign Up'}
                {formType === 'forgot' && 'Forgot Password'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        autoComplete="email"
                    />
                    {formType !== 'forgot' && (
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                            required
                            error={!!errors.password}
                            helperText={errors.password}
                            autoComplete={formType === 'signup' ? 'new-password' : 'current-password'}
                        />
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ py: 1.5 }}
                    >
                        {formType === 'login' && 'Login'}
                        {formType === 'signup' && 'Sign Up'}
                        {formType === 'forgot' && 'Send Reset Link'}
                    </Button>
                </Stack>
            </Box>
            <Box mt={2} textAlign="center">
                {formType === 'login' && (
                    <>
                        <Typography variant="body2">
                            Don't have an account?{' '}
                            <Link
                                component="button"
                                type="button"
                                onClick={() => { setFormType('signup'); setErrors({}); }}
                                underline="none"
                            >
                                Sign Up
                            </Link>
                        </Typography>
                        <Typography variant="body2" mt={1}>
                            <Link
                                component="button"
                                type="button"
                                onClick={() => { setFormType('forgot'); setErrors({}); }}
                                underline="none"
                            >
                                Forgot Password?
                            </Link>
                        </Typography>
                    </>
                )}
                {formType === 'signup' && (
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <Link
                            component="button"
                            type="button"
                            onClick={() => { setFormType('login'); setErrors({}); }}
                            underline="none"
                        >
                            Login
                        </Link>
                    </Typography>
                )}
                {formType === 'forgot' && (
                    <Typography variant="body2">
                        Remembered your password?{' '}
                        <Link
                            component="button"
                            type="button"
                            onClick={() => { setFormType('login'); setErrors({}); }}
                            underline="none"
                        >
                            Login
                        </Link>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}