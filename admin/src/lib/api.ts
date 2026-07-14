import { supabase } from './supabase';
import type { PendingListing, PendingRequest } from '../types';

export async function checkPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_pin_ok', { p_pin: pin });
  if (error) throw error;
  return data as boolean;
}

export async function fetchPendingListings(pin: string): Promise<PendingListing[]> {
  const { data, error } = await supabase.rpc('admin_pending_listings', { p_pin: pin });
  if (error) throw error;
  return (data ?? []) as PendingListing[];
}

export async function fetchPendingRequests(pin: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase.rpc('admin_pending_requests', { p_pin: pin });
  if (error) throw error;
  return (data ?? []) as PendingRequest[];
}

export async function setListingStatus(
  pin: string,
  id: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_listing_status', {
    p_pin: pin,
    p_id: id,
    p_status: status,
  });
  if (error) throw error;
}

export async function setRequestStatus(
  pin: string,
  id: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_request_status', {
    p_pin: pin,
    p_id: id,
    p_status: status,
  });
  if (error) throw error;
}
