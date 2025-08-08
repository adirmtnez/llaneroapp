import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, PackageIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { BodegonProductWithDetails, ProductStatusFilter } from "@/types/products"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { AgregarProductoBodegonView } from "./agregar-producto-view"
import { DeleteConfirmationModal } from '@/components/admin/modals/delete-confirmation-modal'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  is_active_product?: boolean
  created_date: string
  image_gallery_urls?: string[]
  bar_code?: string
  category_id?: string
  subcategory_id?: string
  is_discount?: boolean
  is_promo?: boolean
  discounted_price?: number
  created_by?: string
  modified_date?: string
}

export function BodegonesProductosTodosView() {
  const [selectedFilters, setSelectedFilters] = useState<ProductStatusFilter[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [products, setProducts] = useState<BodegonProductWithDetails[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [subcategories, setSubcategories] = useState<{id: string, name: string, parent_category: string}[]>([])
  const [error, setError] = useState<string>('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [productToEdit, setProductToEdit] = useState<BodegonProductWithDetails | null>(null)

  const { user } = useAuth()

  const filterOptions: ProductStatusFilter[] = ['Activos', 'Inactivos', 'En Descuento', 'En Promoción']

  // Load categories from Supabase with nuclear solution
  const loadCategories = async (isMountedRef?: { current: boolean }) => {
    
    if (isMountedRef && !isMountedRef.current) return
    
    try {
      // ✅ SOLUCIÓN NUCLEAR OPTIMIZADA - Usar cliente centralizado
      const { createNuclearClient } = await import('@/utils/nuclear-client')
      const loadClient = await createNuclearClient()
      
      if (!loadClient) {
        console.error('No se pudo crear cliente nuclear para categorías')
        return
      }

      // Query categorías activas
      const { data: categoriesData, error: categoriesError } = await loadClient
        .from('bodegon_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      
      if (categoriesError) {
        console.error('Error al cargar categorías:', categoriesError.message)
        return
      }

      if (categoriesData && isMountedRef?.current) {
        setCategories(categoriesData)
      }
      
    } catch (err) {
      console.error('Error inesperado al cargar categorías:', err)
    }
  }

  // Load subcategories from Supabase with nuclear solution
  const loadSubcategories = async (isMountedRef?: { current: boolean }) => {
    
    if (isMountedRef && !isMountedRef.current) return
    
    try {
      // ✅ SOLUCIÓN NUCLEAR - Cliente completamente nuevo para cargar subcategorías
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        return
      }
      
      if (!accessToken) {
        return
      }
      
      // Crear cliente fresco para carga de subcategorías
      const { createClient } = await import('@supabase/supabase-js')
      const loadClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          },
          db: {
            schema: 'public'
          }
        }
      )

      // Query todas las subcategorías (sin filtro is_active por si no están marcadas como activas)
      const { data: subcategoriesData, error: subcategoriesError } = await loadClient
        .from('bodegon_subcategories')
        .select('id, name, parent_category')
        .order('name')
      
      if (subcategoriesError) {
        console.error('Error al cargar subcategorías:', subcategoriesError.message)
        return
      }

      if (subcategoriesData && isMountedRef?.current) {
        setSubcategories(subcategoriesData)
      }
      
    } catch (err) {
      console.error('Error inesperado al cargar subcategorías:', err)
    }
  }

  // Load products from Supabase with nuclear solution
  const loadProducts = async (isMountedRef?: { current: boolean }) => {
    // Don't load if session is not ready or valid
    
    // ✅ Check if component is still mounted before setState
    if (isMountedRef && !isMountedRef.current) return
    
    try {
      setIsLoading(true)
      setError('')

      // ✅ SOLUCIÓN NUCLEAR OPTIMIZADA - Usar cliente centralizado
      const { createNuclearClient } = await import('@/utils/nuclear-client')
      const loadClient = await createNuclearClient()
      
      if (!loadClient) {
        setError('No se pudo crear cliente nuclear para productos')
        setIsLoading(false)
        return
      }

      // Query productos con joins a categorías y subcategorías
      let query = loadClient
        .from('bodegon_products')
        .select(`
          *,
          bodegon_categories!category_id(id, name),
          bodegon_subcategories!subcategory_id(id, name)
        `)

      // Aplicar filtros de estado
      if (selectedFilters.length > 0) {
        const orConditions: string[] = []
        
        if (selectedFilters.includes('Activos')) {
          orConditions.push('is_active_product.eq.true')
        }
        if (selectedFilters.includes('Inactivos')) {
          orConditions.push('is_active_product.eq.false')
        }
        if (selectedFilters.includes('En Descuento')) {
          orConditions.push('is_discount.eq.true')
        }
        if (selectedFilters.includes('En Promoción')) {
          orConditions.push('is_promo.eq.true')
        }
        
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','))
        }
      }

      // Aplicar filtros de categoría
      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories)
      }

      // Aplicar filtros de subcategoría
      if (selectedSubcategories.length > 0) {
        query = query.in('subcategory_id', selectedSubcategories)
      }

      // Filtrar por búsqueda
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,bar_code.ilike.%${searchTerm}%`)
      }

      query = query.order('created_date', { ascending: false })
      
      const { data: productsData, error: serviceError } = await query
      
      if (serviceError) {
        const errorMessage = 'Error al cargar productos: ' + serviceError.message
        setError(errorMessage)
        toast.error(errorMessage)
        setProducts([])
        return
      }

      if (!productsData) {
        setProducts([])
        return
      }

      // Transformar datos para incluir nombres de categoría y subcategoría
      const transformedData: BodegonProductWithDetails[] = productsData.map((product) => ({
        ...product,
        category_name: product.bodegon_categories?.name || 'Sin categoría',
        subcategory_name: product.bodegon_subcategories?.name || 'Sin subcategoría',
        inventory_count: 0 // TODO: Implementar conteo de inventario si es necesario
      }))

      setProducts(transformedData)
      
    } catch (err) {
      const errorMessage = err instanceof Error && err.message === 'Request timeout' 
        ? 'La consulta tardó demasiado tiempo. Intenta de nuevo.'
        : 'Error inesperado al cargar productos'
      
      setError(errorMessage)
      toast.error(errorMessage)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const handleEditClick = (product: BodegonProductWithDetails) => {
    setProductToEdit(product)
    setShowEditProduct(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    
    try {
      setDeletingId(productToDelete.id)

      // ✅ SOLUCIÓN NUCLEAR OPTIMIZADA - Usar cliente centralizado
      const { createNuclearClient } = await import('@/utils/nuclear-client')
      const nuclearClient = await createNuclearClient()
      
      if (!nuclearClient) {
        toast.error('No se pudo crear cliente nuclear para eliminar producto')
        setDeletingId(null)
        return
      }

      // First delete associated bodegon_inventories
      const { error: inventoryError } = await nuclearClient
        .from('bodegon_inventories')
        .delete()
        .eq('product_id', productToDelete.id)

      if (inventoryError) {
        toast.error('Error al eliminar inventarios: ' + inventoryError.message)
        setDeletingId(null)
        return
      }

      // Then delete the product
      const { error: productError } = await nuclearClient
        .from('bodegon_products')
        .delete()
        .eq('id', productToDelete.id)

      if (productError) {
        toast.error('Error al eliminar producto: ' + productError.message)
        setDeletingId(null)
        return
      }

      // Operación completada exitosamente
      toast.success('Producto eliminado exitosamente')
      loadProducts() // Reload the products list
      setShowDeleteModal(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error inesperado al eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  // Load categories and subcategories when session is ready
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!isMounted) return
      
      try {
        await Promise.all([
          loadCategories({ current: isMounted }),
          loadSubcategories({ current: isMounted })
        ])
      } catch (error) {
        console.error('Error loading categories/subcategories:', error)
      }
    }

    {
      loadData()
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Load products when session is ready and filters change
  useEffect(() => {
    let isMounted = true // ✅ Flag para prevenir setState en componentes desmontados

    const loadData = async () => {
      if (!isMounted) return
      
      try {
        await loadProducts({ current: isMounted })
      } catch (error) {
        if (isMounted) {
          setError('Error al cargar productos')
          setIsLoading(false)
        }
      }
    }

    {
      loadData()
    }

    return () => {
      // ✅ Cleanup para prevenir procesos colgantes
      isMounted = false
      setIsLoading(false)
    }
  }, [selectedFilters, selectedCategories, selectedSubcategories, searchTerm])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Los productos ya vienen filtrados de la consulta, solo paginamos
  const filteredProducts = useMemo(() => {
    return products
  }, [products])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredProducts.slice(startIndex, startIndex + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  if (showAddProduct || showEditProduct) {
    return <AgregarProductoBodegonView 
      onBack={() => {
        setShowAddProduct(false)
        setShowEditProduct(false)
        setProductToEdit(null)
        // Refresh the products list
        loadProducts()
      }} 
      onViewChange={() => {}} 
      productToEdit={productToEdit}
    />
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-[1200px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Productos de Bodegón</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadProducts()}
                disabled={isLoading}
                className="ml-2 h-6 px-2 text-xs"
              >
                {isLoading ? 'Cargando...' : 'Reintentar'}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
            <UploadIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
                <span className="hidden sm:inline">Más acciones</span>
                <span className="sm:hidden">Más</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Exportar seleccionados</DropdownMenuItem>
              <DropdownMenuItem>Eliminar seleccionados</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            size="sm" 
            className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm"
            onClick={() => setShowAddProduct(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                    <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                    Estado
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filterOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option}`}
                          checked={selectedFilters.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFilters([...selectedFilters, option])
                            } else {
                              setSelectedFilters(selectedFilters.filter(f => f !== option))
                            }
                          }}
                        />
                        <label
                          htmlFor={`status-${option}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            option === 'Activos' ? 'bg-green-500' :
                            option === 'Inactivos' ? 'bg-gray-400' :
                            option === 'En Descuento' ? 'bg-orange-500' :
                            option === 'En Promoción' ? 'bg-purple-500' :
                            'bg-blue-500'
                          }`}></div>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Category Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                    <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                    Categoría
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category.id])
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== category.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Subcategory Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                    <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                    Subcategoría
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subcategories.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">
                        No hay subcategorías disponibles
                      </div>
                    ) : (
                      subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subcategory-${subcategory.id}`}
                          checked={selectedSubcategories.includes(subcategory.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubcategories([...selectedSubcategories, subcategory.id])
                            } else {
                              setSelectedSubcategories(selectedSubcategories.filter(c => c !== subcategory.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`subcategory-${subcategory.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {subcategory.name}
                        </label>
                      </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 md:w-64 h-10 md:h-9 text-base md:text-sm"
                />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Subcategoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: pageSize }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="w-4 h-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-8 h-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16">
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
                        <AlertCircleIcon className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-lg font-medium text-red-700 mb-1">Error al cargar productos</p>
                      <p className="text-sm text-red-500 text-center max-w-md mb-4">
                        {error}
                      </p>
                      <Button
                        onClick={() => loadProducts()}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <PackageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">No se encontraron productos</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        {searchTerm ? `No hay productos que coincidan con "${searchTerm}"` : 'No hay productos para mostrar'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_gallery_urls && product.image_gallery_urls.length > 0 ? (
                          <img 
                            src={product.image_gallery_urls[0]} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              // Fallback si la imagen falla al cargar
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center ${
                            product.image_gallery_urls && product.image_gallery_urls.length > 0 ? 'hidden' : ''
                          }`}
                          style={{ display: product.image_gallery_urls && product.image_gallery_urls.length > 0 ? 'none' : 'flex' }}
                        >
                          <PackageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 pr-4">
                          <span className="font-medium text-xs capitalize truncate max-w-[180px] sm:max-w-none">{product.name.toLowerCase()}</span>
                          {product.bar_code && (
                            <span className="text-xs text-gray-500 truncate">Código: {product.bar_code}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.sku || 'Sin SKU'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={product.is_active_product ? "default" : "secondary"} 
                          className={product.is_active_product 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-gray-100 text-gray-700 border-gray-200"}
                        >
                          {product.is_active_product ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {product.is_discount && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                            Descuento
                          </Badge>
                        )}
                        {product.is_promo && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                            Promoción
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.category_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.subcategory_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">$ {product.price.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-10 md:h-8">
                            <MoreHorizontalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEditClick(product)
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
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
                ))
              )}
            </TableBody>
          </Table>

          {filteredProducts.length > 0 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600 text-center md:text-left">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredProducts.length)} de {filteredProducts.length} resultados
              </div>
              
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 justify-center md:justify-start">
                  <span className="whitespace-nowrap">Filas por página</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Página {currentPage} de {totalPages}</span>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 w-8 h-8"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    
                    {/* Números de página - Simplificado para mobile */}
                    <div className="flex items-center gap-1">
                      {/* Primera página siempre visible */}
                      <Button
                        variant={currentPage === 1 ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        1
                      </Button>
                      
                      {/* Solo mostrar páginas cercanas en mobile */}
                      {currentPage > 3 && totalPages > 4 && <span className="px-1 text-gray-400 text-xs">...</span>}
                      
                      {/* Mostrar menos páginas en mobile */}
                      {Array.from({ length: Math.min(isMobile ? 1 : 3, totalPages) }, (_, i) => {
                        const pageNum = Math.max(2, Math.min(currentPage - 1 + i, totalPages - 1));
                        if (pageNum === 1 || pageNum === totalPages) return null;
                        if (pageNum < 2 || pageNum > totalPages - 1) return null;
                        
                        return (
                          <Button
                            key={`page-${pageNum}-${i}`}
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {currentPage < totalPages - 2 && totalPages > 4 && <span className="px-1 text-gray-400 text-xs">...</span>}
                      
                      {/* Última página si hay más de 1 */}
                      {totalPages > 1 && (
                        <Button
                          variant={currentPage === totalPages ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {totalPages}
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 w-8 h-8"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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