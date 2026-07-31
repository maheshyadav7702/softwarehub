import axiosInstance from './axiosInstance'

export const loginService = {   
    login: async (email: string, password: string) => {
        const response = await axiosInstance.post('auth/login', { email, password })
        return response.data
    }
}

export const registerService = {
    register: async (userData: { first_name: string; last_name: string; email: string; password: string }) => {
        const response = await axiosInstance.post('auth/register', userData)
        return response.data
    }
}