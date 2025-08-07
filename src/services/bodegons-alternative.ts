// Alternative implementation if bodegon_categories has bodegon_id field

// Get product count using bodegon_categories table
const { count, error: countError } = await supabase
  .from('bodegon_categories')
  .select('*', { count: 'exact', head: true })
  .eq('bodegon_id', bodegon.id)
  .eq('is_active', true)

return { ...bodegon, product_count: count || 0 }