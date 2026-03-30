"use client";
import React from "react";
import { Container, Typography, Box } from "@mui/material";

const AboutUsPage = () => (
    <Container maxWidth="md" sx={{ py: 6 }}>
        <Box>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                About Us mahesh
                
            </Typography>
            <Typography variant="body1" paragraph>
                Welcome to SoftwareHub! 
            </Typography>
            <Typography variant="body1" paragraph>
                Our team consists of experienced developers, designers, and strategists dedicated to delivering high-quality products and exceptional customer service.
            </Typography>
            <Typography variant="body1" paragraph>
                At SoftwareHub, we believe in continuous learning, collaboration, and leveraging the latest technologies to solve real-world problems.
            </Typography>
            <Typography variant="body1">
                Thank you for visiting our site. We look forward to working with you!
            </Typography>
        </Box>
    </Container>
);


export default AboutUsPage;
