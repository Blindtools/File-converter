const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Setup file upload
const upload = multer({ dest: "uploads/" });

/**
 * Convert file endpoint
 * Example: POST /convert?format=pdf
 */
app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const targetFormat = req.query.format;
  if (!targetFormat) {
    return res.status(400).json({ error: "Target format not specified. Example: /convert?format=pdf" });
  }

  const inputPath = path.resolve(req.file.path);
  const outputPath = `${inputPath}.${targetFormat}`;

  // Use LibreOffice to convert
  exec(`soffice --headless --convert-to ${targetFormat} --outdir uploads ${inputPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error("Conversion error:", stderr);
      return res.status(500).json({ error: "Conversion failed" });
    }

    const convertedFile = path.resolve(`${req.file.destination}/${req.file.originalname.split(".")[0]}.${targetFormat}`);
    
    // Send file
    res.download(convertedFile, (err) => {
      if (err) console.error("Download error:", err);

      // Cleanup files after download
      fs.unlinkSync(inputPath);
      if (fs.existsSync(convertedFile)) {
        fs.unlinkSync(convertedFile);
      }
    });
  });
});

app.get("/", (req, res) => {
  res.send("✅ File Converter API is running. Use POST /convert?format=pdf with form-data { file }.");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
