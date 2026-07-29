import mongoose from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

export const BackupService = {
  createBackup: async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const backup = {};

    for (const col of collections) {
      backup[col.name] = await db.collection(col.name).find({}).toArray();
    }

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    const stats = fs.statSync(filepath);
    return { filename, filepath, size: stats.size, createdAt: new Date(), collections: Object.keys(backup).length };
  },

  getBackups: async () => {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return { filename: f, size: stats.size, createdAt: stats.birthtime };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  restoreBackup: async (filename) => {
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) throw new Error('Backup file not found');

    const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const db = mongoose.connection.db;

    for (const [collection, documents] of Object.entries(backup)) {
      if (documents.length > 0) {
        await db.collection(collection).deleteMany({});
        await db.collection(collection).insertMany(documents);
      }
    }

    return { collections: Object.keys(backup).length, restored: true };
  },

  deleteBackup: async (filename) => {
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) throw new Error('Backup file not found');
    fs.unlinkSync(filepath);
    return true;
  },
};
