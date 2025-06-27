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

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [formType, setFormType] = useState<FormType>('login');

    const resetForm = useCallback(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
    }, []);

    const handleFormTypeChange = useCallback((type: FormType) => {
        setFormType(type);
        resetForm();
    }, [resetForm]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const validationErrors = getValidationErrors(
                formType,
                email,
                password,
                confirmPassword
            );
            setErrors(validationErrors);

            if (Object.keys(validationErrors).length === 0) {
                // TODO: Implement authentication logic here
                // Example: show success message, redirect, etc.
            }
        },
        [formType, email, password, confirmPassword]
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
                            Login
                        </Link>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}