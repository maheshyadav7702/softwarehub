"use client";
import React, { useState } from "react";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

interface FormState {
    name: string;
    email: string;
    message: string;
}

const ContactUsPage = () => {
    const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <Box maxWidth={600} mx="auto" py={6} px={2}>
            <Typography variant="h4" fontWeight="bold" mb={4}>
                Contact Us
            </Typography>
            {submitted ? (
                <Alert severity="success">
                    Thank you for contacting us! We will get back to you soon.
                </Alert>
            ) : (
                <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
                    <TextField
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        fullWidth
                        multiline
                        rows={5}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ alignSelf: "flex-start" }}
                    >
                        Send Message
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ContactUsPage;
