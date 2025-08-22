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
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, PackageIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon, XIcon, ImageIcon } from "lucide-react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { AgregarProductoRestauranteView } from "./agregar-producto-view"
import { DeleteConfirmationModal } from '@/components/admin/modals/delete-confirmation-modal'
import { executeNuclearQuery } from '@/utils/nuclear-client'

interface RestaurantProduct {
  id: string
  name: string
  description?: string
  price: number
  is_available?: boolean
  created_at: string
  image_gallery_urls?: string[]
  restaurant_id?: string
  category_id?: string
  subcategory_id?: string
  is_discount?: boolean
  is_promo?: boolean
  discounted_price?: number
  created_by?: string
  modified_at?: string
  category_name?: string
  subcategory_name?: string
  restaurant_name?: string
}

type ProductStatusFilter = 'Disponibles' | 'No Disponibles' | 'En Promoción' | 'Con Descuento'

export function RestaurantesProdView() {
  const [selectedFilters, setSelectedFilters] = useState<ProductStatusFilter[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [products, setProducts] = useState<RestaurantProduct[]>([])
  const [restaurants, setRestaurants] = useState<{id: string, name: string}[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [subcategories, setSubcategories] = useState<{id: string, name: string}[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string>('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<RestaurantProduct | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<RestaurantProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { user } = useAuth()

  const filterOptions: ProductStatusFilter[] = ['Disponibles', 'No Disponibles', 'En Promoción', 'Con Descuento']

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedFilters, selectedCategories, selectedSubcategories, selectedRestaurants])

  // Load restaurants and categories
  const loadFiltersData = useCallback(async () => {
    try {
      // Load restaurants
      const restaurantsResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurants')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      }, false)

      if (restaurantsResult.data) {
        setRestaurants(restaurantsResult.data)
      }

      // Load categories
      const categoriesResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      }, false)

      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
      }

      // Load subcategories
      const subcategoriesResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_subcategories')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      }, false)

      if (subcategoriesResult.data) {
        setSubcategories(subcategoriesResult.data)
      }

    } catch (error) {
      console.error('Error loading filter data:', error)
    }
  }, [])

  // Load products with filters and pagination
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const { data, error } = await executeNuclearQuery(async (client) => {
        let query = client
          .from('restaurant_products')
          .select(`
            *,
            restaurant:restaurants(name),
            category:restaurant_categories(name),
            subcategory:restaurant_subcategories(name)
          `)

        // Apply status filters
        if (selectedFilters.includes('Disponibles')) {
          query = query.eq('is_available', true)
        }
        if (selectedFilters.includes('No Disponibles')) {
          query = query.eq('is_available', false)
        }
        if (selectedFilters.includes('En Promoción')) {
          query = query.eq('is_promo', true)
        }
        if (selectedFilters.includes('Con Descuento')) {
          query = query.eq('is_discount', true)
        }

        // Apply restaurant filter
        if (selectedRestaurants.length > 0) {
          query = query.in('restaurant_id', selectedRestaurants)
        }

        // Apply category filter
        if (selectedCategories.length > 0) {
          query = query.in('category_id', selectedCategories)
        }

        // Apply subcategory filter
        if (selectedSubcategories.length > 0) {
          query = query.in('subcategory_id', selectedSubcategories)
        }

        // Apply search filter
        if (debouncedSearchTerm) {
          query = query.ilike('name', `%${debouncedSearchTerm}%`)
        }

        // Add pagination
        const startIndex = (currentPage - 1) * pageSize
        query = query.range(startIndex, startIndex + pageSize - 1)

        // Order by creation date
        query = query.order('created_at', { ascending: false })

        return await query
      }, false)

      if (error) {
        setError('Error al cargar productos')
        toast.error('Error al cargar productos')
        return
      }

      // Transform data
      const transformedProducts = (data || []).map(product => ({
        ...product,
        restaurant_name: product.restaurant?.name || 'Sin restaurante',
        category_name: product.category?.name || 'Sin categoría',
        subcategory_name: product.subcategory?.name || '-'
      }))

      setProducts(transformedProducts)
      setTotalCount(transformedProducts.length)

    } catch (error) {
      setError('Error inesperado al cargar productos')
      toast.error('Error inesperado al cargar productos')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearchTerm, selectedFilters, selectedCategories, selectedSubcategories, selectedRestaurants])

  // Load data on mount
  useEffect(() => {
    loadFiltersData()
    loadProducts()
  }, [loadFiltersData, loadProducts])

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    return products // Server-side filtering already applied
  }, [products])

  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredProducts.slice(0, pageSize) // Already paginated server-side
  }, [filteredProducts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)

  // Handlers
  const handleFilterChange = (filter: ProductStatusFilter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowAddProduct(true)
  }

  const handleEditProduct = (product: RestaurantProduct) => {
    setEditingProduct(product)
    setShowAddProduct(true)
  }

  const handleDeleteClick = (product: RestaurantProduct) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    try {
      setIsDeleting(true)
      
      const { error } = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_products')
          .delete()
          .eq('id', productToDelete.id)
      }, false)

      if (error) {
        toast.error('Error al eliminar producto')
        return
      }

      toast.success('Producto eliminado exitosamente')
      await loadProducts()
      setShowDeleteModal(false)
      setProductToDelete(null)
    } catch (error) {
      toast.error('Error inesperado al eliminar producto')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBackFromAdd = () => {
    setShowAddProduct(false)
    setEditingProduct(null)
    loadProducts() // Refresh the list
  }

  if (showAddProduct) {
    return (
      <AgregarProductoRestauranteView
        onBack={handleBackFromAdd}
        onViewChange={() => {}}
        productToEdit={editingProduct}
      />
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Productos de Restaurantes</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadProducts}
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
            onClick={handleAddProduct}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {/* Filters and Search */}
          <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                    <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                    Estado
                    {selectedFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                        {selectedFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="space-y-2">
                    {filterOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option}`}
                          checked={selectedFilters.includes(option)}
                          onCheckedChange={() => handleFilterChange(option)}
                        />
                        <label
                          htmlFor={`status-${option}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            option === 'Disponibles' ? 'bg-green-500' :
                            option === 'No Disponibles' ? 'bg-gray-400' :
                            option === 'En Promoción' ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`} />
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Restaurant Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                    <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                    Restaurante
                    {selectedRestaurants.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                        {selectedRestaurants.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-2">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {restaurants.map((restaurant) => (
                      <div key={restaurant.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`restaurant-${restaurant.id}`}
                          checked={selectedRestaurants.includes(restaurant.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRestaurants(prev => [...prev, restaurant.id])
                            } else {
                              setSelectedRestaurants(prev => prev.filter(id => id !== restaurant.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`restaurant-${restaurant.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {restaurant.name}
                        </label>
                      </div>
                    ))}
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
                  className="pl-9 md:w-64"
                />
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-10 md:h-8">
                <FilterIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Restaurante</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Subcategoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
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
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
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
                      <Skeleton className="h-6 w-20 rounded-full" />
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
                        onClick={loadProducts}
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
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm truncate">{product.name}</span>
                          {product.description && (
                            <span className="text-xs text-gray-500 truncate">{product.description}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.restaurant_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.category_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.subcategory_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">${product.price}</span>
                        {product.is_discount && product.discounted_price && (
                          <span className="text-xs text-green-600">${product.discounted_price}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={product.is_available ? "default" : "secondary"} 
                          className={product.is_available 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-gray-100 text-gray-700 border-gray-200"}
                        >
                          {product.is_available ? 'Disponible' : 'No disponible'}
                        </Badge>
                        <div className="flex gap-1">
                          {product.is_promo && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Promo
                            </Badge>
                          )}
                          {product.is_discount && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                              Desc.
                            </Badge>
                          )}
                        </div>
                      </div>
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
                            onClick={() => handleEditProduct(product)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleDeleteClick(product)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalCount > 0 && (
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
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 w-8 h-8"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={productToDelete?.name || ''}
        itemType="producto"
        isLoading={isDeleting}
        requireNameConfirmation={false}
      />
    </div>
  )
}