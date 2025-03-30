// server.js
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5001;

// Enable CORS
app.use(cors());

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'waveweaver',
  password: 'Omni5lash!', // Default password for postgres user
  port: 5432,
});

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Serve static files from the separated directory
app.use('/separated', express.static('separated'));

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS audio_separations (
        id UUID PRIMARY KEY,
        original_filename TEXT NOT NULL,
        vocals_path TEXT,
        instrumental_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}

// Endpoint for file upload and processing
app.post('/api/separate', upload.single('audioFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, 'uploads', req.file.originalname);
  const fileName = req.file.originalname;
  const separationId = uuidv4();
  
  try {
    // Run the Demucs separation script
    const python = spawn('python', [
      '-m', 'demucs.separate',
      '--mp3',
      '--two-stems', 'vocals',
      '-n', 'mdx_extra',
      filePath
    ]);

    let errorData = '';
    python.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    await new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Error processing audio file: ${errorData}`));
        } else {
          resolve();
        }
      });
    });

    // Get paths to the separated files
    const baseFileName = path.parse(fileName).name;
    const outputDir = path.join(__dirname, 'separated', 'mdx_extra', baseFileName);
    
    // Check if the directory exists
    if (!fs.existsSync(outputDir)) {
      throw new Error('Output files not found');
    }

    // Get the list of files in the output directory
    const files = fs.readdirSync(outputDir);
    
    // Find vocals and no_vocals files
    const vocalsFile = files.find(file => file.includes('vocals') && !file.includes('no_vocals'));
    const noVocalsFile = files.find(file => file.includes('no_vocals'));
    
    if (!vocalsFile || !noVocalsFile) {
      throw new Error('Expected output files not found');
    }

    // Create paths for the files
    const vocalsPath = `/separated/mdx_extra/${baseFileName}/${vocalsFile}`;
    const instrumentalPath = `/separated/mdx_extra/${baseFileName}/${noVocalsFile}`;

    // Store in database
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO audio_separations (id, original_filename, vocals_path, instrumental_path) VALUES ($1, $2, $3, $4)',
        [separationId, fileName, vocalsPath, instrumentalPath]
      );
    } finally {
      client.release();
    }

    // Return the separation ID and file paths
    res.json({
      id: separationId,
      vocals: vocalsPath,
      instrumental: instrumentalPath
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});