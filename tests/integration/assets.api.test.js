/**
 * Integration tests for Assets API endpoints
 * Tests the complete flow from HTTP request to database
 */

const request = require('supertest');
const express = require('express');
const assetsRoutes = require('../../src/backend/routes/assets');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/assets', assetsRoutes);

// Mock database
jest.mock('../../src/backend/database/db');
const db = require('../../src/backend/database/db');

// Mock QR code utilities
jest.mock('../../src/backend/utils/qrCode');
const qrCode = require('../../src/backend/utils/qrCode');

describe('Assets API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default QR code mock
    qrCode.generateQRCode.mockResolvedValue({
      filePath: '/path/to/qr.png',
      fileName: 'AST-2025-0001.png',
      dataURL: 'data:image/png;base64,test'
    });

    qrCode.deleteQRCode.mockResolvedValue();
    qrCode.regenerateQRCode.mockResolvedValue({
      filePath: '/path/to/qr.png',
      fileName: 'AST-2025-0001.png',
      dataURL: 'data:image/png;base64,test'
    });
  });

  describe('GET /api/assets', () => {
    it('should return paginated assets', async () => {
      const mockAssets = [
        {
          id: 1,
          asset_id: 'AST-2025-0001',
          description: 'Laptop Dell',
          responsible: 'John Doe',
          location: 'Office',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      db.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // COUNT query
        .mockResolvedValueOnce({ rows: mockAssets }); // SELECT query

      const response = await request(app)
        .get('/api/assets')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].asset_id).toBe('AST-2025-0001');
    });

    it('should handle pagination parameters', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/assets?page=2&limit=20')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(20);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [20, 20] // limit, offset
      );
    });

    it('should use default pagination if not provided', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/assets')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/assets', () => {
    it('should create new asset successfully', async () => {
      const newAsset = {
        description: 'New Laptop',
        responsible: 'John Doe',
        location: 'Office'
      };

      db.query
        .mockResolvedValueOnce({ rows: [{ asset_id: 'AST-2025-0001' }] }) // generate_next_asset_id
        .mockResolvedValueOnce({ // INSERT
          rows: [{
            id: 1,
            asset_id: 'AST-2025-0001',
            ...newAsset,
            qr_code_path: '/path/to/qr.png',
            created_at: new Date(),
            updated_at: new Date()
          }]
        });

      const response = await request(app)
        .post('/api/assets')
        .send(newAsset)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.data.asset_id).toBe('AST-2025-0001');
      expect(response.body.qr).toHaveProperty('dataURL');
      expect(qrCode.generateQRCode).toHaveBeenCalledWith('AST-2025-0001');
    });

    it('should fail without required description', async () => {
      const response = await request(app)
        .post('/api/assets')
        .send({
          responsible: 'John Doe',
          location: 'Office'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('description');
    });

    it('should accept asset with only description', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ asset_id: 'AST-2025-0001' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            asset_id: 'AST-2025-0001',
            description: 'Only Description',
            responsible: null,
            location: null,
            qr_code_path: '/path/to/qr.png'
          }]
        });

      const response = await request(app)
        .post('/api/assets')
        .send({ description: 'Only Description' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/assets/:id', () => {
    it('should return asset by ID', async () => {
      const mockAsset = {
        id: 1,
        asset_id: 'AST-2025-0001',
        description: 'Test Asset',
        responsible: 'John Doe',
        location: 'Office'
      };

      db.query.mockResolvedValueOnce({ rows: [mockAsset] });

      const response = await request(app)
        .get('/api/assets/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.asset_id).toBe('AST-2025-0001');
    });

    it('should return 404 for non-existent asset', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/assets/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('encontr');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/assets/abc')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/assets/:id', () => {
    it('should update asset successfully', async () => {
      const updates = {
        description: 'Updated Description',
        location: 'New Location'
      };

      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          asset_id: 'AST-2025-0001',
          ...updates,
          responsible: 'John Doe'
        }]
      });

      const response = await request(app)
        .put('/api/assets/1')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('actualizado');
      expect(response.body.data.description).toBe(updates.description);
    });

    it('should fail without any fields to update', async () => {
      const response = await request(app)
        .put('/api/assets/1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent asset', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/assets/999')
        .send({ description: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('should delete asset successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          asset_id: 'AST-2025-0001',
          description: 'Deleted Asset'
        }]
      });

      const response = await request(app)
        .delete('/api/assets/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');
      expect(qrCode.deleteQRCode).toHaveBeenCalledWith('AST-2025-0001');
    });

    it('should return 404 for non-existent asset', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/assets/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/assets/search', () => {
    it('should search assets by term', async () => {
      const mockResults = [
        {
          id: 1,
          asset_id: 'AST-2025-0001',
          description: 'Laptop Dell',
          responsible: 'John Doe',
          location: 'Office'
        }
      ];

      db.query.mockResolvedValueOnce({ rows: mockResults });

      const response = await request(app)
        .get('/api/assets/search?q=laptop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.searchTerm).toBe('laptop');
    });

    it('should fail without search term', async () => {
      const response = await request(app)
        .get('/api/assets/search')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/assets/qr/:assetId', () => {
    it('should find asset by asset_id', async () => {
      const mockAsset = {
        id: 1,
        asset_id: 'AST-2025-0001',
        description: 'Test Asset'
      };

      db.query.mockResolvedValueOnce({ rows: [mockAsset] });

      const response = await request(app)
        .get('/api/assets/qr/AST-2025-0001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.asset_id).toBe('AST-2025-0001');
    });

    it('should return 404 for non-existent asset_id', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/assets/qr/AST-2025-9999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate asset_id format', async () => {
      const response = await request(app)
        .get('/api/assets/qr/INVALID-FORMAT')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/assets/:id/generate-qr', () => {
    it('should generate QR code for existing asset', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{
            asset_id: 'AST-2025-0001',
            qr_code_path: '/old/path.png'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE query

      const response = await request(app)
        .post('/api/assets/1/generate-qr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('QR');
      expect(response.body.qr).toHaveProperty('dataURL');
      expect(qrCode.regenerateQRCode).toHaveBeenCalledWith('AST-2025-0001');
    });

    it('should return 404 for non-existent asset', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/assets/999/generate-qr')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
