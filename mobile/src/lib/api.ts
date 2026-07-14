import { supabase } from './supabase';
import type { ContactCheckResponse, PublicListing } from '../types';

export const PAGE_SIZE = 10;

export async function fetchListings(
  page: number
): Promise<{ rows: PublicListing[]; totalCount: number }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('public_listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

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
