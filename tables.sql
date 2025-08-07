-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bodegon_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  image text,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  CONSTRAINT bodegon_categories_pkey PRIMARY KEY (id),
  CONSTRAINT bodegon_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.bodegon_inventories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  bodegon_id uuid NOT NULL,
  is_available_at_bodegon boolean DEFAULT true,
  modified_date timestamp with time zone,
  created_by uuid,
  CONSTRAINT bodegon_inventories_pkey PRIMARY KEY (id),
  CONSTRAINT bodegoninventories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bodegon_products(id),
  CONSTRAINT bodegoninventories_bodegon_id_fkey FOREIGN KEY (bodegon_id) REFERENCES public.bodegons(id),
  CONSTRAINT bodegon_inventories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.bodegon_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_gallery_urls ARRAY,
  bar_code text,
  sku text UNIQUE,
  category_id uuid,
  subcategory_id uuid,
  price numeric NOT NULL,
  is_active_product boolean DEFAULT true,
  is_discount boolean DEFAULT false,
  is_promo boolean DEFAULT false,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  discounted_price numeric,
  CONSTRAINT bodegon_products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.bodegon_categories(id),
  CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.bodegon_subcategories(id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.bodegon_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_category uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  image text,
  CONSTRAINT bodegon_subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT bodegon_subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT bodegon_subcategories_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES public.bodegon_categories(id)
);
CREATE TABLE public.bodegons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone_number text,
  is_active boolean DEFAULT true,
  logo_url text,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  CONSTRAINT bodegons_pkey PRIMARY KEY (id),
  CONSTRAINT bodegons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.customeraddresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city character varying,
  state character varying,
  zip_code character varying,
  is_default boolean DEFAULT false,
  label character varying,
  CONSTRAINT customeraddresses_pkey PRIMARY KEY (id),
  CONSTRAINT customeraddresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_item (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0::numeric),
  bodegon_product_item text,
  restaurant_product_item text,
  name_snapshot character varying NOT NULL,
  order text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_item_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  delivery_address_id uuid NOT NULL,
  total_amount numeric NOT NULL,
  status character varying NOT NULL,
  selected_payment_detail_id uuid NOT NULL,
  payment_status character varying NOT NULL,
  order_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  delivery_date timestamp with time zone,
  assigned_bodegon_id uuid,
  assigned_restaurant_id uuid,
  assigned_delivery_person_id uuid,
  notes text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.customeraddresses(id),
  CONSTRAINT orders_selected_payment_detail_id_fkey FOREIGN KEY (selected_payment_detail_id) REFERENCES public.paymentmethoddetails(id),
  CONSTRAINT orders_assigned_bodegon_id_fkey FOREIGN KEY (assigned_bodegon_id) REFERENCES public.bodegons(id),
  CONSTRAINT orders_assigned_restaurant_id_fkey FOREIGN KEY (assigned_restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT orders_assigned_delivery_person_id_fkey FOREIGN KEY (assigned_delivery_person_id) REFERENCES public.users(id)
);
CREATE TABLE public.paymentmethoddetails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_method_id uuid NOT NULL,
  bodegon_owner_id uuid,
  restaurant_owner_id uuid,
  phone_number character varying,
  id_document character varying,
  bank_name character varying,
  account_number character varying,
  account_type character varying,
  zelle_email character varying,
  notes text,
  is_active_for_owner boolean DEFAULT true,
  CONSTRAINT paymentmethoddetails_pkey PRIMARY KEY (id),
  CONSTRAINT paymentmethoddetails_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.paymentmethods(id),
  CONSTRAINT paymentmethoddetails_bodegon_owner_id_fkey FOREIGN KEY (bodegon_owner_id) REFERENCES public.bodegons(id),
  CONSTRAINT paymentmethoddetails_restaurant_owner_id_fkey FOREIGN KEY (restaurant_owner_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.paymentmethods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  type character varying NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT paymentmethods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.restaurant_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  restaurant_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  image text,
  CONSTRAINT restaurant_categories_pkey PRIMARY KEY (id),
  CONSTRAINT restaurantcategories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.restaurant_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_gallery_urls ARRAY,
  price numeric NOT NULL,
  restaurant_id uuid NOT NULL,
  category_id uuid,
  subcategory_id uuid,
  is_available boolean DEFAULT true,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  CONSTRAINT restaurant_products_pkey PRIMARY KEY (id),
  CONSTRAINT restaurantplates_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurantplates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.restaurant_categories(id),
  CONSTRAINT restaurantplates_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.restaurant_subcategories(id),
  CONSTRAINT restaurant_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.restaurant_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_category uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  image text,
  CONSTRAINT restaurant_subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT restaurantsubcategories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT restaurant_subcategories_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES public.restaurant_categories(id)
);
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text,
  logo_url text,
  delivery_available boolean DEFAULT true,
  pickup_available boolean DEFAULT true,
  opening_hours text,
  is_active boolean DEFAULT true,
  cover_image text,
  created_by uuid,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  CONSTRAINT restaurants_pkey PRIMARY KEY (id),
  CONSTRAINT restaurants_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sliders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL,
  type text,
  display text,
  image_url text,
  title text,
  CONSTRAINT sliders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.userbodegonassignments (
  user_id uuid NOT NULL,
  bodegon_id uuid NOT NULL,
  role_at_location character varying NOT NULL,
  CONSTRAINT userbodegonassignments_pkey PRIMARY KEY (user_id, bodegon_id, role_at_location),
  CONSTRAINT userbodegonassignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT userbodegonassignments_bodegon_id_fkey FOREIGN KEY (bodegon_id) REFERENCES public.bodegons(id)
);
CREATE TABLE public.usercartitems (
  user_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  CONSTRAINT usercartitems_pkey PRIMARY KEY (user_id, order_item_id),
  CONSTRAINT usercartitems_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.userrestaurantassignments (
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  role_at_location character varying NOT NULL,
  CONSTRAINT userrestaurantassignments_pkey PRIMARY KEY (user_id, restaurant_id, role_at_location),
  CONSTRAINT userrestaurantassignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT userrestaurantassignments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  phone_number text,
  is_active boolean DEFAULT true,
  role bigint,
  document_number text,
  document_type text,
  assigned_restaurants ARRAY,
  cart_items ARRAY,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id)
);