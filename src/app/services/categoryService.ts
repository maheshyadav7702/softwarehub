import axiosInstance from './axiosInstance'

export const fetchCategories = {   
    getCategories: async () => {
        const response = await axiosInstance.get('/categories')
        return response.data
    }
}