export interface PendingListing {
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

export interface PendingRequest {
  id: string;
  listing_name: string;
  buyer_name: string;
  buyer_phone: string;
  created_at: string;
}

export interface AdminListing {
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

export interface NewListingInput {
  name: string;
  price: number;
  unit: string;
  quantity: number;
  notes?: string;
  photoUrl?: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
}
