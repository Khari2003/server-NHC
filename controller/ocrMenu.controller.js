const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const ort = require("onnxruntime-node");
const fs = require("fs");
const path = require("path");

let session = null;
let vietnameseDictionary = null;

// Ký tự tiếng Việt để kiểm tra dấu
const VIETNAMESE_CHARS_REGEX = /[àáảãạăằắẳẵặâầấtẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

// Danh sách đen: Tiếng Anh và lỗi OCR thường gặp
const ENGLISH_NOISE_REGEX = /\b(deep-?fried|tried|tned|fried|bean-?curd|spring|rolled|firecracker|nugget|sesame|corn|paste|vegan|cheese|with|style|sauce|mushroom|sheet|tofu|veggie|soup|salad|juice|tea|coffee|drink|special|daily|price|unit|small|large|medium|oyster)\b/gi;

const NOISE_KEYWORDS = /NHÀ HÀNG|ĐỊA CHỈ|ĐIỆN THOẠI|LIÊN HỆ|WWW|FACEBOOK|HOTLINE|LOGO|GIÁ|MENU|THỰC ĐƠN|VNĐ|VND|CHÚC QUÝ|VEGAN|PEACE|MAKE PEACE/i;

// ===== 1. LOAD MODEL YOLO =====
async function loadModel() {
  if (!session) {
    try {
      session = await ort.InferenceSession.create(
        "YOLO/best.onnx",
        { executionProviders: ["cpu"] }
      );
      console.log("✅ YOLO model loaded");
    } catch (err) {
      console.error("❌ Failed to load YOLO model:", err.message);
    }
  }
  return session;
}

// ===== 2. LOAD TỪ ĐIỂN (Sửa lỗi đường dẫn & định dạng) =====
async function loadDictionary() {
  if (vietnameseDictionary) return vietnameseDictionary;

  const jsonPath = "words.json";
  try {
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, "utf8").trim();
      let words = [];

      // Xử lý cả JSON mảng và JSONL
      if (data.startsWith("[")) {
        words = JSON.parse(data).map(item => (item.text || item).toLowerCase());
      } else {
        words = data.split("\n")
          .filter(line => line.trim())
          .map(line => {
            try { return JSON.parse(line).text.toLowerCase(); }
            catch { return line.trim().toLowerCase(); }
          });
      }

      vietnameseDictionary = new Set(words.filter(w => w.length > 1));
      console.log(`✅ Dictionary loaded: ${vietnameseDictionary.size} words`);
    } else {
      console.warn("⚠️ Dictionary file not found at:", jsonPath);
      vietnameseDictionary = createBasicDictionary();
    }
  } catch (err) {
    console.error("❌ Error loading dictionary:", err.message);
    vietnameseDictionary = createBasicDictionary();
  }
  return vietnameseDictionary;
}

function createBasicDictionary() {
  return new Set(["pháo", "xuân", "chà", "bắp", "hoa", "đăng", "nấm", "chiên", "giòn", "mè", "phượng", "phù", "chúc", "cuốn", "phở", "bánh", "cháo", "hấp", "rong", "biển", "xào", "súp", "đậu", "hủ", "rang", "muối", "ớt", "canh", "gỏi", "lẩu", "nem", "kho", "nướng", "sốt", "chua", "ngọt", "mì", "bún"]);
}

// ===== 3. HÀM XỬ LÝ TEXT (ƯU TIÊN TIẾNG VIỆT) =====

function isVietnameseWord(word) {
  const lower = word.toLowerCase();
  // Nếu có dấu tiếng Việt -> Chắc chắn là tiếng Việt
  if (VIETNAMESE_CHARS_REGEX.test(lower)) return true;
  // Nếu nằm trong từ điển -> Tiếng Việt
  if (vietnameseDictionary && vietnameseDictionary.has(lower)) return true;
  return false;
}

function cleanItemName(text) {
  if (!text) return "";

  // Bỏ nội dung trong ngoặc và tách lấy phần trước dấu '/' (English sub)
  let cleaned = text.split("/")[0].split("(")[0].split("|")[0];

  // Loại bỏ giá tiền, ký tự đặc biệt
  cleaned = cleaned
    .replace(/\d+([.,]\d+)*\s*(vnđ|đ|vnd|k|tỷ)?/gi, "")
    .replace(/[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Loại bỏ các từ noise tiếng Anh (fried, tried, v.v.)
  cleaned = cleaned.replace(ENGLISH_NOISE_REGEX, "");

  // Lọc từng từ: Chỉ giữ lại từ có dấu hoặc nằm trong từ điển Việt
  let words = cleaned.split(/\s+/);
  let finalWords = words.filter(word => isVietnameseWord(word));

  if (finalWords.length === 0) return "";

  // Format: Viết hoa chữ đầu mỗi từ
  let finalName = finalWords
    .join(" ")
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, m => m.toUpperCase())
    .trim();

  return finalName;
}

function parseMenuText(text) {
  if (!text) return [];
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);
  let items = [];

  for (let line of lines) {
    if (NOISE_KEYWORDS.test(line)) continue;

    // Tách món nếu dòng có dấu gạch ngang/chấm
    const segments = line.split(/[-–—•]/);
    for (let seg of segments) {
      const name = cleanItemName(seg);
      // Điều kiện: Tên món phải có ít nhất 1 từ có dấu để tránh "Deep Tried"
      if (name.length > 2 && VIETNAMESE_CHARS_REGEX.test(name)) {
        items.push({ name });
      }
    }
  }
  return items;
}

// ===== 4. YOLO & IMAGE PROCESSING =====

async function preprocessImage(buffer, inputSize = 640) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .resize(inputSize, inputSize, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const floatData = new Float32Array(3 * inputSize * inputSize);
  for (let i = 0; i < inputSize * inputSize; i++) {
    floatData[i] = data[i * 3] / 255.0; // R
    floatData[i + inputSize * inputSize] = data[i * 3 + 1] / 255.0; // G
    floatData[i + 2 * inputSize * inputSize] = data[i * 3 + 2] / 255.0; // B
  }
  return new ort.Tensor("float32", floatData, [1, 3, inputSize, inputSize]);
}

function postprocessYOLO(output, imgW, imgH, inputSize = 640) {
  const boxes = [];
  const data = output.data;
  const numBoxes = output.dims[2];
  const scaleX = imgW / inputSize;
  const scaleY = imgH / inputSize;

  for (let i = 0; i < numBoxes; i++) {
    const conf = data[4 * numBoxes + i];
    if (conf < 0.35) continue;

    const cx = data[0 * numBoxes + i];
    const cy = data[1 * numBoxes + i];
    const w = data[2 * numBoxes + i];
    const h = data[3 * numBoxes + i];

    const x1 = Math.round((cx - w / 2) * scaleX);
    const y1 = Math.round((cy - h / 2) * scaleY);
    const x2 = Math.round((cx + w / 2) * scaleX);
    const y2 = Math.round((cy + h / 2) * scaleY);

    boxes.push({ bbox: [x1, y1, x2, y2], conf });
  }

  // Simple NMS
  boxes.sort((a, b) => b.conf - a.conf);
  const result = [];
  const used = new Set();
  for (let i = 0; i < boxes.length; i++) {
    if (used.has(i)) continue;
    result.push(boxes[i]);
    for (let j = i + 1; j < boxes.length; j++) {
      if (calculateIoU(boxes[i].bbox, boxes[j].bbox) > 0.5) used.add(j);
    }
  }
  return result;
}

function calculateIoU(b1, b2) {
  const xI1 = Math.max(b1[0], b2[0]), yI1 = Math.max(b1[1], b2[1]);
  const xI2 = Math.min(b1[2], b2[2]), yI2 = Math.min(b1[3], b2[3]);
  const inter = Math.max(0, xI2 - xI1) * Math.max(0, yI2 - yI1);
  const area1 = (b1[2] - b1[0]) * (b1[3] - b1[1]);
  const area2 = (b2[2] - b2[0]) * (b2[3] - b2[1]);
  return inter / (area1 + area2 - inter);
}

async function enhanceImageForOCR(buffer) {
  return await sharp(buffer)
    .resize(2000) // Phóng to để Tesseract đọc tốt hơn
    .grayscale()
    .modulate({ brightness: 1.2, contrast: 1.5 })
    .sharpen()
    .toBuffer();
}

// ===== 5. MAIN API EXPORT =====

const readMenuFromBoundingBoxes = async (req, res) => {
  try {
    console.log("🚀 [OCR] Processing started...");
    const [sess, dict] = await Promise.all([loadModel(), loadDictionary()]);
    
    if (!req.file) throw new Error("No image uploaded");
    const imgBuffer = req.file.buffer;
    const meta = await sharp(imgBuffer).metadata();

    // Bước 1: Detection
    const inputTensor = await preprocessImage(imgBuffer);
    const outputs = await sess.run({ images: inputTensor });
    const detections = postprocessYOLO(outputs[Object.keys(outputs)[0]], meta.width, meta.height);

    let finalMenu = [];

    // Bước 2: OCR
    if (detections.length === 0) {
      console.log("  ⚠️ No regions found, processing full image");
      const enhanced = await enhanceImageForOCR(imgBuffer);
      const { data } = await Tesseract.recognize(enhanced, "vie");
      finalMenu = parseMenuText(data.text);
    } else {
      for (const det of detections) {
        const [x1, y1, x2, y2] = det.bbox;
        const crop = await sharp(imgBuffer)
          .extract({ 
            left: Math.max(0, x1), 
            top: Math.max(0, y1), 
            width: Math.min(meta.width - x1, x2 - x1), 
            height: Math.min(meta.height - y1, y2 - y1) 
          })
          .toBuffer();

        const enhancedCrop = await enhanceImageForOCR(crop);
        const { data } = await Tesseract.recognize(enhancedCrop, "vie");
        finalMenu = finalMenu.concat(parseMenuText(data.text));
      }
    }

    // Loại bỏ trùng lặp (Case-insensitive)
    const uniqueMenu = Array.from(
      new Map(finalMenu.map(item => [item.name.toLowerCase(), item])).values()
    );

    console.log(`✅ [OCR] Found ${uniqueMenu.length} items.`);
    res.json({ success: true, menu: uniqueMenu });

  } catch (err) {
    console.error("❌ API Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { readMenuFromBoundingBoxes };