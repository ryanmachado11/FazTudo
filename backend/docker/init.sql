CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  icon_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (id, name, slug, icon_url, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Eletricista', 'eletricista', '/icons/eletricista.svg', TRUE),
('22222222-2222-2222-2222-222222222222', 'Encanador', 'encanador', '/icons/encanador.svg', TRUE),
('33333333-3333-3333-3333-333333333333', 'Montador de Móveis', 'montador-de-moveis', '/icons/montador.svg', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
