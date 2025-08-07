// Tipos para productos de bodegón
export interface BodegonProduct {
  id: string
  name: string
  description?: string
  image_gallery_urls?: string[]
  bar_code?: string
  sku?: string
  category_id?: string
  subcategory_id?: string
  price: number
  is_active_product: boolean
  is_discount: boolean
  is_promo: boolean
  created_by?: string
  created_date?: string
  modified_date?: string
  discounted_price?: number
}

// Producto con detalles de categoría y subcategoría
export interface BodegonProductWithDetails extends BodegonProduct {
  category_name?: string
  subcategory_name?: string
  // Información de inventario (disponibilidad en bodegones)
  inventory_count?: number
  available_at_bodegons?: string[]
}

// Para insertar nuevos productos
export interface BodegonProductInsert {
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
  created_by?: string
  created_date?: string
  modified_date?: string
  discounted_price?: number
}

// Para actualizar productos
export interface BodegonProductUpdate {
  name?: string
  description?: string
  image_gallery_urls?: string[]
  bar_code?: string
  sku?: string
  category_id?: string
  subcategory_id?: string
  price?: number
  is_active_product?: boolean
  is_discount?: boolean
  is_promo?: boolean
  modified_date?: string
  discounted_price?: number
}

// Categorías de bodegón
export interface BodegonCategory {
  id: string
  name: string
  is_active: boolean
  image?: string
  created_by?: string
  created_date?: string
  modified_date?: string
}

// Subcategorías de bodegón
export interface BodegonSubcategory {
  id: string
  name: string
  parent_category: string
  is_active: boolean
  created_by?: string
  created_date?: string
  modified_date?: string
  image?: string
}

// Inventario de bodegón
export interface BodegonInventory {
  id: string
  product_id: string
  bodegon_id: string
  is_available_at_bodegon: boolean
  modified_date?: string
  created_by?: string
}

// Filtros para productos
export interface ProductFilters {
  is_active?: boolean
  is_discount?: boolean
  is_promo?: boolean
  category_id?: string
  subcategory_id?: string
  search?: string
  limit?: number
  offset?: number
}

// Para los tipos de filtros en la UI
export type ProductStatusFilter = 'Todos' | 'Activos' | 'Inactivos' | 'Archivados' | 'Borrador' | 'En Descuento' | 'En Promoción'