export interface Restaurant {
  id: string
  name: string
  description?: string
  logo_url?: string
  header_image_url?: string
  rating?: number
  review_count?: number
  is_active: boolean
  created_date?: string
  updated_date?: string
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