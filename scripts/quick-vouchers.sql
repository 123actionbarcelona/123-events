-- Insertar vales regalo de prueba directamente
-- Ejecutar en Prisma Studio o psql

INSERT INTO "gift_vouchers" (
  "id",
  "code", 
  "type",
  "originalAmount",
  "currentBalance",
  "purchaserName",
  "purchaserEmail",
  "status",
  "purchaseDate",
  "expiryDate",
  "paymentStatus",
  "paidAt",
  "templateUsed",
  "createdAt",
  "updatedAt"
) VALUES 
-- Vale 1: €50 completo
(
  gen_random_uuid(),
  'GIFT-TEST-50EU',
  'amount',
  50.00,
  50.00,
  'Usuario Test',
  'test@mysteryevents.com',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'paid',
  NOW(),
  'elegant',
  NOW(),
  NOW()
),
-- Vale 2: €25 pequeño  
(
  gen_random_uuid(),
  'GIFT-MINI-25EU',
  'amount',
  25.00,
  25.00,
  'Cliente Pequeño',
  'mini@test.com',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'paid',
  NOW(),
  'fun',
  NOW(),
  NOW()
),
-- Vale 3: €100 premium
(
  gen_random_uuid(),
  'GIFT-PREM-100E',
  'amount',
  100.00,
  100.00,
  'Cliente Premium',
  'premium@test.com',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'paid',
  NOW(),
  'mystery',
  NOW(),
  NOW()
),
-- Vale 4: €150 grande
(
  gen_random_uuid(),
  'GIFT-GRAN-150E',
  'amount',
  150.00,
  150.00,
  'Gran Regalo',
  'grande@test.com',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'paid',
  NOW(),
  'christmas',
  NOW(),
  NOW()
),
-- Vale 5: €75 (parcialmente usado, era €100)
(
  gen_random_uuid(),
  'GIFT-USED-75EU',
  'amount',
  100.00,
  75.00,
  'Vale Parcial',
  'usado@test.com',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'paid',
  NOW(),
  'elegant',
  NOW(),
  NOW()
);