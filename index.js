// index.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const fileType = require("file-type");
const libre = require("libreoffice-convert");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");

const app = express();
const upload = multer({ dest: "/tmp/uploads", limits: { fileSize: 200 * 1024 * 1024 } });

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const libreConvert = promisify(libre.convert);

function cleanName(name) {
  return path.basename(name).replace(/\s+/g, "_");
}

// Office conversions
async function convertOffice(input, targetExt) {
  const buffer = await readFile(input);
  return libreConvert(buffer, targetExt, undefined);
}

// Image conversions
async function convertImage(input, target, resize) {
  let img = sharp(input);
  if (resize.width || resize.height) {
    img = img.resize(resize.width, resize.height, { fit: "inside" });
  }
  switch (target) {
    case "jpg":
    case "jpeg": return img.jpeg().toBuffer();
    case "png": return img.png().toBuffer();
    case "webp": return img.webp().toBuffer();
    case "tiff": return img.tiff().toBuffer();
    case "avif": return img.avif().toBuffer();
    case "heic": return img.heif().toBuffer();
    default: return img.toBuffer();
  }
}

// Audio/Video conversions
function convertMedia(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .on("error", reject)
      .on("end", () => resolve(output))
      .save(output);
  });
}

// API endpoint
app.post("/convert", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file missing" });
  const input = req.file.path;
  const original = cleanName(req.file.originalname);
  const target = (req.body.target || req.query.target || "").toLowerCase();

  try {
    const type = await fileType.fromFile(input);
    const mime = type ? type.mime : req.file.mimetype;

    // Office
    if (mime.includes("officedocument") || /\.(docx?|pptx?|xlsx?|odt)$/i.test(original)) {
      const ext = target || "pdf";
      const buf = await convertOffice(input, "." + ext);
      res.setHeader("Content-Disposition", `attachment; filename="${path.parse(original).name}.${ext}"`);
      return res.send(buf);
    }

    // Images
    if (mime.startsWith("image/")) {
      const buf = await convertImage(input, target || "png", { width: req.body.width, height: req.body.height });
      res.setHeader("Content-Disposition", `attachment; filename="${path.parse(original).name}.${target || "png"}"`);
      return res.send(buf);
    }

    // Audio/Video
    if (mime.startsWith("audio/") || mime.startsWith("video/")) {
      const ext = target || "mp3";
      const outPath = `/tmp/${uuidv4()}.${ext}`;
      await convertMedia(input, outPath);
      res.setHeader("Content-Disposition", `attachment; filename="${path.parse(original).name}.${ext}"`);
      return fs.createReadStream(outPath).pipe(res).on("finish", () => unlink(outPath));
    }

    return res.status(415).json({ error: "unsupported file type" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "conversion_failed", message: err.message });
  } finally {
    try { await unlink(input); } catch {}
  }
});

app.get("/", (req, res) => res.json({ ok: true, msg: "File Converter API supports 100+ formats" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));

