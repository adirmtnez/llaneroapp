'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '../product-card'
import { ProductDetailDrawer } from '../product-detail-drawer'
import { publicSelect } from '@/utils/nuclear-client'
import { useAuth } from '@/contexts/auth-context'

export function BuscarView() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [productQuantities, setProductQuantities] = useState<Record<string | number, number>>({})
  const [loadingProductId, setLoadingProductId] = useState<string | number | null>(null)
  
  // Estados para categorías y subcategorías
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<any | null>(null)
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreProducts, setHasMoreProducts] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageSize = 20

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories()
  }, [])

  // Función de búsqueda con debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim().length >= 2 || selectedCategory || selectedSubcategory) {
        // Resetear paginación en nueva búsqueda
        setCurrentPage(1)
        searchProducts(1, true)
      } else {
        setProducts([])
        setHasMoreProducts(false)
        setTotalProducts(0)
      }
    }, 300) // Reducido de 500ms a 300ms

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, selectedCategory, selectedSubcategory])

  // Cargar categorías de bodegón y restaurante
  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      // Cargar solo categorías de bodegón
      const { data: bodegonCategories, error: bodegonError } = await publicSelect(
        'bodegon_categories',
        '*',
        { is_active: true }
      )

      // Solo usar categorías de bodegón
      const allCategories = (bodegonCategories || []).map(c => ({ ...c, type: 'bodegon' }))

      // Filtrar categorías de prueba
      const uniqueCategories = allCategories.filter(category => {
        // Excluir categorías de prueba
        const isTestCategory = category.name.toLowerCase().includes('test') || 
                              category.name.toLowerCase().includes('prueba') ||
                              category.name.toLowerCase() === 'test'
        
        return !isTestCategory
      })

      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Cargar subcategorías cuando se selecciona una categoría
  const loadSubcategories = async (category: any) => {
    try {
      // Cargar solo subcategorías de bodegón
      const { data: bodegonSubcategories } = await publicSelect(
        'bodegon_subcategories',
        '*',
        { parent_category: category.id, is_active: true }
      )

      // Solo usar subcategorías de bodegón
      const allSubcategories = (bodegonSubcategories || []).map(s => ({ ...s, type: 'bodegon' }))

      setSubcategories(allSubcategories)
    } catch (error) {
      console.error('Error cargando subcategorías:', error)
      setSubcategories([])
    }
  }

  const searchProducts = async (page: number = 1, isNewSearch: boolean = false) => {
    if (isNewSearch) {
      setLoadingProducts(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Construir filtros base solo para bodegón
      let bodegonFilters: any = { is_active: true }

      // Aplicar filtros de categoría/subcategoría si están seleccionados
      if (selectedSubcategory) {
        bodegonFilters.subcategory_id = selectedSubcategory.id
      } else if (selectedCategory) {
        bodegonFilters.category_id = selectedCategory.id
      }

      // Calcular offset para paginación
      const offset = (page - 1) * pageSize
      const limit = pageSize

      // Buscar solo en productos de bodegón
      const { data: bodegonProducts, error: bodegonError } = await publicSelect(
        'bodegon_products',
        `
          id, name, description, price, image_gallery_urls, sku, bar_code,
          is_active, is_discount, is_promo, discounted_price, created_date,
          category_id, subcategory_id,
          bodegon_categories!category_id(name), 
          bodegon_subcategories!subcategory_id(name)
        `,
        bodegonFilters
      )

      // Solo productos de bodegón
      const allProducts = (bodegonProducts || []).map(p => ({ ...p, type: 'bodegon' }))

      // Filtrar por término de búsqueda si existe
      let filteredProducts = allProducts
      if (searchTerm.trim()) {
        filteredProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }

      // Aplicar paginación manual (ya que el filtro de texto se hace en cliente)
      const totalCount = filteredProducts.length
      const paginatedProducts = filteredProducts.slice(offset, offset + limit)

      // Actualizar estado
      if (isNewSearch) {
        setProducts(paginatedProducts)
        setTotalProducts(totalCount)
      } else {
        // Agregar productos a la lista existente
        setProducts(prev => [...prev, ...paginatedProducts])
      }

      // Determinar si hay más productos
      const hasMore = (offset + limit) < totalCount
      setHasMoreProducts(hasMore)

      console.log('🔍 Búsqueda completada:', {
        page,
        totalCount,
        currentProducts: isNewSearch ? paginatedProducts.length : products.length + paginatedProducts.length,
        hasMore
      })

    } catch (error) {
      console.error('Error buscando productos:', error)
      if (isNewSearch) {
        setProducts([])
        setTotalProducts(0)
      }
      setHasMoreProducts(false)
    } finally {
      if (isNewSearch) {
        setLoadingProducts(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  // Cargar más productos
  const loadMoreProducts = async () => {
    if (hasMoreProducts && !loadingMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      await searchProducts(nextPage, false)
    }
  }

  // Obtener imagen de producto
  const getProductImage = (product: any) => {
    if (product.image_gallery_urls && Array.isArray(product.image_gallery_urls) && product.image_gallery_urls.length > 0) {
      return product.image_gallery_urls[0]
    }
    
    if (product.image_url) return product.image_url
    
    // Imagen por defecto para productos de bodegón
    return 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop&crop=center'
  }

  // Manejar click en producto
  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setShowProductDetail(true)
  }

  // Manejar cambios de cantidad de productos
  const handleProductQuantityChange = async (productId: string | number, quantity: number) => {
    console.log('🎯 Cambio de cantidad en búsqueda:', { productId, quantity, userId: user?.auth_user?.id })
    
    // Si no hay usuario autenticado, mostrar mensaje o navegar a login
    if (!user?.auth_user?.id) {
      console.log('👤 Usuario invitado - se requiere autenticación para agregar al carrito')
      // Aquí podrías mostrar un toast o navegar a login
      return
    }
    
    // Aquí implementarías la lógica de carrito similar a otros componentes
    setLoadingProductId(productId)
    
    try {
      // TODO: Implementar lógica de carrito
      console.log('📦 Operación de carrito pendiente de implementar')
      
      // Actualizar estado local temporalmente
      setProductQuantities(prev => ({
        ...prev,
        [productId]: quantity
      }))
    } catch (error) {
      console.error('💥 Error actualizando carrito:', error)
    } finally {
      setLoadingProductId(null)
    }
  }

  // Manejar selección de categoría
  const handleCategorySelect = async (category: any) => {
    if (selectedCategory?.id === category.id) {
      // Deseleccionar categoría
      setSelectedCategory(null)
      setSelectedSubcategory(null)
      setSubcategories([])
    } else {
      // Seleccionar nueva categoría
      setSelectedCategory(category)
      setSelectedSubcategory(null)
      await loadSubcategories(category)
    }
  }

  // Manejar selección de subcategoría
  const handleSubcategorySelect = (subcategory: any) => {
    if (selectedSubcategory?.id === subcategory.id) {
      // Deseleccionar subcategoría
      setSelectedSubcategory(null)
    } else {
      // Seleccionar nueva subcategoría
      setSelectedSubcategory(subcategory)
    }
  }

  // Limpiar búsqueda y filtros
  const clearSearch = () => {
    setSearchTerm('')
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setSubcategories([])
    setProducts([])
    setCurrentPage(1)
    setHasMoreProducts(false)
    setTotalProducts(0)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Buscar</h1>
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos, categorías..."
            className="w-full pl-10 pr-10 h-11 md:h-10 text-base md:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          />
          {(searchTerm || selectedCategory || selectedSubcategory) && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
              title="Limpiar todos los filtros"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Badges de Categorías */}
        {!loadingCategories && categories.length > 0 && (
          <div className="mt-4">
            <div className="flex space-x-2 overflow-x-auto pb-2 px-4 -mx-4">
              {categories.map((category, index) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory?.id === category.id ? "default" : "outline"}
                  className={`flex-shrink-0 cursor-pointer h-8 px-3 text-sm transition-all duration-200 ${
                    selectedCategory?.id === category.id
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  } ${index === 0 ? 'ml-0' : ''} ${index === categories.length - 1 ? 'mr-0' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Badges de Subcategorías */}
        {selectedCategory && subcategories.length > 0 && (
          <div className="mt-3">
            <div className="flex space-x-2 overflow-x-auto pb-2 px-4 -mx-4">
              {subcategories.map((subcategory, index) => (
                <Badge
                  key={subcategory.id}
                  variant={selectedSubcategory?.id === subcategory.id ? "default" : "secondary"}
                  className={`flex-shrink-0 cursor-pointer h-7 px-2 text-xs transition-all duration-200 ${
                    selectedSubcategory?.id === subcategory.id
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${index === 0 ? 'ml-0' : ''} ${index === subcategories.length - 1 ? 'mr-0' : ''}`}
                  onClick={() => handleSubcategorySelect(subcategory)}
                >
                  {subcategory.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {/* Estado inicial */}
        {!searchTerm && !selectedCategory && !selectedSubcategory && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Busca productos
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Escribe al menos 2 caracteres para buscar productos de bodegones
            </p>
          </div>
        )}

        {/* Loading */}
        {loadingProducts && (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="p-4 space-y-3">
                  <div className="aspect-square bg-gray-200 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultados */}
        {!loadingProducts && (searchTerm || selectedCategory || selectedSubcategory) && products.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {products.length} de {totalProducts} resultado{totalProducts !== 1 ? 's' : ''} 
                {searchTerm && ` para "${searchTerm}"`}
                {selectedSubcategory && ` en ${selectedSubcategory.name}`}
                {selectedCategory && !selectedSubcategory && ` en ${selectedCategory.name}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {products.map((product, index) => (
                <div 
                  key={`${product.type}-${product.id}`}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    description={product.description || ''}
                    price={product.discounted_price || product.price || 0}
                    originalPrice={product.is_discount && product.price !== product.discounted_price ? product.price : undefined}
                    image={getProductImage(product)}
                    initialQuantity={productQuantities[product.id] || 0}
                    onQuantityChange={handleProductQuantityChange}
                    currency="$"
                    onClick={() => handleProductClick(product)}
                    loading={loadingProductId === product.id}
                    isPromo={product.is_promo}
                    isDiscount={product.is_discount}
                    badge="Bodegón"
                  />
                </div>
              ))}
            </div>
            
            {/* Botón Cargar Más */}
            {hasMoreProducts && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className="h-11 md:h-10 text-base md:text-sm px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Cargar más productos
                      <span className="text-white/80">
                        ({totalProducts - products.length} restantes)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sin resultados */}
        {!loadingProducts && (searchTerm || selectedCategory || selectedSubcategory) && products.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-4">
              No hay productos que coincidan 
              {searchTerm && ` con "${searchTerm}"`}
              {selectedSubcategory && ` en ${selectedSubcategory.name}`}
              {selectedCategory && !selectedSubcategory && ` en ${selectedCategory.name}`}
            </p>
            <button
              onClick={clearSearch}
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Búsqueda muy corta */}
        {searchTerm && searchTerm.length < 2 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Escribe más caracteres
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Necesitas al menos 2 caracteres para realizar una búsqueda
            </p>
          </div>
        )}
      </div>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        open={showProductDetail}
        onOpenChange={setShowProductDetail}
        product={selectedProduct}
        initialQuantity={selectedProduct ? (productQuantities[selectedProduct.id] || 0) : 0}
        onQuantityChange={handleProductQuantityChange}
        currency="$"
        getProductImage={getProductImage}
        loading={selectedProduct ? loadingProductId === selectedProduct.id : false}
      />
    </div>
  )
}