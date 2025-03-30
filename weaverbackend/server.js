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

// Add JSON body parser
app.use(express.json());

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'waveweaver',
  password: 'Ramanlsm&1', // Default password for postgres user
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

      CREATE TABLE IF NOT EXISTS mixer_tracks (
        id UUID PRIMARY KEY,
        track_id TEXT NOT NULL,
        track_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}

// Endpoint for adding tracks to mixer
app.post('/api/add-to-mixer', async (req, res) => {
  console.log('Received request to add track to mixer:', req.body);
  
  const { trackId, trackPath } = req.body;
  
  if (!trackId || !trackPath) {
    console.error('Missing required fields:', { trackId, trackPath });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO mixer_tracks (id, track_id, track_path) VALUES ($1, $2, $3) RETURNING *',
        [uuidv4(), trackId, trackPath]
      );
      console.log('Successfully added track to mixer:', result.rows[0]);
      res.json({ message: 'Track added to mixer successfully', track: result.rows[0] });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ error: 'Database error while adding track to mixer' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding track to mixer:', error);
    res.status(500).json({ error: 'Failed to add track to mixer' });
  }
});

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

// Endpoint for getting all mixer tracks
app.get('/api/mixer-tracks', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM mixer_tracks ORDER BY created_at DESC');
      console.log('Successfully fetched mixer tracks:', result.rows);
      res.json({ tracks: result.rows });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ error: 'Database error while fetching mixer tracks' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching mixer tracks:', error);
    res.status(500).json({ error: 'Failed to fetch mixer tracks' });
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