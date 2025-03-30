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
  password: 'Snap12509', // Default password for postgres user
  port: 5432,
});

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Serve static files from the separated directory
const separatedDir = path.join(__dirname, 'separated');
if (!fs.existsSync(separatedDir)) {
  fs.mkdirSync(separatedDir, { recursive: true });
}
app.use('/separated', express.static(separatedDir));

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Drop existing tables to ensure clean state
    await client.query(`
      DROP TABLE IF EXISTS audio_separations;
      DROP TABLE IF EXISTS mixer_tracks;
    `);

    // Create tables with updated schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS audio_separations (
        id UUID PRIMARY KEY,
        original_filename TEXT NOT NULL,
        vocals_path TEXT,
        instrumental_path TEXT,
        drums_path TEXT,
        bass_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mixer_tracks (
        id UUID PRIMARY KEY,
        track_id TEXT NOT NULL,
        track_path TEXT NOT NULL,
        original_filename TEXT NOT NULL,
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
  
  const { trackId, trackPath, originalFilename } = req.body;
  
  if (!trackId || !trackPath || !originalFilename) {
    console.error('Missing required fields:', { trackId, trackPath, originalFilename });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO mixer_tracks (id, track_id, track_path, original_filename) VALUES ($1, $2, $3, $4) RETURNING *',
        [uuidv4(), trackId, trackPath, originalFilename]
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
    // Parse selected stems from request
    const selectedStems = JSON.parse(req.body.stems || '["vocals", "instrumental"]');
    
    // Build the Demucs command based on selected stems
    const demucsArgs = ['-n', 'htdemucs'];
    
    // If only vocals and instrumental are selected, use two-stems mode
    if (selectedStems.length === 2 && 
        selectedStems.includes('vocals') && 
        selectedStems.includes('instrumental')) {
      demucsArgs.push('--two-stems', 'vocals');
    }

    // Add output directory and format flags
    const baseFileName = path.parse(fileName).name;
    const outputDir = path.join(separatedDir, 'htdemucs', baseFileName);
    demucsArgs.push('--out', separatedDir);
    demucsArgs.push('--mp3');

    // Add the file path as the last argument, properly escaped
    demucsArgs.push(`"${filePath}"`);

    // Run the Demucs separation script
    const python = spawn('python', ['-m', 'demucs.separate', ...demucsArgs], {
      shell: true // This will handle the quoted paths correctly
    });

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

    // If instrumental is selected, also run MDX Extra
    if (selectedStems.includes('instrumental')) {
      const mdxArgs = [
        '-n', 'mdx_extra',
        '--out', separatedDir,
        '--mp3',
        `"${filePath}"` // Properly escaped file path
      ];

      const mdxPython = spawn('python', ['-m', 'demucs.separate', ...mdxArgs], {
        shell: true // This will handle the quoted paths correctly
      });

      let mdxErrorData = '';
      mdxPython.stderr.on('data', (data) => {
        mdxErrorData += data.toString();
        console.error(`MDX Python stderr: ${data}`);
      });

      await new Promise((resolve, reject) => {
        mdxPython.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Error processing instrumental with MDX: ${mdxErrorData}`));
          } else {
            resolve();
          }
        });
      });
    }
    
    // Check if the directories exist
    const htdemucsDir = path.join(separatedDir, 'htdemucs', baseFileName);
    const mdxDir = path.join(separatedDir, 'mdx_extra', baseFileName);

    if (!fs.existsSync(htdemucsDir)) {
      throw new Error('HTDemucs output files not found');
    }

    if (selectedStems.includes('instrumental') && !fs.existsSync(mdxDir)) {
      throw new Error('MDX Extra output files not found');
    }

    // Get the list of files in the output directories
    const htdemucsFiles = fs.readdirSync(htdemucsDir);
    const mdxFiles = selectedStems.includes('instrumental') ? fs.readdirSync(mdxDir) : [];
    
    // Find the requested stem files
    const stemFiles = {};
    selectedStems.forEach(stem => {
      if (stem === 'vocals') {
        const file = htdemucsFiles.find(f => f.includes('vocals') && !f.includes('no_vocals'));
        if (file) {
          stemFiles[stem] = `/separated/htdemucs/${baseFileName}/${file}`;
        }
      } else if (stem === 'instrumental') {
        // First try to find an already renamed instrumental file
        let file = mdxFiles.find(f => f.includes('instrumental'));
        if (!file) {
          // If not found, look for no_vocals and rename it
          file = mdxFiles.find(f => f.includes('no_vocals'));
          if (file) {
            const newFileName = file.replace('no_vocals', 'instrumental');
            const oldPath = path.join(mdxDir, file);
            const newPath = path.join(mdxDir, newFileName);
            fs.renameSync(oldPath, newPath);
            file = newFileName;
          }
        }
        if (file) {
          stemFiles[stem] = `/separated/mdx_extra/${baseFileName}/${file}`;
        }
      } else if (stem === 'drums' || stem === 'bass') {
        const file = htdemucsFiles.find(f => f.includes(stem));
        if (file) {
          stemFiles[stem] = `/separated/htdemucs/${baseFileName}/${file}`;
        }
      }
    });

    // Store in database
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO audio_separations (id, original_filename, vocals_path, instrumental_path, drums_path, bass_path) VALUES ($1, $2, $3, $4, $5, $6)',
        [separationId, fileName, stemFiles.vocals, stemFiles.instrumental, stemFiles.drums, stemFiles.bass]
      );
    } finally {
      client.release();
    }

    // Return the separation ID and file paths
    console.log('Sending response with stem files:', stemFiles);
    const response = {
      success: true,
      status: 'completed',
      id: separationId,
      original_filename: fileName
    };

    // Only include stems that were selected
    selectedStems.forEach(stem => {
      if (stemFiles[stem]) {
        response[stem] = stemFiles[stem];
      }
    });

    res.json(response);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      status: 'error',
      error: error.message 
    });
  }
});

// Endpoint for getting mixer tracks
app.get('/api/mixer-tracks', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM mixer_tracks ORDER BY created_at DESC');
      res.json({ tracks: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching mixer tracks:', error);
    res.status(500).json({ error: 'Failed to fetch mixer tracks' });
  }
});

// Endpoint for deleting all mixer tracks
app.delete('/api/mixer-tracks', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM mixer_tracks');
      res.json({ message: 'All tracks deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting tracks:', error);
    res.status(500).json({ error: 'Failed to delete tracks' });
  }
});

// Endpoint for deleting a single mixer track
app.delete('/api/mixer-tracks/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query('DELETE FROM mixer_tracks WHERE id = $1', [id]);
      res.json({ message: 'Track deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });