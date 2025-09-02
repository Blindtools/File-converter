import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';
import tmp from 'tmp';
import archiver from 'archiver';
import Busboy from 'busboy';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
// Configure ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(helmet());
app.use(morgan('tiny'));
app.get('/health', (_, res) => res.json({ ok: true }));
// Storage: write uploads to a temp folder; auto-clean on exit
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB
// --- Helpers ---
const withTmpFile = async (buffer, basename) => {
  const p = tmp.fileSync({ postfix: path.extname(basename) || '' });
  await fs.writeFile(p.name, buffer);
  return { tmpPath: p.name, cleanup: () => p.removeCallback() };
};