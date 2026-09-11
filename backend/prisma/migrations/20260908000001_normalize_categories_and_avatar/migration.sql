ALTER TABLE `users` MODIFY COLUMN `avatar_url` TEXT NULL;

INSERT INTO `categories` (`id`, `name`, `slug`, `icon_url`, `is_active`) VALUES
('10101010-1010-1010-1010-101010101010', 'Elétrica', 'eletrica', '/icons/eletrica.svg', TRUE),
('20202020-2020-2020-2020-202020202020', 'Hidráulica', 'hidraulica', '/icons/hidraulica.svg', TRUE),
('30303030-3030-3030-3030-303030303030', 'Reforma e Acabamento', 'reforma-acabamento', '/icons/reforma-acabamento.svg', TRUE),
('40404040-4040-4040-4040-404040404040', 'Montagem e Instalação', 'montagem-instalacao', '/icons/montagem-instalacao.svg', TRUE),
('50505050-5050-5050-5050-505050505050', 'Estrutura e Reparos Gerais', 'estrutura-reparos', '/icons/estrutura-reparos.svg', TRUE),
('60606060-6060-6060-6060-606060606060', 'Área Externa', 'area-externa', '/icons/area-externa.svg', TRUE),
('70707070-7070-7070-7070-707070707070', 'Serviços Faz-Tudo', 'servicos-faz-tudo', '/icons/servicos-faz-tudo.svg', TRUE),
('80808080-8080-8080-8080-808080808080', 'Climatização e Refrigeração', 'climatizacao-refrigeracao', '/icons/climatizacao-refrigeracao.svg', TRUE),
('90909090-9090-9090-9090-909090909090', 'Segurança Residencial e CFTV', 'seguranca-cftv', '/icons/seguranca-cftv.svg', TRUE),
('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'Limpeza e Higienização', 'limpeza-higienizacao', '/icons/limpeza-higienizacao.svg', TRUE),
('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'Vidraçaria e Esquadrias', 'vidracaria-esquadrias', '/icons/vidracaria-esquadrias.svg', TRUE),
('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'Marcenaria e Carpintaria', 'marcenaria-carpintaria', '/icons/marcenaria-carpintaria.svg', TRUE),
('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Eletrodomésticos e Linha Branca', 'eletrodomesticos-linha-branca', '/icons/eletrodomesticos-linha-branca.svg', TRUE),
('e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0', 'Gás e Aquecimento', 'gas-aquecimento', '/icons/gas-aquecimento.svg', TRUE),
('f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0', 'Tecnologia, Redes e Smart Home', 'tecnologia-smart-home', '/icons/tecnologia-smart-home.svg', TRUE),
('12121212-1212-1212-1212-121212121212', 'Pisos e Revestimentos', 'pisos-revestimentos', '/icons/pisos-revestimentos.svg', TRUE),
('13131313-1313-1313-1313-131313131313', 'Fretes e Mudanças Leves', 'fretes-mudancas', '/icons/fretes-mudancas.svg', TRUE),
('14141414-1414-1414-1414-141414141414', 'Redes de Proteção e Segurança Infantil', 'redes-protecao', '/icons/redes-protecao.svg', TRUE),
('15151515-1515-1515-1515-151515151515', 'Piscinas e Área de Lazer', 'piscinas-lazer', '/icons/piscinas-lazer.svg', TRUE),
('16161616-1616-1616-1616-161616161616', 'Serralharia e Estruturas Metálicas', 'serralharia-estruturas', '/icons/serralharia-estruturas.svg', TRUE),
('17171717-1717-1717-1717-171717171717', 'Controle de Pragas e Sanitização', 'controle-pragas', '/icons/controle-pragas.svg', TRUE),
('18181818-1818-1818-1818-181818181818', 'Organização e Decoração', 'organizacao-decoracao', '/icons/organizacao-decoracao.svg', TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `icon_url` = VALUES(`icon_url`), `is_active` = TRUE, `updated_at` = NOW(3);

INSERT IGNORE INTO `provider_categories` (`provider_profile_id`, `category_id`)
SELECT pc.`provider_profile_id`, canonical.`id`
FROM `provider_categories` pc
JOIN `categories` legacy ON legacy.id = pc.category_id
JOIN `categories` canonical ON canonical.slug = CASE legacy.slug
  WHEN 'eletricista' THEN 'eletrica'
  WHEN 'encanador' THEN 'hidraulica'
  WHEN 'montador-de-moveis' THEN 'montagem-instalacao'
  WHEN 'chaveiro' THEN 'estrutura-reparos'
END;

DELETE pc
FROM `provider_categories` pc
JOIN `categories` legacy ON legacy.id = pc.category_id
WHERE legacy.slug IN ('eletricista', 'encanador', 'montador-de-moveis', 'chaveiro');

UPDATE `service_requests` sr
JOIN `categories` legacy ON legacy.id = sr.category_id
JOIN `categories` canonical ON canonical.slug = CASE legacy.slug
  WHEN 'eletricista' THEN 'eletrica'
  WHEN 'encanador' THEN 'hidraulica'
  WHEN 'montador-de-moveis' THEN 'montagem-instalacao'
  WHEN 'chaveiro' THEN 'estrutura-reparos'
END
SET sr.category_id = canonical.id;

UPDATE `categories`
SET `is_active` = FALSE
WHERE `slug` IN ('eletricista', 'encanador', 'montador-de-moveis', 'chaveiro');