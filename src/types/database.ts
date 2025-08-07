export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bodegons: {
        Row: {
          id: string
          name: string
          address: string | null
          phone_number: string | null
          is_active: boolean | null
          logo_url: string | null
          created_by: string | null
          created_date: string | null
          modified_date: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone_number?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone_number?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bodegons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bodegon_categories: {
        Row: {
          id: string
          name: string
          is_active: boolean | null
          image: string | null
          created_by: string | null
          created_date: string | null
          modified_date: string | null
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean | null
          image?: string | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean | null
          image?: string | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bodegon_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bodegon_subcategories: {
        Row: {
          id: string
          name: string
          parent_category: string
          is_active: boolean | null
          created_by: string | null
          created_date: string | null
          modified_date: string | null
          image: string | null
        }
        Insert: {
          id?: string
          name: string
          parent_category: string
          is_active?: boolean | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
          image?: string | null
        }
        Update: {
          id?: string
          name?: string
          parent_category?: string
          is_active?: boolean | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
          image?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bodegon_subcategories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bodegon_subcategories_parent_category_fkey"
            columns: ["parent_category"]
            isOneToOne: false
            referencedRelation: "bodegon_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      bodegon_products: {
        Row: {
          id: string
          name: string
          description: string | null
          image_gallery_urls: string[] | null
          bar_code: string | null
          sku: string | null
          category_id: string | null
          subcategory_id: string | null
          price: number
          is_active_product: boolean | null
          is_discount: boolean | null
          is_promo: boolean | null
          created_by: string | null
          created_date: string | null
          modified_date: string | null
          discounted_price: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_gallery_urls?: string[] | null
          bar_code?: string | null
          sku?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          price: number
          is_active_product?: boolean | null
          is_discount?: boolean | null
          is_promo?: boolean | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
          discounted_price?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_gallery_urls?: string[] | null
          bar_code?: string | null
          sku?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          price?: number
          is_active_product?: boolean | null
          is_discount?: boolean | null
          is_promo?: boolean | null
          created_by?: string | null
          created_date?: string | null
          modified_date?: string | null
          discounted_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "bodegon_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "bodegon_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bodegon_inventories: {
        Row: {
          id: string
          product_id: string
          bodegon_id: string
          is_available_at_bodegon: boolean | null
          modified_date: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          product_id: string
          bodegon_id: string
          is_available_at_bodegon?: boolean | null
          modified_date?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          bodegon_id?: string
          is_available_at_bodegon?: boolean | null
          modified_date?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bodegoninventories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bodegon_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bodegoninventories_bodegon_id_fkey"
            columns: ["bodegon_id"]
            isOneToOne: false
            referencedRelation: "bodegons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bodegon_inventories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          name: string | null
          phone_number: string | null
          is_active: boolean | null
          role: number | null
          document_number: string | null
          document_type: string | null
          assigned_restaurants: string[] | null
          cart_items: string[] | null
        }
        Insert: {
          id?: string
          name?: string | null
          phone_number?: string | null
          is_active?: boolean | null
          role?: number | null
          document_number?: string | null
          document_type?: string | null
          assigned_restaurants?: string[] | null
          cart_items?: string[] | null
        }
        Update: {
          id?: string
          name?: string | null
          phone_number?: string | null
          is_active?: boolean | null
          role?: number | null
          document_number?: string | null
          document_type?: string | null
          assigned_restaurants?: string[] | null
          cart_items?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      roles: {
        Row: {
          id: number
          created_at: string
          name: string | null
        }
        Insert: {
          id?: never
          created_at?: string
          name?: string | null
        }
        Update: {
          id?: never
          created_at?: string
          name?: string | null
        }
        Relationships: []
      }
      user_bodegon_assignments: {
        Row: {
          user_id: string
          bodegon_id: string
          role_at_location: string
        }
        Insert: {
          user_id: string
          bodegon_id: string
          role_at_location: string
        }
        Update: {
          user_id?: string
          bodegon_id?: string
          role_at_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bodegon_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bodegon_assignments_bodegon_id_fkey"
            columns: ["bodegon_id"]
            isOneToOne: false
            referencedRelation: "bodegons"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}