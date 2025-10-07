/**
 * Unit tests for QR Code utilities
 */

const {
  generateQRCode,
  generateQRDataURL,
  deleteQRCode,
  regenerateQRCode,
  getQRInfo
} = require('../../../src/backend/utils/qrCode');
const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs');
jest.mock('qrcode');

describe('QR Code Utilities', () => {
  const testAssetId = 'AST-2025-0001';
  const qrDir = path.join(process.cwd(), 'public', 'qr_codes');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      // Mock fs.existsSync and fs.mkdirSync
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});

      // Mock QRCode.toFile
      const QRCode = require('qrcode');
      QRCode.toFile = jest.fn().mockResolvedValue();
      QRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,test');

      const result = await generateQRCode(testAssetId);

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('dataURL');
      expect(result.fileName).toBe(`${testAssetId}.png`);
      expect(fs.mkdirSync).toHaveBeenCalledWith(qrDir, { recursive: true });
    });

    it('should throw error if asset_id is missing', async () => {
      await expect(generateQRCode('')).rejects.toThrow('asset_id es requerido');
      await expect(generateQRCode(null)).rejects.toThrow('asset_id es requerido');
    });

    it('should create QR directory if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});

      const QRCode = require('qrcode');
      QRCode.toFile = jest.fn().mockResolvedValue();
      QRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,test');

      await generateQRCode(testAssetId);

      expect(fs.mkdirSync).toHaveBeenCalledWith(qrDir, { recursive: true });
    });
  });

  describe('generateQRDataURL', () => {
    it('should generate QR code as data URL', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,mockdata');

      const result = await generateQRDataURL(testAssetId);

      expect(result).toBe('data:image/png;base64,mockdata');
      expect(QRCode.toDataURL).toHaveBeenCalledWith(testAssetId, expect.any(Object));
    });

    it('should throw error for invalid asset_id', async () => {
      await expect(generateQRDataURL('')).rejects.toThrow();
    });
  });

  describe('deleteQRCode', () => {
    it('should delete QR code file if it exists', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});

      await deleteQRCode(testAssetId);

      const expectedPath = path.join(qrDir, `${testAssetId}.png`);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedPath);
    });

    it('should not throw error if file does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(deleteQRCode(testAssetId)).resolves.not.toThrow();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('regenerateQRCode', () => {
    it('should delete old QR and generate new one', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});
      fs.mkdirSync.mockImplementation(() => {});

      const QRCode = require('qrcode');
      QRCode.toFile = jest.fn().mockResolvedValue();
      QRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,test');

      const result = await regenerateQRCode(testAssetId);

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('dataURL');
    });
  });

  describe('getQRInfo', () => {
    it('should return QR info if file exists', () => {
      fs.existsSync.mockReturnValue(true);

      const result = getQRInfo(testAssetId);

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('exists');
      expect(result.exists).toBe(true);
      expect(result.fileName).toBe(`${testAssetId}.png`);
    });

    it('should return exists:false if file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const result = getQRInfo(testAssetId);

      expect(result.exists).toBe(false);
    });
  });
});
