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
('11111111-1111-1111-1111-111111111111', 'Elétrica', 'eletrica', '/icons/eletrica.svg', TRUE),
('22222222-2222-2222-2222-222222222222', 'Hidráulica', 'hidraulica', '/icons/hidraulica.svg', TRUE),
('33333333-3333-3333-3333-333333333333', 'Montagem e Instalação', 'montagem-instalacao', '/icons/montagem-instalacao.svg', TRUE),
('44444444-4444-4444-4444-444444444444', 'Reforma e Acabamento', 'reforma-acabamento', '/icons/reforma-acabamento.svg', TRUE),
('55555555-5555-5555-5555-555555555555', 'Estrutura e Reparos Gerais', 'estrutura-reparos', '/icons/estrutura-reparos.svg', TRUE),
('66666666-6666-6666-6666-666666666666', 'Área Externa', 'area-externa', '/icons/area-externa.svg', TRUE),
('77777777-7777-7777-7777-777777777777', 'Serviços Faz-Tudo', 'servicos-faz-tudo', '/icons/servicos-faz-tudo.svg', TRUE),
('88888888-8888-8888-8888-888888888888', 'Climatização e Refrigeração', 'climatizacao-refrigeracao', '/icons/climatizacao-refrigeracao.svg', TRUE),
('99999999-9999-9999-9999-999999999999', 'Segurança Residencial e CFTV', 'seguranca-cftv', '/icons/seguranca-cftv.svg', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Limpeza e Higienização', 'limpeza-higienizacao', '/icons/limpeza-higienizacao.svg', TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Vidraçaria e Esquadrias', 'vidracaria-esquadrias', '/icons/vidracaria-esquadrias.svg', TRUE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Marcenaria e Carpintaria', 'marcenaria-carpintaria', '/icons/marcenaria-carpintaria.svg', TRUE),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Eletrodomésticos e Linha Branca', 'eletrodomesticos-linha-branca', '/icons/eletrodomesticos-linha-branca.svg', TRUE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Gás e Aquecimento', 'gas-aquecimento', '/icons/gas-aquecimento.svg', TRUE),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Tecnologia, Redes e Smart Home', 'tecnologia-smart-home', '/icons/tecnologia-smart-home.svg', TRUE),
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Pisos e Revestimentos', 'pisos-revestimentos', '/icons/pisos-revestimentos.svg', TRUE),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Fretes e Mudanças Leves', 'fretes-mudancas', '/icons/fretes-mudancas.svg', TRUE),
('cccccccc-3333-3333-3333-cccccccccccc', 'Redes de Proteção e Segurança Infantil', 'redes-protecao', '/icons/redes-protecao.svg', TRUE),
('dddddddd-4444-4444-4444-dddddddddddd', 'Piscinas e Área de Lazer', 'piscinas-lazer', '/icons/piscinas-lazer.svg', TRUE),
('eeeeeeee-5555-5555-5555-eeeeeeeeeeee', 'Serralharia e Estruturas Metálicas', 'serralharia-estruturas', '/icons/serralharia-estruturas.svg', TRUE),
('ffffffff-6666-6666-6666-ffffffffffff', 'Controle de Pragas e Sanitização', 'controle-pragas', '/icons/controle-pragas.svg', TRUE),
('11111111-7777-7777-7777-111111111111', 'Organização e Decoração', 'organizacao-decoracao', '/icons/organizacao-decoracao.svg', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
