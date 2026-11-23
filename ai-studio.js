const MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
let engine = null;
let loading = false;
const history = [];

const PUBLIC_CONTEXT = `You are Abhiroop Padate's local portfolio agent. You only know the public facts below. Never invent private information, contact details, passwords, files, browsing history, or unpublished personal data. If asked for private information, clearly say you do not have access to it. Be specific, useful, and honest about dates and DOI-pending work.

PUBLIC PROFILE: Abhiroop is a Computer & Communication Engineering student at KJ Somaiya College of Engineering with Honours in Data Science. He builds AI systems across agentic AI and LLMs, machine learning, computer vision, biomedical intelligence, wireless sensing, geospatial ML, embedded systems, and edge AI.

SELECTED PROJECTS: Wi-Fi CSI Human Activity Classification (Transformer/DNN, 85.10% accuracy); Video-Based Gait Tracking (YOLOv12, MediaPipe, LSTM); Blind Cap — ChaturChakshu (agentic assistive wearable combining RealSense, ToF, LiDAR, YOLOv8, and a quantized LoRA-adapted language model for contextual audio guidance); IMU-Based Gait Analysis; Deforestation Prediction for SGNP (Sentinel-2, NDVI, GIS, 95.7% balanced accuracy); Smart Tourist Safety & Response (anomaly detection, geofencing, verified identity, React/Node); CredDhwani (credit risk ML); Automatic Gearing Kit; Gym Tracker AI; Optimized Route Planning for RTN Trucks.

PUBLICATION RECORD: Joint moments from kinematics using ML (Journal of Orthopaedics, DOI 10.1016/j.jor.2024.06.016); deforestation susceptibility in SGNP (Sensing and Imaging, DOI 10.1007/s11220-026-00862-z); deforestation risk using multi-temporal NDVI (IEEE EarthSense, DOI 10.1109/earthsense66084.2025.11297320); Surface EMG lower-limb activity detection (DOI 10.1201/9781003773771-74); Wind Speed Forecasting Using Hybrid ML (DOI 10.1007/978-3-032-31216-7_41); Wi-Fi CSI activity classification and adaptive IMU gait framework are accepted/proceedings records with DOI pending in the portfolio.

PUBLIC SIGNALS: CGPA 9.89/10, 10 selected projects, 7 publications plus 1 patent application, 2nd at F1 in Schools India National Finals, and 4th at a Smart India Hackathon university selection. Skills include Python, PyTorch, TensorFlow, scikit-learn, Transformers, Hugging Face/LoRA, OpenCV, YOLO, MediaPipe, React, Node.js, Docker, QGIS, Arduino, ESP32, STM32, Raspberry Pi, IMUs, LiDAR, and ToF sensors.`;

const $ = (selector) => document.querySelector(selector);
const messages = $('#ai-messages');
const status = $('#ai-status');
const loadButton = $('#ai-load');
const sendButton = $('#ai-send');
const progress = $('#ai-progress');

function setStatus(text, state = 'idle') {
  status.textContent = text;
  status.dataset.state = state;
}

function addMessage(role, text) {
  const item = document.createElement('div');
  item.className = `ai-message ${role}`;
  const avatar = document.createElement('span');
  avatar.className = 'ai-avatar';
  avatar.textContent = role === 'assistant' ? 'AI' : 'YOU';
  const body = document.createElement('p');
  body.textContent = text;
  item.append(avatar, body);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
  return body;
}

function fallback(prompt) {
  const q = prompt.toLowerCase();
  if (q.includes('blind') || q.includes('chatur')) return 'Blind Cap is Abhiroop’s strongest agentic edge-AI story: it senses the scene with RealSense, ToF and LiDAR, uses YOLOv8 for visual detection, and routes that multimodal context into a quantized LoRA-adapted language model that can produce contextual audio guidance. The design challenge is useful reasoning under wearable compute and latency constraints.';
  if (q.includes('paper') || q.includes('publication') || q.includes('research')) return 'The research arc moves from biomechanics and wearable sensing to geospatial ML and wireless intelligence. Five records have DOI links in the portfolio; the Wi-Fi CSI and adaptive IMU records are marked DOI pending rather than being presented as published identifiers.';
  if (q.includes('project')) return 'The 10 selected projects cluster into four themes: agentic/edge AI (Blind Cap), computer vision (gait and Gym Tracker), applied ML (deforestation, credit risk and route planning), and real-world systems (tourist safety, gearing and wireless sensing).';
  if (q.includes('intro') || q.includes('pitch')) return 'I’m Abhiroop Padate, an AI/ML researcher and systems builder working from messy real-world data to deployable intelligence. My work spans agentic AI, LLMs, computer vision, biomedical ML, wireless sensing and edge systems—with published research and hands-on prototypes connecting the model to impact.';
  return 'I can explain the public projects, research record, AI/ML stack, and the design decisions behind Blind Cap. Try “Explain Blind Cap”, “Map the projects”, or “Summarize the publications.”';
}

async function initModel() {
  if (engine || loading) return;
  if (!navigator.gpu) {
    setStatus('WebGPU unavailable · demo mode', 'warn');
    loadButton.textContent = 'Use demo knowledge ↗';
    $('#ai-hint').textContent = 'This browser cannot run the local model, so the public-knowledge fallback remains available.';
    return;
  }
  loading = true;
  loadButton.disabled = true;
  progress.hidden = false;
  setStatus('Downloading local model…', 'loading');
  try {
    const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');
    engine = await CreateMLCEngine(MODEL, {
      initProgressCallback: (report) => {
        const value = Math.max(0, Math.min(100, Math.round((report.progress || 0) * 100)));
        progress.querySelector('span').style.width = `${value}%`;
        setStatus(value ? `Loading local model · ${value}%` : 'Loading local model…', 'loading');
      }
    });
    setStatus('Local model ready · private', 'ready');
    loadButton.textContent = 'Local model ready ✓';
    $('#ai-hint').textContent = 'Prompts stay on this device. The model is cached locally for your next visit.';
  } catch (error) {
    setStatus('Local model unavailable · demo mode', 'warn');
    loadButton.disabled = false;
    loadButton.textContent = 'Retry local model ↗';
    $('#ai-hint').textContent = 'The public-knowledge fallback is still available; try again on a WebGPU-enabled browser.';
  } finally {
    loading = false;
    progress.hidden = true;
  }
}

async function answer(prompt) {
  addMessage('user', prompt);
  const localPrompt = `${PUBLIC_CONTEXT}\n\nVisitor request: ${prompt}`;
  if (!engine) {
    addMessage('assistant', fallback(prompt));
    return;
  }
  sendButton.disabled = true;
  setStatus('Thinking locally…', 'loading');
  const body = addMessage('assistant', '');
  history.push({ role: 'user', content: localPrompt });
  try {
    const stream = await engine.chat.completions.create({
      messages: [{ role: 'system', content: PUBLIC_CONTEXT }, ...history.slice(-6)],
      temperature: 0.55,
      max_tokens: 420,
      stream: true
    });
    let text = '';
    for await (const chunk of stream) {
      text += chunk.choices?.[0]?.delta?.content || '';
      body.textContent = text;
      messages.scrollTop = messages.scrollHeight;
    }
    history.push({ role: 'assistant', content: text });
    setStatus('Local model ready · private', 'ready');
  } catch (error) {
    body.textContent = fallback(prompt);
    setStatus('Recovered with demo knowledge', 'warn');
  } finally {
    sendButton.disabled = false;
  }
}

loadButton.addEventListener('click', initModel);
$('#ai-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#ai-input');
  const prompt = input.value.trim();
  if (!prompt || sendButton.disabled) return;
  input.value = '';
  answer(prompt);
});
document.querySelectorAll('[data-ai-prompt]').forEach((button) => button.addEventListener('click', () => {
  $('#ai-input').value = button.dataset.aiPrompt;
  $('#ai-input').focus();
}));
$('#ai-clear').addEventListener('click', () => {
  history.length = 0;
  messages.innerHTML = '<div class="ai-message assistant"><span class="ai-avatar">AI</span><p>Chat cleared. I still only know the public portfolio knowledge embedded in this page.</p></div>';
});
