/**
 * Unit tests for validation middleware
 */

const {
  validateAssetCreation,
  validateAssetUpdate,
  validateNumericId,
  validatePagination,
  validateSearch,
  validateAssetId
} = require('../../../src/backend/middleware/validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateAssetCreation', () => {
    it('should pass with valid asset data', () => {
      req.body = {
        description: 'Test Asset',
        responsible: 'John Doe',
        location: 'Office'
      };

      validateAssetCreation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail without description', () => {
      req.body = {
        responsible: 'John Doe',
        location: 'Office'
      };

      validateAssetCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('description')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should trim and validate description length', () => {
      req.body = {
        description: '   ',
        responsible: 'John Doe',
        location: 'Office'
      };

      validateAssetCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept empty responsible and location', () => {
      req.body = {
        description: 'Test Asset'
      };

      validateAssetCreation(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateAssetUpdate', () => {
    it('should pass with at least one field to update', () => {
      req.body = {
        description: 'Updated description'
      };

      validateAssetUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail without any fields to update', () => {
      req.body = {};

      validateAssetUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Al menos un campo')
        })
      );
    });

    it('should fail with all empty fields', () => {
      req.body = {
        description: '',
        responsible: '',
        location: ''
      };

      validateAssetUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateNumericId', () => {
    it('should pass with valid numeric ID', () => {
      req.params.id = '123';

      validateNumericId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.params.id).toBe(123);
    });

    it('should fail with non-numeric ID', () => {
      req.params.id = 'abc';

      validateNumericId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('ID numérico válido')
        })
      );
    });

    it('should fail with negative ID', () => {
      req.params.id = '-5';

      validateNumericId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail with zero ID', () => {
      req.params.id = '0';

      validateNumericId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validatePagination', () => {
    it('should use default values if not provided', () => {
      req.query = {};

      validatePagination(req, res, next);

      expect(req.pagination).toEqual({ page: 1, limit: 10 });
      expect(next).toHaveBeenCalled();
    });

    it('should accept valid pagination parameters', () => {
      req.query = { page: '2', limit: '20' };

      validatePagination(req, res, next);

      expect(req.pagination).toEqual({ page: 2, limit: 20 });
      expect(next).toHaveBeenCalled();
    });

    it('should enforce maximum limit', () => {
      req.query = { page: '1', limit: '200' };

      validatePagination(req, res, next);

      expect(req.pagination.limit).toBe(100);
    });

    it('should enforce minimum values', () => {
      req.query = { page: '0', limit: '0' };

      validatePagination(req, res, next);

      expect(req.pagination.page).toBe(1);
      expect(req.pagination.limit).toBe(1);
    });
  });

  describe('validateSearch', () => {
    it('should pass with valid search query', () => {
      req.query = { q: 'laptop' };

      validateSearch(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail without search query', () => {
      req.query = {};

      validateSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('búsqueda')
        })
      );
    });

    it('should fail with empty search query', () => {
      req.query = { q: '   ' };

      validateSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateAssetId', () => {
    it('should pass with valid asset_id format', () => {
      req.params.assetId = 'AST-2025-0001';

      validateAssetId(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail with invalid format', () => {
      req.params.assetId = 'INVALID-ID';

      validateAssetId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('formato')
        })
      );
    });

    it('should fail with missing asset_id', () => {
      req.params = {};

      validateAssetId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
