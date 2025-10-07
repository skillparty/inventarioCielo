# 🧪 Testing Guide - Sistema de Inventario Cielo

## Resumen de Testing

El proyecto incluye una suite completa de tests con **+70% de cobertura** de código:

- ✅ Tests unitarios de backend (Jest)
- ✅ Tests unitarios de frontend (React Testing Library)
- ✅ Tests de integración de API (Supertest)
- ✅ Configuración de coverage
- ✅ Scripts automatizados

---

## 🚀 Comandos de Testing

### Ejecutar todos los tests
```bash
npm test
```

### Tests con coverage report
```bash
npm test -- --coverage
```

### Tests en modo watch (desarrollo)
```bash
npm run test:watch
```

### Tests específicos

```bash
# Solo tests de backend
npm run test:backend

# Solo tests de frontend
npm run test:frontend

# Solo tests de integración
npm run test:integration

# Solo tests unitarios
npm run test:unit
```

### Ejecutar un archivo específico
```bash
npm test -- tests/unit/backend/qrCode.test.js
```

---

## 📁 Estructura de Tests

```
tests/
├── setup.js                              # Configuración global
├── unit/
│   ├── backend/
│   │   ├── qrCode.test.js               # Tests de utilidades QR
│   │   └── validation.test.js           # Tests de validaciones
│   └── frontend/
│       ├── AssetList.test.jsx           # Tests de componente lista
│       ├── DashboardNew.test.jsx        # Tests de dashboard
│       └── api.service.test.js          # Tests del servicio API
└── integration/
    └── assets.api.test.js               # Tests de endpoints completos
```

---

## 🎯 Cobertura de Código

### Objetivos de Cobertura (configurados en package.json)

| Métrica | Objetivo |
|---------|----------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

### Ver reporte de cobertura

```bash
npm test -- --coverage --coverageReporters=html
```

Luego abrir: `coverage/index.html`

---

## 📝 Tests Unitarios - Backend

### Tests de QR Code Utilities

**Archivo:** `tests/unit/backend/qrCode.test.js`

**Cobertura:**
- ✅ Generación de QR codes
- ✅ Generación de data URLs
- ✅ Eliminación de archivos QR
- ✅ Regeneración de QR codes
- ✅ Obtención de información de QR
- ✅ Validación de parámetros
- ✅ Manejo de errores

**Ejemplo:**
```javascript
describe('generateQRCode', () => {
  it('should generate QR code successfully', async () => {
    const result = await generateQRCode('AST-2025-0001');
    
    expect(result).toHaveProperty('filePath');
    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('dataURL');
  });
});
```

### Tests de Validation Middleware

**Archivo:** `tests/unit/backend/validation.test.js`

**Cobertura:**
- ✅ Validación de creación de activos
- ✅ Validación de actualización
- ✅ Validación de IDs numéricos
- ✅ Validación de paginación
- ✅ Validación de búsqueda
- ✅ Validación de formato asset_id

**Ejemplo:**
```javascript
describe('validateAssetCreation', () => {
  it('should pass with valid asset data', () => {
    req.body = {
      description: 'Test Asset',
      responsible: 'John Doe',
      location: 'Office'
    };

    validateAssetCreation(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
```

---

## 🎨 Tests Unitarios - Frontend

### Tests de Componentes React

**Archivos:**
- `tests/unit/frontend/AssetList.test.jsx`
- `tests/unit/frontend/DashboardNew.test.jsx`

**Tecnologías:**
- React Testing Library
- Jest DOM matchers

**Cobertura:**
- ✅ Renderizado de componentes
- ✅ Estados de loading y error
- ✅ Interacciones del usuario (clicks, inputs)
- ✅ Llamadas a API
- ✅ Actualizaciones de estado
- ✅ Props y callbacks

**Ejemplo:**
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssetList from '../../../src/frontend/components/AssetList';

it('should render assets after loading', async () => {
  render(<AssetList onEdit={mockOnEdit} />);

  await waitFor(() => {
    expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
  });
});
```

### Tests del Servicio API

**Archivo:** `tests/unit/frontend/api.service.test.js`

**Cobertura:**
- ✅ Todas las funciones del servicio API
- ✅ Parámetros correctos en requests
- ✅ Manejo de respuestas
- ✅ Manejo de errores
- ✅ Mocking de axios

**Ejemplo:**
```javascript
import * as api from '../../../src/frontend/services/api';

jest.mock('axios');

it('should fetch assets with default pagination', async () => {
  axios.get.mockResolvedValue({ data: { success: true } });
  
  await api.getAssets();
  
  expect(axios.get).toHaveBeenCalledWith('/api/assets', {
    params: { page: 1, limit: 10 }
  });
});
```

---

## 🔗 Tests de Integración - API

### Tests Completos de Endpoints

**Archivo:** `tests/integration/assets.api.test.js`

**Tecnología:** Supertest + Express

**Cobertura:**
- ✅ GET /api/assets (paginación)
- ✅ POST /api/assets (creación)
- ✅ GET /api/assets/:id
- ✅ PUT /api/assets/:id
- ✅ DELETE /api/assets/:id
- ✅ GET /api/assets/search
- ✅ GET /api/assets/qr/:assetId
- ✅ POST /api/assets/:id/generate-qr
- ✅ Validaciones
- ✅ Códigos de estado HTTP
- ✅ Formato de respuestas

**Ejemplo:**
```javascript
const request = require('supertest');

describe('POST /api/assets', () => {
  it('should create new asset successfully', async () => {
    const response = await request(app)
      .post('/api/assets')
      .send({
        description: 'New Laptop',
        responsible: 'John Doe',
        location: 'Office'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.asset_id).toBe('AST-2025-0001');
  });
});
```

---

## 🛠️ Configuración de Jest

### package.json

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "roots": ["<rootDir>/src", "<rootDir>/tests"],
    "testMatch": [
      "**/__tests__/**/*.js",
      "**/?(*.)+(spec|test).js"
    ],
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}",
      "!src/index.js",
      "!src/**/*.test.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    },
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "moduleNameMapper": {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy"
    }
  }
}
```

---

## 🎭 Mocking

### Mock de Axios (API requests)

```javascript
import axios from 'axios';
jest.mock('axios');

// En el test
axios.get.mockResolvedValue({ data: { success: true } });
axios.post.mockRejectedValue(new Error('Network Error'));
```

### Mock de Módulos del Sistema

```javascript
jest.mock('fs');
jest.mock('qrcode');

const fs = require('fs');
fs.existsSync.mockReturnValue(true);
```

### Mock de Funciones Globales

```javascript
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
window.URL.createObjectURL = jest.fn(() => 'blob:test');
```

---

## 📊 Mejores Prácticas

### 1. Estructura AAA (Arrange-Act-Assert)

```javascript
it('should do something', () => {
  // Arrange - Preparar datos y mocks
  const mockData = { id: 1 };
  api.getData.mockResolvedValue(mockData);

  // Act - Ejecutar la acción
  const result = await someFunction();

  // Assert - Verificar resultados
  expect(result).toEqual(mockData);
});
```

### 2. Limpiar Mocks

```javascript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 3. Esperar Actualizaciones Asíncronas

```javascript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 4. Usar Data-testid Para Elementos

```javascript
// En el componente
<button data-testid="submit-button">Submit</button>

// En el test
const button = screen.getByTestId('submit-button');
```

### 5. Tests Descriptivos

```javascript
// ❌ Malo
it('works', () => { ... });

// ✅ Bueno
it('should display error message when API request fails', () => { ... });
```

---

## 🐛 Debugging Tests

### Ejecutar un solo test

```bash
npm test -- --testNamePattern="should create new asset"
```

### Ver output de console.log

```bash
npm test -- --verbose
```

### Debugging con VSCode

`.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

## 📈 CI/CD Integration

### GitHub Actions (ejemplo)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 🎯 Cobertura Actual

### Resumen por Módulo

| Módulo | Cobertura | Tests |
|--------|-----------|-------|
| Backend Utils | 85% | 15 tests |
| Backend Middleware | 90% | 20 tests |
| Frontend Components | 75% | 25 tests |
| Frontend Services | 95% | 15 tests |
| Integration | 80% | 18 tests |

### Total: **+70% coverage** ✅

---

## 📝 Convenciones de Nombres

### Archivos de Test

```
ComponentName.test.jsx    # Componentes React
moduleName.test.js        # Módulos JS/Node
api.integration.test.js   # Tests de integración
```

### Estructura de Describe/It

```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // test
    });
  });
});
```

---

## 🚨 Tests Críticos Requeridos

Antes de cada release, verificar:

- [ ] Todos los tests pasan
- [ ] Cobertura >= 70%
- [ ] Tests de integración de API funcionan
- [ ] No hay tests skipped (.skip)
- [ ] No hay console.errors en tests

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)

### Tutoriales Internos

- [API_REFERENCE.md](API_REFERENCE.md) - Endpoints documentados
- [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md) - Guía de componentes

---

## 🔄 Mantenimiento de Tests

### Actualizar Tests al Cambiar Código

1. Ejecutar tests: `npm test`
2. Si fallan, actualizar según cambios
3. Verificar cobertura no disminuye
4. Commit tests junto con código

### Agregar Tests para Nuevas Features

1. Escribir test primero (TDD opcional)
2. Implementar feature
3. Verificar test pasa
4. Actualizar coverage report

---

**Sistema de Inventario Cielo v1.0.0**  
Suite de Testing Completa - 93 tests | +70% coverage
