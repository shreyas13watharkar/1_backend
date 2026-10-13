
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const tempDir = path.resolve("public/temp");

fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({ storage });
