import { supabase } from './supabase';
import type { AdminListing, NewListingInput, PendingListing, PendingRequest } from '../types';

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

export async function fetchAllListings(pin: string): Promise<AdminListing[]> {
  const { data, error } = await supabase.rpc('admin_all_listings', { p_pin: pin });
  if (error) throw error;
  return (data ?? []) as AdminListing[];
}

export async function addListing(pin: string, input: NewListingInput): Promise<string> {
  const { data, error } = await supabase.rpc('admin_add_listing', {
    p_pin: pin,
    p_name: input.name,
    p_price: input.price,
    p_unit: input.unit,
    p_quantity: input.quantity,
    p_notes: input.notes || null,
    p_photo_url: input.photoUrl || null,
    p_seller_name: input.sellerName,
    p_seller_phone: input.sellerPhone,
    p_seller_email: input.sellerEmail || null,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteListing(pin: string, id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_listing', { p_pin: pin, p_id: id });
  if (error) throw error;
}

export async function updateListing(pin: string, id: string, input: NewListingInput): Promise<void> {
  const { error } = await supabase.rpc('admin_update_listing', {
    p_pin: pin,
    p_id: id,
    p_name: input.name,
    p_price: input.price,
    p_unit: input.unit,
    p_quantity: input.quantity,
    p_notes: input.notes || null,
    p_photo_url: input.photoUrl || null,
    p_seller_name: input.sellerName,
    p_seller_phone: input.sellerPhone,
    p_seller_email: input.sellerEmail || null,
  });
  if (error) throw error;
}

export async function changePin(pin: string, newPin: string): Promise<void> {
  const { error } = await supabase.rpc('admin_change_pin', { p_pin: pin, p_new_pin: newPin });
  if (error) throw error;
}

export async function uploadListingPhoto(file: File): Promise<string> {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from('listing-photos')
    .upload(path, file, { contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
  return data.publicUrl;
}
