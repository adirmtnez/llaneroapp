import { Database } from './database'

// Tipos base de las tablas
export type Bodegon = Database['public']['Tables']['bodegons']['Row']
export type BodegonCategory = Database['public']['Tables']['bodegon_categories']['Row']
export type BodegonSubcategory = Database['public']['Tables']['bodegon_subcategories']['Row']
export type BodegonProduct = Database['public']['Tables']['bodegon_products']['Row']
export type BodegonInventory = Database['public']['Tables']['bodegon_inventories']['Row']

// Tipos para inserts
export type BodegonInsert = Database['public']['Tables']['bodegons']['Insert']
export type BodegonCategoryInsert = Database['public']['Tables']['bodegon_categories']['Insert']
export type BodegonSubcategoryInsert = Database['public']['Tables']['bodegon_subcategories']['Insert']
export type BodegonProductInsert = Database['public']['Tables']['bodegon_products']['Insert']
export type BodegonInventoryInsert = Database['public']['Tables']['bodegon_inventories']['Insert']

// Tipos para updates
export type BodegonUpdate = Database['public']['Tables']['bodegons']['Update']
export type BodegonCategoryUpdate = Database['public']['Tables']['bodegon_categories']['Update']
export type BodegonSubcategoryUpdate = Database['public']['Tables']['bodegon_subcategories']['Update']
export type BodegonProductUpdate = Database['public']['Tables']['bodegon_products']['Update']
export type BodegonInventoryUpdate = Database['public']['Tables']['bodegon_inventories']['Update']

// Tipos extendidos con relaciones
export type BodegonWithDetails = Bodegon & {
  product_count?: number
  category_count?: number
}

export type BodegonCategoryWithSubcategories = BodegonCategory & {
  subcategories?: BodegonSubcategory[]
  product_count?: number
}

export type BodegonProductWithDetails = BodegonProduct & {
  category?: BodegonCategory | null
  subcategory?: BodegonSubcategory | null
  inventory?: BodegonInventory[]
}

// Tipos para formularios
export type BodegonFormData = {
  name: string
  address?: string
  phone_number?: string
  is_active?: boolean
  logo_url?: string
}

export type BodegonCategoryFormData = {
  name: string
  is_active?: boolean
  image?: string
}

export type BodegonSubcategoryFormData = {
  name: string
  parent_category: string
  is_active?: boolean
  image?: string
}

export type BodegonProductFormData = {
  name: string
  description?: string
  image_gallery_urls?: string[]
  bar_code?: string
  sku?: string
  category_id?: string
  subcategory_id?: string
  price: number
  is_active_product?: boolean
  is_discount?: boolean
  is_promo?: boolean
  discounted_price?: number
}