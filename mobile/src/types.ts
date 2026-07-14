export interface Listing {
  id: string;
  name: string;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  notes?: string;
  photo_url?: string;
  seller_name: string;
  seller_phone: string;
  seller_email?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PublicListing {
  id: string;
  name: string;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  notes?: string;
  photo_url?: string;
  seller_name: string;
  seller_phone_masked: string;
  seller_email_masked?: string;
  created_at: string;
}

export interface ContactRequest {
  id: string;
  listing_id: string;
  buyer_name: string;
  buyer_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ContactCheckResponse {
  request_status: 'pending' | 'approved' | 'rejected';
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
}
