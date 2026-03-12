import axios from 'axios'
import type { EnsayoDetail, CloroSolublePayload, SaveResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geofal.com.pe'
const MODULE = 'cloro-soluble'

const api = axios.create({
    baseURL: API_URL,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('session-expired'))
        }
        return Promise.reject(error)
    },
)

export async function saveEnsayo(payload: CloroSolublePayload, ensayoId?: number): Promise<SaveResponse> {
    const { data } = await api.post<SaveResponse>(`/api/${MODULE}/excel`, payload, {
        params: {
            download: false,
            ensayo_id: ensayoId,
        },
    })
    return data
}

export async function saveAndDownload(payload: CloroSolublePayload, ensayoId?: number): Promise<Blob> {
    const response = await api.post(`/api/${MODULE}/excel`, payload, {
        params: {
            download: true,
            ensayo_id: ensayoId,
        },
        responseType: 'blob',
    })
    return response.data
}

export async function getEnsayoDetail(ensayoId: number): Promise<EnsayoDetail> {
    const { data } = await api.get<EnsayoDetail>(`/api/${MODULE}/${ensayoId}`)
    return data
}

export default api
