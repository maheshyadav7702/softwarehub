'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Switch,
} from '@mui/material'
import { fetchCategories } from '../services/categoryService'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const res = await fetchCategories.getCategories()  
    setCategories(res)
  }

  const handleSave = async () => {
    if (editingId) {
      await fetchCategories.putCategory(editingId, form)
    } else {
      await fetchCategories.postCategory(form)
    }

    setForm({
      name: '',
      description: '',
      is_active: true,
    })

    setEditingId(null)
    loadCategories()
  }

  const handleEdit = (item: { id: number; name: string; description: string; is_active: boolean }) => {
    setEditingId(item?.id)
    setForm({
      name: item?.name,
      description: item?.description,
      is_active: item?.is_active,
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return

    await fetchCategories.deleteCategory(id)
    loadCategories()
  }

  return (
    <Box p={3}>
      <h2>Categories</h2>

      <TextField
        fullWidth
        margin="normal"
        label="Name"
        value={form?.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <TextField
        fullWidth
        margin="normal"
        label="Description"
        value={form?.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
      />

      <Box display="flex" alignItems="center" mb={2}>
        Active
        <Switch
          checked={form?.is_active}
          onChange={(e) =>
            setForm({
              ...form,
              is_active: e.target.checked,
            })
          }
        />
      </Box>

      <Button variant="contained" onClick={handleSave}>
        {editingId ? 'Update' : 'Add'}
      </Button>

      <Paper sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {categories?.length > 0 && categories?.map((item: { id: number; name: string; description: string; is_active: boolean }) => (
              <TableRow key={item.id}>
                <TableCell>{item?.id}</TableCell>
                <TableCell>{item?.name}</TableCell>
                <TableCell>{item?.description}</TableCell>
                <TableCell>
                  {item?.is_active ? 'Active' : 'Inactive'}
                </TableCell>
         

                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </Button>

                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleDelete(item?.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}