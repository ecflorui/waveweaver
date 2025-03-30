const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const port = 5001;

// Enable CORS
app.use(cors());

// Create uploads and separated directories if they don't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('separated')) {
  fs.mkdirSync('separated');
}

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
app.use('/separated', express.static(path.join(__dirname, 'separated')));

app.post('/separate-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, 'uploads', req.file.originalname);
  const fileName = req.file.originalname;

  console.log('Processing file:', fileName);
  console.log('File path:', filePath);
  
  // Run the Demucs separation script
  const python = spawn('python', [
    'demucs.py',
    '--model', 'mdx_extra',
    '--output', 'separated/mdx_extra',
    filePath
  ]);

  python.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  python.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on('close', (code) => {
    console.log('Python process exited with code:', code);
    if (code !== 0) {
      return res.status(500).json({ 
        error: 'Error processing audio file', 
        code
      });
    }

    const baseFileName = path.parse(fileName).name;
    const outputDir = path.join(__dirname, 'separated', 'mdx_extra', baseFileName);
    
    console.log('Looking for output in:', outputDir);
    // Check if the directory exists
    if (!fs.existsSync(outputDir)) {
      return res.status(500).json({ error: 'Output files not found' });
    }

    // Get the list of files in the output directory
    const files = fs.readdirSync(outputDir);
    console.log('Found files:', files);
    
    // Find vocals and no_vocals files
    const vocalsFile = files.find(file => file.includes('vocals') && !file.includes('no_vocals'));
    const noVocalsFile = files.find(file => file.includes('no_vocals'));

    if (!vocalsFile || !noVocalsFile) {
      return res.status(500).json({ error: 'Could not find separated files' });
    }

    // Return the paths to the separated files
    res.json({
      vocals: `/separated/mdx_extra/${baseFileName}/${vocalsFile}`,
      instrumental: `/separated/mdx_extra/${baseFileName}/${noVocalsFile}`,
      fileName: baseFileName
    });
  });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
