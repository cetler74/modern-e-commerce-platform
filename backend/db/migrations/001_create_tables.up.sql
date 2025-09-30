-- Users and Authentication
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Product Catalog
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id BIGINT REFERENCES categories(id),
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DOUBLE PRECISION NOT NULL,
  compare_price DOUBLE PRECISION,
  cost_price DOUBLE PRECISION,
  track_inventory BOOLEAN DEFAULT TRUE,
  weight DOUBLE PRECISION,
  dimensions JSONB,
  images JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  seo_title VARCHAR(255),
  seo_description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_categories (
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  price DOUBLE PRECISION,
  compare_price DOUBLE PRECISION,
  cost_price DOUBLE PRECISION,
  barcode VARCHAR(100),
  weight DOUBLE PRECISION,
  image_url TEXT,
  options JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Management
CREATE TABLE inventory_locations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory_levels (
  product_variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id BIGINT REFERENCES inventory_locations(id) ON DELETE CASCADE,
  available_quantity INTEGER DEFAULT 0,
  committed_quantity INTEGER DEFAULT 0,
  incoming_quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (product_variant_id, location_id)
);

-- Customer Data
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  customer_number VARCHAR(50) UNIQUE,
  accepts_marketing BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  notes TEXT,
  total_spent DOUBLE PRECISION DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('billing', 'shipping')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(100),
  address1 VARCHAR(255) NOT NULL,
  address2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES customers(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  financial_status VARCHAR(20) DEFAULT 'pending' CHECK (financial_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded')),
  subtotal DOUBLE PRECISION NOT NULL,
  tax_amount DOUBLE PRECISION DEFAULT 0,
  shipping_amount DOUBLE PRECISION DEFAULT 0,
  discount_amount DOUBLE PRECISION DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_address JSONB,
  shipping_address JSONB,
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_line_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id BIGINT REFERENCES product_variants(id),
  title VARCHAR(255) NOT NULL,
  variant_title VARCHAR(255),
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  total_discount DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscription_plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  billing_interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  plan_id BIGINT REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  billing_address JSONB,
  shipping_address JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscription_items (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_variant_id BIGINT REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog/CMS
CREATE TABLE blog_posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id BIGINT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  seo_title VARCHAR(255),
  seo_description TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id BIGINT REFERENCES users(id),
  session_id VARCHAR(100),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
