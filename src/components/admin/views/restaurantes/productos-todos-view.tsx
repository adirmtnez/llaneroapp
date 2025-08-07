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
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, MoreHorizontalIcon, PackageIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon } from "lucide-react"
import { useState, useMemo, useEffect } from "react"

// Tipos para productos
interface Product {
  id: string
  name: string
  sku: string
  price: number
  category: string
  subcategory: string
  is_active: boolean
  created_date: string
}

export function RestaurantesProductosTodosView() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string>('')

  // Mock data para productos de restaurantes mientras implementamos la conexión real
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'PIZZA MARGHERITA GRANDE',
      sku: '03-01-0001',
      price: 18.99,
      category: 'Pizzas',
      subcategory: 'Clásicas',
      is_active: true,
      created_date: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'HAMBURGUESA CLÁSICA CON PAPAS',
      sku: '03-02-0015',
      price: 12.99,
      category: 'Hamburguesas',
      subcategory: 'Clásicas',
      is_active: true,
      created_date: '2024-01-16T10:00:00Z'
    },
    {
      id: '3',
      name: 'PASTA CARBONARA',
      sku: '03-03-0008',
      price: 15.99,
      category: 'Pastas',
      subcategory: 'Cremosas',
      is_active: true,
      created_date: '2024-01-17T10:00:00Z'
    },
    {
      id: '4',
      name: 'ENSALADA CÉSAR',
      sku: '03-04-0003',
      price: 9.99,
      category: 'Ensaladas',
      subcategory: 'Clásicas',
      is_active: true,
      created_date: '2024-01-18T10:00:00Z'
    },
    {
      id: '5',
      name: 'POLLO A LA PLANCHA',
      sku: '03-05-0012',
      price: 16.99,
      category: 'Platos Principales',
      subcategory: 'Carnes',
      is_active: true,
      created_date: '2024-01-19T10:00:00Z'
    }
  ]

  const filterOptions = ['Activos', 'Inactivos', 'Archivados', 'Borrador']
  const categoryOptions = ['Todas', 'Pizzas', 'Hamburguesas', 'Pastas', 'Ensaladas', 'Platos Principales']

  // Simular carga de datos
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProducts(mockProducts)
      } catch (err) {
        setError('Error al cargar productos')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filtrar productos basado en búsqueda y filtros
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filtrar por estado
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(product => {
        return selectedFilters.some(filter => {
          switch (filter) {
            case 'Activos':
              return product.is_active
            case 'Inactivos':
              return !product.is_active
            case 'Archivados':
              return false // Por ahora no tenemos productos archivados
            case 'Borrador':
              return false // Por ahora no tenemos productos en borrador
            default:
              return true
          }
        })
      })
    }

    // Filtrar por categorías
    if (selectedCategories.length > 0 && !selectedCategories.includes('Todas')) {
      filtered = filtered.filter(product => 
        selectedCategories.includes(product.category)
      )
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [products, selectedFilters, selectedCategories, searchTerm])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredProducts.slice(startIndex, startIndex + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-[1200px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Productos de Restaurante</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
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
                            option === 'Archivados' ? 'bg-red-500' :
                            option === 'Borrador' ? 'bg-yellow-500' :
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
                    {categoryOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${option}`}
                          checked={selectedCategories.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, option])
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== option))
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${option}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {option}
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
                          <Skeleton className="h-3 w-32" />
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
                        onClick={() => window.location.reload()}
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
                          <span className="font-medium text-sm truncate max-w-[180px] sm:max-w-none">{product.name}</span>
                          {product.description && (
                            <span className="text-xs text-gray-500 truncate">{product.description}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.sku}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.is_active ? "default" : "secondary"} 
                        className={product.is_active 
                          ? "bg-green-100 text-green-700 border-green-200" 
                          : "bg-gray-100 text-gray-700 border-gray-200"}
                      >
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.category}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{product.subcategory}</span>
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
                          <DropdownMenuItem className="cursor-pointer">
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 cursor-pointer">
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
    </div>
  )
}