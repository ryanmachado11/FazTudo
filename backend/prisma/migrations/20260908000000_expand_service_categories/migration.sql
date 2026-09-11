ALTER TABLE `categories`
	MODIFY COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	MODIFY COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

INSERT INTO `categories` (`id`, `name`, `slug`, `icon_url`, `is_active`) VALUES
('44444444-4444-4444-4444-444444444444', 'Reforma e Acabamento', 'reforma-acabamento', '/icons/reforma-acabamento.svg', TRUE),
('55555555-5555-5555-5555-555555555555', 'Área Externa', 'area-externa', '/icons/area-externa.svg', TRUE),
('66666666-6666-6666-6666-666666666666', 'Serviços Faz-Tudo', 'servicos-faz-tudo', '/icons/servicos-faz-tudo.svg', TRUE),
('77777777-7777-7777-7777-777777777777', 'Climatização e Refrigeração', 'climatizacao-refrigeracao', '/icons/climatizacao-refrigeracao.svg', TRUE),
('88888888-8888-8888-8888-888888888888', 'Segurança Residencial e CFTV', 'seguranca-cftv', '/icons/seguranca-cftv.svg', TRUE),
('99999999-9999-9999-9999-999999999999', 'Limpeza e Higienização', 'limpeza-higienizacao', '/icons/limpeza-higienizacao.svg', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vidraçaria e Esquadrias', 'vidracaria-esquadrias', '/icons/vidracaria-esquadrias.svg', TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marcenaria e Carpintaria', 'marcenaria-carpintaria', '/icons/marcenaria-carpintaria.svg', TRUE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Eletrodomésticos e Linha Branca', 'eletrodomesticos-linha-branca', '/icons/eletrodomesticos-linha-branca.svg', TRUE),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Gás e Aquecimento', 'gas-aquecimento', '/icons/gas-aquecimento.svg', TRUE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Tecnologia, Redes e Smart Home', 'tecnologia-smart-home', '/icons/tecnologia-smart-home.svg', TRUE),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Pisos e Revestimentos', 'pisos-revestimentos', '/icons/pisos-revestimentos.svg', TRUE),
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Fretes e Mudanças Leves', 'fretes-mudancas', '/icons/fretes-mudancas.svg', TRUE),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Redes de Proteção e Segurança Infantil', 'redes-protecao', '/icons/redes-protecao.svg', TRUE),
('cccccccc-3333-3333-3333-cccccccccccc', 'Piscinas e Área de Lazer', 'piscinas-lazer', '/icons/piscinas-lazer.svg', TRUE),
('dddddddd-4444-4444-4444-dddddddddddd', 'Serralharia e Estruturas Metálicas', 'serralharia-estruturas', '/icons/serralharia-estruturas.svg', TRUE),
('eeeeeeee-5555-5555-5555-eeeeeeeeeeee', 'Controle de Pragas e Sanitização', 'controle-pragas', '/icons/controle-pragas.svg', TRUE),
('ffffffff-6666-6666-6666-ffffffffffff', 'Organização e Decoração', 'organizacao-decoracao', '/icons/organizacao-decoracao.svg', TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `icon_url` = VALUES(`icon_url`), `is_active` = TRUE, `updated_at` = NOW(3);