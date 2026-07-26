import axiosInstance from './axiosInstance'

export const fetchCategories = {   
    getCategories: async () => {
        const response = await axiosInstance.get('/categories')
        return response.data
    },
    
    postCategory: async (categoryData: { name: string; description: string; is_active: boolean }) => {
        const response = await axiosInstance.post('/categories', categoryData)
        return response.data
    },  

    putCategory: async (id: number, categoryData: { name: string; description: string; is_active: boolean }) => {
        const response = await axiosInstance.put(`/categories/${id}`, categoryData)
        return response.data
    },

    deleteCategory: async (id: number) => {
        const response = await axiosInstance.delete(`/categories/${id}`)
        return response.data
    }
}