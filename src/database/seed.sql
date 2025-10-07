-- =====================================================
-- SEED DATA: Datos de prueba para desarrollo
-- =====================================================
-- Descripción: Inserta datos de ejemplo en la tabla assets para testing
-- Autor: Sistema de Inventario Cielo
-- Fecha: 2025-10-06
-- Ejecutar: psql -U postgres -d inventario_db -f src/database/seed.sql
-- =====================================================

-- ⚠️  ADVERTENCIA: Este script limpia todos los datos existentes
-- Solo ejecutar en ambiente de desarrollo/testing

-- =====================================================
-- LIMPIAR DATOS EXISTENTES
-- =====================================================

-- Limpiar tabla assets y reiniciar secuencia de ID
TRUNCATE TABLE assets RESTART IDENTITY CASCADE;

SELECT '🗑️  Datos anteriores eliminados' AS status;

-- =====================================================
-- INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Función auxiliar para generar asset_id con formato AST-YYYY-NNNN
-- En producción, esto se manejará desde el backend

INSERT INTO assets (asset_id, description, responsible, location, qr_code_path) VALUES
    -- Equipos de Cómputo
    (
        'AST-2025-0001',
        'Laptop Dell Latitude 5420 - Intel Core i7 11va Gen, 16GB RAM, 512GB SSD, Windows 11 Pro. Estado: Excelente. Incluye cargador y maletín.',
        'Juan Pérez Martínez',
        'Oficina Principal - Piso 3 - Escritorio 301',
        '/qr_codes/AST-2025-0001.png'
    ),
    (
        'AST-2025-0002',
        'MacBook Pro 14" M2 Pro - 16GB RAM, 512GB SSD, macOS Ventura. Incluye cargador MagSafe. Año 2023. Estado: Como nuevo.',
        'Fernando Torres Silva',
        'Oficina Principal - Piso 2 - Área de Diseño',
        '/qr_codes/AST-2025-0002.png'
    ),
    (
        'AST-2025-0003',
        'Tablet Samsung Galaxy Tab S8 - 11 pulgadas, 128GB, WiFi + Cellular. Incluye S Pen y funda protectora. Para trabajo de campo.',
        'Laura Sánchez Gómez',
        'Sucursal Norte - Área de Ventas',
        '/qr_codes/AST-2025-0003.png'
    ),
    (
        'AST-2025-0004',
        'PC Desktop HP EliteDesk 800 G8 - Intel Core i5 11va Gen, 8GB RAM, 256GB SSD, Monitor 24" incluido. Para recepción.',
        'Ana López Hernández',
        'Oficina Principal - Recepción',
        '/qr_codes/AST-2025-0004.png'
    ),

    -- Electrónica y Periféricos
    (
        'AST-2025-0005',
        'Impresora HP LaserJet Pro M404dn - Impresora láser monocromo, doble cara automática, red Ethernet. Alta velocidad.',
        'Carlos Rodríguez Díaz',
        'Almacén Principal - Estante A3',
        '/qr_codes/AST-2025-0005.png'
    ),
    (
        'AST-2025-0006',
        'Monitor LG 27" UltraFine 4K - Resolución 3840x2160, IPS, USB-C, ideal para diseño gráfico. Modelo 27UK850.',
        'Ana López Hernández',
        'Oficina Principal - Piso 2 - Diseño Gráfico',
        '/qr_codes/AST-2025-0006.png'
    ),
    (
        'AST-2025-0007',
        'Proyector Epson PowerLite 2250U - Full HD 1080p, 5000 lúmenes, HDMI/VGA. Para sala de juntas. Incluye control remoto.',
        'Roberto González Vega',
        'Oficina Principal - Sala de Juntas B',
        '/qr_codes/AST-2025-0007.png'
    ),
    (
        'AST-2025-0008',
        'Scanner Canon imageFORMULA DR-C225 II - Escáner de documentos de alta velocidad, 25 ppm, alimentador automático 30 hojas.',
        'Isabel Morales Castro',
        'Oficina Principal - Departamento Administrativo',
        '/qr_codes/AST-2025-0008.png'
    ),

    -- Mobiliario
    (
        'AST-2025-0009',
        'Escritorio Ejecutivo L Forma - Madera color caoba, 160x140cm, incluye cajonera móvil con 3 gavetas y cerradura.',
        'María García Ruiz',
        'Oficina Principal - Piso 3 - Dirección General',
        '/qr_codes/AST-2025-0009.png'
    ),
    (
        'AST-2025-0010',
        'Silla Ergonómica Herman Miller Aeron - Talla B, soporte lumbar ajustable, reposabrazos 4D, garantía 12 años.',
        'Pedro Martínez López',
        'Oficina Principal - Piso 2 - Desarrollo',
        '/qr_codes/AST-2025-0010.png'
    ),
    (
        'AST-2025-0011',
        'Archivero Metálico 4 Gavetas - Color gris, rieles telescópicos, cerradura central. Dimensiones: 132x47x62cm.',
        'Patricia Ramírez Flores',
        'Almacén Principal - Zona de Archivos',
        '/qr_codes/AST-2025-0011.png'
    ),
    (
        'AST-2025-0012',
        'Mesa de Juntas Rectangular - 240x100cm, capacidad 8 personas, madera nogal con patas metálicas negras.',
        'Roberto González Vega',
        'Oficina Principal - Sala de Juntas A',
        '/qr_codes/AST-2025-0012.png'
    ),

    -- Vehículos y Transporte
    (
        'AST-2025-0013',
        'Camioneta Ford F-150 2022 - Blanca, Placas ABC-123-D, 4x4, Doble Cabina. Kilometraje: 15,000 km. Revisión al corriente.',
        'Miguel Ángel Soto Reyes',
        'Estacionamiento Principal - Cajón 05',
        '/qr_codes/AST-2025-0013.png'
    ),
    (
        'AST-2025-0014',
        'Motocicleta Honda CBR 250R - Roja, Placas XYZ-987-M. Para mensajería express. Kilometraje: 8,500 km.',
        'Ricardo Vargas Méndez',
        'Estacionamiento Sucursal Norte',
        '/qr_codes/AST-2025-0014.png'
    ),

    -- Herramientas
    (
        'AST-2025-0015',
        'Taladro Inalámbrico Dewalt 20V MAX - Incluye 2 baterías, cargador rápido y maletín. Modelo DCD771C2.',
        'José Luis Ramírez Torres',
        'Almacén Principal - Área de Herramientas',
        '/qr_codes/AST-2025-0015.png'
    ),
    (
        'AST-2025-0016',
        'Kit de Herramientas Mecánicas Stanley 170 piezas - Incluye llaves, dados, desarmadores, alicates. Caja metálica.',
        'José Luis Ramírez Torres',
        'Almacén Principal - Estante H2',
        '/qr_codes/AST-2025-0016.png'
    ),

    -- Equipamiento de Red
    (
        'AST-2025-0017',
        'Router Cisco RV340 - Dual WAN Gigabit, VPN, 4 puertos LAN. Para red corporativa. Configurado con VLAN.',
        'Andrés Medina Santos',
        'Oficina Principal - Sala de Servidores - Rack A',
        '/qr_codes/AST-2025-0017.png'
    ),
    (
        'AST-2025-0018',
        'Switch TP-Link TL-SG1024 - 24 puertos Gigabit Ethernet, montaje en rack. Sin gestión.',
        'Andrés Medina Santos',
        'Oficina Principal - Sala de Servidores - Rack A',
        '/qr_codes/AST-2025-0018.png'
    ),

    -- Otros Activos
    (
        'AST-2025-0019',
        'Aire Acondicionado Split Inverter 18,000 BTU - Marca LG, modo frío/calor, WiFi. Instalado en sala principal.',
        'Departamento de Mantenimiento',
        'Oficina Principal - Sala de Juntas Principal',
        '/qr_codes/AST-2025-0019.png'
    ),
    (
        'AST-2025-0020',
        'Cafetera Industrial Saeco - Automática, 2 grupos, capacidad 200 tazas/día. Modelo Aulika Top High Speed Cappuccino.',
        'Personal de Limpieza y Mantenimiento',
        'Oficina Principal - Área de Café - Piso 1',
        '/qr_codes/AST-2025-0020.png'
    );

-- =====================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================

-- Contar total de activos insertados
SELECT 
    '✅ Total de activos insertados: ' || COUNT(*) AS status
FROM assets;

-- Mostrar resumen por ubicación
SELECT 
    '📍 Activos por ubicación:' AS resumen;
    
SELECT 
    location,
    COUNT(*) AS cantidad_activos
FROM assets
GROUP BY location
ORDER BY cantidad_activos DESC;

-- Mostrar resumen por responsable
SELECT 
    '👤 Activos por responsable:' AS resumen;
    
SELECT 
    responsible,
    COUNT(*) AS cantidad_activos
FROM assets
GROUP BY responsible
ORDER BY cantidad_activos DESC;

-- Mostrar primeros 5 activos insertados
SELECT 
    '📋 Primeros 5 activos registrados:' AS resumen;
    
SELECT 
    asset_id,
    LEFT(description, 50) || '...' AS descripcion,
    responsible,
    location,
    created_at
FROM assets
ORDER BY id
LIMIT 5;

-- Confirmar seed exitoso
SELECT '🎉 Seed completado exitosamente - 20 activos de prueba insertados' AS status;
