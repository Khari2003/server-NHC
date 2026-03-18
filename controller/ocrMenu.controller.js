const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const ort = require("onnxruntime-node");

// Cấu hình Gemini
const genAI = new GoogleGenerativeAI("AIzaSyDEC4-6yXRUJ3vPZacAgl4CFKpb4yy3Gw4"); 
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

let session = null;

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

// ===== 2. HÀM GỌI GEMINI (Xử lý cả Tên & Giá) =====
async function callGeminiVision(imageBuffer) {
  try {
    const prompt = `
      Bạn là một trợ lý số hóa thực đơn chuyên nghiệp. 
      Hãy trích xuất danh sách các món ăn và giá tiền từ hình ảnh này.
      
      Yêu cầu:
      1. Tên món: Chỉ lấy tiếng Việt, viết hoa chữ cái đầu mỗi từ. Loại bỏ phần dịch tiếng Anh.
      2. Giá tiền: Trích xuất số tiền tương ứng. Giữ nguyên đơn vị nếu có (vd: 50k, 55.000). 
         Nếu món đó không có giá rõ ràng, hãy để là "Liên hệ".
      3. Loại bỏ: Các thông tin rác như số thứ tự, địa chỉ, số điện thoại, lời chào, ghi chú chân trang.
      4. Định dạng: Trả về duy nhất một mảng JSON các đối tượng có cấu trúc: {"name": "Tên món", "price": "Giá tiền"}.
      
      Ví dụ kết quả: [{"name": "Phở Bò Chín", "price": "55.000"}, {"name": "Gỏi Cuốn", "price": "15k"}]
      Chỉ trả về JSON, không giải thích gì thêm.
    `;

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();

    // Làm sạch Markdown JSON
    text = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    return [];
  }
}

// ===== 3. TIỀN XỬ LÝ YOLO =====
async function preprocessImage(buffer, inputSize = 640) {
  const { data } = await sharp(buffer)
    .removeAlpha()
    .resize(inputSize, inputSize, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const floatData = new Float32Array(3 * inputSize * inputSize);
  for (let i = 0; i < inputSize * inputSize; i++) {
    floatData[i] = data[i * 3] / 255.0;
    floatData[i + inputSize * inputSize] = data[i * 3 + 1] / 255.0;
    floatData[i + 2 * inputSize * inputSize] = data[i * 3 + 2] / 255.0;
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
    if (conf < 0.4) continue;

    const cx = data[0 * numBoxes + i];
    const cy = data[1 * numBoxes + i];
    const w = data[2 * numBoxes + i];
    const h = data[3 * numBoxes + i];

    boxes.push({
      bbox: [
        Math.max(0, Math.round((cx - w / 2) * scaleX)),
        Math.max(0, Math.round((cy - h / 2) * scaleY)),
        Math.round((cx + w / 2) * scaleX),
        Math.round((cy + h / 2) * scaleY)
      ],
      conf
    });
  }
  return boxes; 
}

// ===== 4. MAIN API EXPORT =====

const readMenuFromBoundingBoxes = async (req, res) => {
  try {
    console.log("🚀 [Gemini OCR] Processing started...");
    const sess = await loadModel();
    
    if (!req.file) throw new Error("No image uploaded");
    const imgBuffer = req.file.buffer;
    const meta = await sharp(imgBuffer).metadata();

    // Bước 1: Detection (YOLO) để kiểm tra xem có vùng menu không
    const inputTensor = await preprocessImage(imgBuffer);
    const outputs = await sess.run({ images: inputTensor });
    const detections = postprocessYOLO(outputs[Object.keys(outputs)[0]], meta.width, meta.height);

    let finalMenu = [];

    // Bước 2: Dùng Gemini xử lý
    // Nếu có detections, ta có thể chọn gửi vùng lớn nhất hoặc gửi cả ảnh.
    // Thực tế Gemini xử lý ảnh gốc rất tốt trong việc khớp giá tiền với tên món.
    if (detections.length > 0) {
        console.log(`  🎯 Detected ${detections.length} regions. Processing full image for context...`);
    }

    // Gửi ảnh cho Gemini (Gemini sẽ tự làm mọi việc từ OCR đến lọc ngôn ngữ)
    finalMenu = await callGeminiVision(imgBuffer);

    // Loại bỏ trùng lặp nếu có
    const uniqueMenu = Array.from(
      new Map(finalMenu.map(item => [item.name.toLowerCase(), item])).values()
    );

    console.log(`✅ [Gemini] Extracted ${uniqueMenu.length} items with prices.`);
    res.json({ success: true, menu: uniqueMenu });

  } catch (err) {
    console.error("❌ API Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { readMenuFromBoundingBoxes };