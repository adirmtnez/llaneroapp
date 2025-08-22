export interface Restaurant {
  id: string
  name: string
  phone_number?: string
  logo_url?: string
  delivery_available: boolean
  pickup_available: boolean
  is_active: boolean
  created_by?: string
  created_at?: string
  modified_at?: string
}

export interface RestaurantCategory {
  id: string
  name: string
  description?: string
  image?: string
  image_url?: string
  is_active: boolean
  restaurant_id?: string
  created_date?: string
}

export interface RestaurantSubcategory {
  id: string
  name: string
  description?: string
  image?: string
  image_url?: string
  parent_category: string
  is_active: boolean
  restaurant_id?: string
  created_date?: string
}

export interface RestaurantProduct {
  id: string
  name: string
  description?: string
  price: number
  discounted_price?: number
  sku?: string
  bar_code?: string
  image_gallery_urls?: string[]
  image_url?: string
  category_id?: string
  subcategory_id?: string
  restaurant_id: string
  is_active: boolean
  is_discount: boolean
  is_promo: boolean
  size?: string
  volume?: string
  created_date?: string
  updated_date?: string
}