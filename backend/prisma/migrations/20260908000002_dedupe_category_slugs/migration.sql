CREATE TEMPORARY TABLE `category_canonical` AS
SELECT `slug`, MIN(`id`) AS `id`
FROM `categories`
GROUP BY `slug`;

INSERT IGNORE INTO `provider_categories` (`provider_profile_id`, `category_id`)
SELECT pc.`provider_profile_id`, canonical.`id`
FROM `provider_categories` pc
JOIN `categories` duplicate ON duplicate.`id` = pc.`category_id`
JOIN `category_canonical` canonical ON canonical.`slug` = duplicate.`slug`
WHERE duplicate.`id` <> canonical.`id`;

UPDATE `service_requests` sr
JOIN `categories` duplicate ON duplicate.`id` = sr.`category_id`
JOIN `category_canonical` canonical ON canonical.`slug` = duplicate.`slug`
SET sr.`category_id` = canonical.`id`
WHERE duplicate.`id` <> canonical.`id`;

DELETE pc
FROM `provider_categories` pc
JOIN `categories` duplicate ON duplicate.`id` = pc.`category_id`
JOIN `category_canonical` canonical ON canonical.`slug` = duplicate.`slug`
WHERE duplicate.`id` <> canonical.`id`;

UPDATE `categories`
SET `is_active` = FALSE
WHERE `slug` IN ('eletricista', 'encanador', 'montador-de-moveis', 'chaveiro');

UPDATE `categories`
SET `slug` = CONCAT('legacy-', `id`), `is_active` = FALSE
WHERE `slug` IN ('eletricista', 'encanador', 'montador-de-moveis', 'chaveiro');

UPDATE `categories` duplicate
JOIN `category_canonical` canonical ON canonical.`slug` = duplicate.`slug`
SET duplicate.`slug` = CONCAT('duplicate-', duplicate.`id`), duplicate.`is_active` = FALSE
WHERE duplicate.`id` <> canonical.`id`;

UPDATE `categories`
SET `is_active` = TRUE
WHERE `slug` IN (
  'eletrica', 'hidraulica', 'reforma-acabamento', 'montagem-instalacao',
  'estrutura-reparos', 'area-externa', 'servicos-faz-tudo',
  'climatizacao-refrigeracao', 'seguranca-cftv', 'limpeza-higienizacao',
  'vidracaria-esquadrias', 'marcenaria-carpintaria',
  'eletrodomesticos-linha-branca', 'gas-aquecimento', 'tecnologia-smart-home',
  'pisos-revestimentos', 'fretes-mudancas', 'redes-protecao',
  'piscinas-lazer', 'serralharia-estruturas', 'controle-pragas',
  'organizacao-decoracao'
);

CREATE UNIQUE INDEX `categories_slug_key` ON `categories`(`slug`);
DROP TEMPORARY TABLE `category_canonical`;