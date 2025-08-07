'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusIcon, MoreHorizontalIcon } from 'lucide-react'
import { AgregarProductoBodegonView } from './agregar-producto-view'
import { useSupabaseQuery } from '@/contexts/supabase-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { DeleteConfirmationModal } from '@/components/admin/modals/delete-confirmation-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  price: number
  is_active_product: boolean | null
  created_date: string
  image_gallery_urls: string[] | null
  bar_code: string | null
  category_id: string | null
  subcategory_id: string | null
  is_discount: boolean | null
  is_promo: boolean | null
  discounted_price: number | null
  created_by: string | null
  modified_date: string | null
}

export function BodegonesProdView() {
  const [currentView, setCurrentView] = useState<'list' | 'add'>('list')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const supabaseQuery = useSupabaseQuery()

  const handleViewChange = (view: string) => {
    if (view === 'bodegones-productos' || view === 'productos') {
      setCurrentView('list')
      loadProducts() // Reload products when returning to list
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bodegon_products')
        .select('*')
        .order('created_date', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    
    try {
      setDeletingId(productToDelete.id)

      // First delete associated bodegon_inventories
      const { error: inventoryError } = await supabase
        .from('bodegon_inventories')
        .delete()
        .eq('product_id', productToDelete.id)

      if (inventoryError) throw inventoryError

      // Then delete the product
      const { error: productError } = await supabase
        .from('bodegon_products')
        .delete()
        .eq('id', productToDelete.id)

      if (productError) throw productError

      toast.success('Producto eliminado exitosamente')
      loadProducts() // Reload the products list
      setShowDeleteModal(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  if (currentView === 'add') {
    return (
      <AgregarProductoBodegonView 
        onBack={() => setCurrentView('list')}
        onViewChange={handleViewChange}
      />
    )
  }

  return (
    <div className="w-full max-w-[1200px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bodegones - Productos</h1>
        <Button 
          onClick={() => setCurrentView('add')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Agregar Producto
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6">
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-600">No hay productos registrados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.description || 'Sin descripción'}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.is_active_product 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active_product ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(product.created_date).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                           className="text-red-600 cursor-pointer"
                           onClick={(e) => {
                             e.preventDefault()
                             e.stopPropagation()
                             handleDeleteClick(product)
                           }}
                           disabled={deletingId === product.id}
                         >
                           {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemName={productToDelete?.name || ""}
        itemType="producto"
        onConfirm={handleDeleteConfirm}
        isLoading={deletingId !== null}
      />
    </div>
  )
}