// src/services/savedGigsService.ts
import axios from 'axios';
import config from '@/config';

const API = axios.create({ baseURL: config.API_BASE_URL, withCredentials: true });

export function checkSaved(gigId: number, token: string) {
  return API.get<{
    success: boolean;
    data: { is_saved: boolean; saved_gig: { id: number } | null }
  }>(`/saved-gigs/check/${gigId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data.data);
}

export function toggleSaved(gigId: number, token: string) {
  return API.post<{
    success: boolean;
    data: { is_saved: boolean; saved_gig: { id: number } }
  }>(
    `/saved-gigs/toggle`,
    { gig_id: gigId },
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(r => r.data.data);
}
