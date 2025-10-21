'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Link,
    Stack
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

type FormType = 'login' | 'signup' | 'forgot';
type Errors = { email?: string; password?: string; confirmPassword?: string };

const getValidationErrors = (
    formType: FormType,
    email: string,
    password: string,
    confirmPassword: string
): Errors => {
    const errors: Errors = {};
    if (!validateEmail(email)) errors.email = 'Invalid email address';
    if (formType !== 'forgot' && password.length < 6)
        errors.password = 'Password must be at least 6 characters';
    if (formType === 'signup' && password !== confirmPassword)
        errors.confirmPassword = 'Passwords do not match';
    return errors;
};

const LoginPage = ()=> {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [formType, setFormType] = useState<FormType>('login');
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const router = useRouter();

    const resetForm = useCallback(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setApiError(null);
    }, []);

    const handleFormTypeChange = useCallback((type: FormType) => {
        setFormType(type);
        resetForm();
    }, [resetForm]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setApiError(null);
            const validationErrors = getValidationErrors(
                formType,
                email,
                password,
                confirmPassword
            );
            setErrors(validationErrors);

            if (Object.keys(validationErrors).length === 0) {
                setLoading(true);
                try {
                    if (formType === 'signup') {
                        // Signup API
                        const res = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/user/signup`,
                            { email, password, confirmPassword }
                        );
                        if (res) {
                            // Optionally, auto-login or show success message
                            setFormType('login');
                            setApiError('Signup successful! Please login.');
                        }
                    } else if (formType === 'login') {
                        // Login API
                        const res = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/user/login`,
                            { email, password }
                        );
                        if (res) {
                            // Save token if needed: localStorage.setItem('token', res.data.token)
                            router.push('/');
                        }
                    } else if (formType === 'forgot') {
                        // Forgot password API
                        const res = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/user/forgot-password`,
                            { email }
                        );
                        if (res.status === 200) {
                            setApiError('Reset link sent to your email.');
                        }
                    }
                } catch (err: unknown) {
                    setApiError(
                        'Something went wrong'
                    );
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        },
        [formType, email, password, confirmPassword, router]
    );

    return (
        <Box
            component={Paper}
            elevation={6}
            sx={{
                maxWidth: 400,
                mx: 'auto',
                mt: 6,
                p: 3,
                borderRadius: 2,
                mb: 4,
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
                    {formType === 'signup' && (
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            fullWidth
                            required
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            autoComplete="new-password"
                        />
                    )}
                    {apiError && (
                        <Typography color={apiError.includes('successful') ? 'success.main' : 'error.main'} variant="body2">
                            {apiError}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ py: 1.5 }}
                        disabled={loading}
                    >
                        {loading
                            ? 'Please wait...'
                            : formType === 'login'
                                ? 'Login'
                                : formType === 'signup'
                                    ? 'Sign Up'
                                    : 'Send Reset Link'}
                    </Button>
                </Stack>
            </Box>
            <Box mt={2} textAlign="center">
                {formType === 'login' && (
                    <>
                        <Typography variant="body2">
                            Don&#39;t have an account?{' '}
                            <Link
                                component="button"
                                type="button"
                                onClick={() => handleFormTypeChange('signup')}
                                underline="none"
                            >
                                Sign Up
                            </Link>
                        </Typography>
                        <Typography variant="body2" mt={1}>
                            <Link
                                component="button"
                                type="button"
                                onClick={() => handleFormTypeChange('forgot')}
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
                            onClick={() => handleFormTypeChange('login')}
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
                            onClick={() => handleFormTypeChange('login')}
                            underline="none"
                        >
                            Login page
                        </Link>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
export default LoginPage
