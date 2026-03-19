import axios from 'axios'

const api = axios.create({
  baseURL: 'https://civil-registrar.onrender.com/api',
  withCredentials: true,
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export default api
