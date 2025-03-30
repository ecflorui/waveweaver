// server.js
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 5001;

// Enable CORS
app.use(cors());

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

// Endpoint for file upload and processing
app.post('/api/separate', upload.single('audioFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, 'uploads', req.file.originalname);
  const fileName = req.file.originalname;
  
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

  python.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ 
        error: 'Error processing audio file', 
        details: errorData 
      });
    }

    // Get paths to the separated files
    const baseFileName = path.parse(fileName).name;
    const outputDir = path.join(__dirname, 'separated', 'mdx_extra', baseFileName);
    
    // Check if the directory exists
    if (!fs.existsSync(outputDir)) {
      return res.status(500).json({ error: 'Output files not found' });
    }

    // Get the list of files in the output directory
    const files = fs.readdirSync(outputDir);
    
    // Find vocals and no_vocals files
    const vocalsFile = files.find(file => file.includes('vocals') && !file.includes('no_vocals'));
    const noVocalsFile = files.find(file => file.includes('no_vocals'));
    
    if (!vocalsFile || !noVocalsFile) {
      return res.status(500).json({ error: 'Expected output files not found' });
    }

    // Return the paths to the separated files
    res.json({
      vocals: `/separated/mdx_extra/${baseFileName}/${vocalsFile}`,
      instrumental: `/separated/mdx_extra/${baseFileName}/${noVocalsFile}`
    });
  });
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});