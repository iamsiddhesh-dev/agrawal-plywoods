import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { ContactCheckResponse, PublicListing } from '../types';

export const PAGE_SIZE = 10;

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function fetchListings(
  page: number,
  searchTerm?: string
): Promise<{ rows: PublicListing[]; totalCount: number }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('public_listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (searchTerm && searchTerm.trim()) {
    query = query.ilike('name', `%${searchTerm.trim()}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  return { rows: (data ?? []) as PublicListing[], totalCount: count ?? 0 };
}

export async function createContactRequest(
  listingId: string,
  buyerName: string,
  buyerPhone: string
): Promise<string> {
  const { data, error } = await supabase.rpc('create_contact_request', {
    p_listing_id: listingId,
    p_buyer_name: buyerName,
    p_buyer_phone: buyerPhone,
  });

  if (error) throw error;

  return data as string;
}

export async function checkContactRequest(
  requestId: string
): Promise<ContactCheckResponse> {
  const { data, error } = await supabase
    .rpc('check_contact_request', { p_request_id: requestId })
    .single();

  if (error) throw error;

  return data as ContactCheckResponse;
}

export async function uploadListingPhoto(base64: string): Promise<string> {
  const path = `${randomId()}.jpg`;

  const { error } = await supabase.storage
    .from('listing-photos')
    .upload(path, decode(base64), { contentType: 'image/jpeg' });

  if (error) throw error;

  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);

  return data.publicUrl;
}

export interface NewListingInput {
  name: string;
  pricePerUnit: number;
  unit: string;
  quantityAvailable: number;
  notes?: string;
  photoUrl?: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
}

export async function createListing(input: NewListingInput): Promise<void> {
  const { error } = await supabase.from('listings').insert({
    name: input.name,
    price_per_unit: input.pricePerUnit,
    unit: input.unit,
    quantity_available: input.quantityAvailable,
    notes: input.notes || null,
    photo_url: input.photoUrl || null,
    seller_name: input.sellerName,
    seller_phone: input.sellerPhone,
    seller_email: input.sellerEmail || null,
  });

  if (error) throw error;
}
