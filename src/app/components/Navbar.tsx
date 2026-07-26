'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const menus = [
    {
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      label: 'Categories',
      href: '/categories',
    },
    {
      label: 'Brands',
      href: '/brands',
    },
    {
      label: 'Products',
      href: '/products',
    },
    {
      label: 'Orders',
      href: '/orders',
    },
    {
      label: 'Users',
      href: '/users',
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    router.push('/login')
  }

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={1}
    >
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          href="/dashboard"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            mr: 4,
          }}
        >
          ShopHub
        </Typography>

        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexGrow: 1,
          }}
        >
          {menus.map((menu) => (
            <Button
              key={menu.href}
              component={Link}
              href={menu.href}
              variant={
                pathname === menu.href
                  ? 'contained'
                  : 'text'
              }
              color={
                pathname === menu.href
                  ? 'primary'
                  : 'inherit'
              }
            >
              {menu.label}
            </Button>
          ))}
        </Box>

        {/* Logout */}
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  )
}