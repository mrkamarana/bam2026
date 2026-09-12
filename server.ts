import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CLIENTS_SUPPLIERS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSES,
  INITIAL_INCENTIVES,
  INITIAL_INVOICES,
  INITIAL_MATERIALS,
  INITIAL_PURCHASES,
  INITIAL_SALARIES,
  INITIAL_SALES,
  INITIAL_TAX_INVOICES,
  INITIAL_TAX_PROFILE,
  INITIAL_WITHHOLDING_SLIPS,
} from './src/data/initialData';

const PORT = 3000;
const HOST = '0.0.0.0';

// Database storage file path inside workspace
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Helper to get fresh default seed dataset
function getDefaultSeedData() {
  return {
    companyProfile: INITIAL_COMPANY_PROFILE,
    taxProfile: INITIAL_TAX_PROFILE,
    clients: INITIAL_CLIENTS_SUPPLIERS,
    materials: INITIAL_MATERIALS,
    sales: INITIAL_SALES,
    purchases: INITIAL_PURCHASES,
    expenses: INITIAL_EXPENSES,
    taxInvoices: INITIAL_TAX_INVOICES,
    withholdingSlips: INITIAL_WITHHOLDING_SLIPS,
    invoices: INITIAL_INVOICES,
    employees: INITIAL_EMPLOYEES,
    incentives: INITIAL_INCENTIVES,
    salaries: INITIAL_SALARIES,
    customJournals: [],
    deletedJournalIds: [],
    updatedAt: new Date().toISOString(),
  };
}

// Ensure database directory and file exist
function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialDb = getDefaultSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      console.log('Database initialized successfully with default seed data.');
    }
  } catch (err) {
    console.error('Failed to initialize database file:', err);
  }
}

// Read database safely
function readDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
  }
  return getDefaultSeedData();
}

// Write database safely with atomic swap
function writeDatabase(data: any): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing to database:', err);
    return false;
  }
}

async function startServer() {
  initDatabase();

  const app = express();

  // Support large JSON payloads (e.g. logos, Excel transaction imports)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS / security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PT Berkah Alam Mulia ERP Backend',
      timestamp: new Date().toISOString(),
      databaseReady: fs.existsSync(DB_FILE),
    });
  });

  // Get full database
  app.get('/api/data', (req, res) => {
    try {
      const dbData = readDatabase();
      res.json({
        success: true,
        data: dbData,
        lastSaved: dbData.updatedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Gagal membaca database',
      });
    }
  });

  // Save / update database (supports full data or partial collection updates)
  app.post('/api/data', (req, res) => {
    try {
      const currentDb = readDatabase();
      const incomingData = req.body?.data || req.body;

      if (!incomingData || typeof incomingData !== 'object') {
        res.status(400).json({ success: false, error: 'Data tidak valid' });
        return;
      }

      // Merge current data with incoming updates
      const updatedDb = {
        ...currentDb,
        ...incomingData,
        updatedAt: new Date().toISOString(),
      };

      const writeSuccess = writeDatabase(updatedDb);

      if (!writeSuccess) {
        res.status(500).json({ success: false, error: 'Gagal menulis data ke database' });
        return;
      }

      res.json({
        success: true,
        message: 'Data berhasil disimpan di database server',
        lastSaved: updatedDb.updatedAt,
      });
    } catch (err: any) {
      console.error('Error saving data:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Terjadi kesalahan saat menyimpan data',
      });
    }
  });

  // Beacon / unload save endpoint
  app.post('/api/data/beacon', (req, res) => {
    try {
      const currentDb = readDatabase();
      let incomingData = req.body?.data || req.body;

      if (typeof incomingData === 'string') {
        try {
          incomingData = JSON.parse(incomingData);
        } catch {
          // ignore
        }
      }

      if (incomingData && typeof incomingData === 'object') {
        const updatedDb = {
          ...currentDb,
          ...incomingData,
          updatedAt: new Date().toISOString(),
        };
        writeDatabase(updatedDb);
      }
      res.status(204).end();
    } catch (err) {
      console.error('Beacon save error:', err);
      res.status(500).end();
    }
  });

  // Reset database to initial demo data
  app.post('/api/data/reset', (req, res) => {
    try {
      const freshSeed = getDefaultSeedData();
      const writeSuccess = writeDatabase(freshSeed);
      if (!writeSuccess) {
        res.status(500).json({ success: false, error: 'Gagal mereset database' });
        return;
      }
      res.json({
        success: true,
        message: 'Database berhasil direset ke data demo awal',
        data: freshSeed,
        lastSaved: freshSeed.updatedAt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Gagal reset database' });
    }
  });

  // Wipe transactional data
  app.post('/api/data/wipe', (req, res) => {
    try {
      const currentDb = readDatabase();
      const wipedDb = {
        ...currentDb,
        sales: [],
        purchases: [],
        expenses: [],
        taxInvoices: [],
        withholdingSlips: [],
        invoices: [],
        salaries: [],
        customJournals: [],
        deletedJournalIds: [],
        updatedAt: new Date().toISOString(),
      };
      writeDatabase(wipedDb);
      res.json({
        success: true,
        message: 'Data transaksi berhasil dikosongkan',
        data: wipedDb,
        lastSaved: wipedDb.updatedAt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Gagal menghapus data transaksi' });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server PT Berkah Alam Mulia running on http://${HOST}:${PORT}`);
  });
}

startServer();
