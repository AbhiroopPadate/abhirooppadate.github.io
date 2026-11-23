const MODELS = [
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 · 0.5B · low-VRAM WebGPU' },
  { id: 'LFM2.5-350M-q4f16_1-MLC', label: 'LFM 2.5 · 350M · ultra-low-VRAM WebGPU' }
];
let engine = null;
let loading = false;
let activeModel = null;
const history = [];

const PUBLIC_CONTEXT = `You are Abhiroop Padate's local portfolio agent. You only know the public facts below. Never invent private information, contact details, passwords, files, browsing history, or unpublished personal data. If asked for private information, clearly say you do not have access to it. Be specific, useful, and honest about dates and DOI-pending work.

RESPONSE STYLE: Answer directly in 3–6 concise bullets or short paragraphs. For project questions, organize around problem, inputs, model/system, result, and impact. For publication questions, distinguish DOI-linked published records from DOI-pending accepted work. Use only facts in this context; if a detail is missing, say so instead of guessing.

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
const input = $('#ai-input');
const launcher = $('#ai-launcher');
const studio = $('#ai-studio');
const navLink = document.querySelector('a[href="#ai-studio"]');
const clearButton = $('#ai-clear');
const closeButton = document.createElement('button');
closeButton.className = 'ai-close';
closeButton.type = 'button';
closeButton.setAttribute('aria-label', 'Close local AI agent');
closeButton.textContent = '×';
studio.prepend(closeButton);
const agentProof = document.createElement('div');
agentProof.className = 'ai-proof';
agentProof.innerHTML = '<span>AGENT ARCHITECTURE</span><strong>Public context → skill routing → streamed local inference</strong><small>Built into the portfolio to demonstrate grounded responses, useful agent behaviors, and privacy by design.</small>';
document.querySelector('.ai-studio-heading')?.append(agentProof);

function setChatEnabled(enabled) {
  input.disabled = !enabled;
  sendButton.disabled = !enabled;
  input.setAttribute('aria-disabled', String(!enabled));
}

function setPanel(open) {
  studio.classList.toggle('ai-open', open);
  launcher.setAttribute('aria-expanded', String(open));
  if (open) setTimeout(() => (engine ? input : loadButton).focus(), 40);
}

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
    setStatus('WebGPU unavailable · model locked', 'warn');
    loadButton.textContent = 'Use Chrome or Edge with WebGPU ↗';
    $('#ai-hint').textContent = 'This browser does not expose WebGPU, so the local model cannot start here. Prompts stay locked for privacy.';
    return;
  }
  loading = true;
  loadButton.disabled = true;
  progress.hidden = false;
  setStatus('Downloading local model…', 'loading');
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('WebGPU is present but no compatible GPU adapter was found.');
    const { CreateMLCEngine } = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm');
    let lastError = null;
    for (const candidate of MODELS) {
      try {
        setStatus(`Preparing ${candidate.label.split(' · ')[0]} locally…`, 'loading');
        engine = await CreateMLCEngine(candidate.id, {
          initProgressCallback: (report) => {
            const value = Math.max(0, Math.min(100, Math.round((report.progress || 0) * 100)));
            progress.querySelector('span').style.width = `${value}%`;
            setStatus(value ? `Loading local model · ${value}%` : 'Loading local model…', 'loading');
          }
        });
        activeModel = candidate;
        break;
      } catch (error) {
        lastError = error;
        engine = null;
      }
    }
    if (!engine) throw lastError || new Error('No local model could be initialized.');
    $('#ai-model-label').textContent = activeModel.label;
    setStatus('Local model ready · private', 'ready');
    loadButton.textContent = 'Local model ready ✓';
    $('#ai-hint').textContent = 'Prompts stay on this device. The model is cached locally for your next visit.';
    setChatEnabled(true);
    input.focus();
  } catch (error) {
    const detail = String(error?.message || error || '').toLowerCase();
    const memoryIssue = detail.includes('memory') || detail.includes('device was lost') || detail.includes('out of bounds');
    const adapterIssue = detail.includes('adapter') || detail.includes('webgpu');
    setStatus(memoryIssue ? 'GPU memory limit · model locked' : adapterIssue ? 'No compatible GPU adapter · model locked' : 'WebLLM runtime unavailable · model locked', 'warn');
    loadButton.disabled = false;
    loadButton.textContent = memoryIssue ? 'Retry with low-memory model ↗' : 'Retry local model ↗';
    $('#ai-hint').textContent = memoryIssue
      ? 'The GPU rejected the first model. A smaller fallback was attempted; close GPU-heavy tabs and retry in Chrome or Edge.'
      : adapterIssue
        ? 'WebGPU is exposed, but this browser has no compatible GPU adapter available. Enable hardware acceleration, then retry in Chrome or Edge.'
        : 'The WebLLM runtime could not start. Prompts remain locked; retry in a current Chrome or Edge build with hardware acceleration enabled.';
  } finally {
    loading = false;
    progress.hidden = true;
  }
}

async function answer(prompt) {
  addMessage('user', prompt);
  if (!engine) {
    addMessage('assistant', 'Please initialize the local model above before sending prompts. Your chat stays locked until the model is ready.');
    return;
  }
  sendButton.disabled = true;
  setStatus('Thinking locally…', 'loading');
  const body = addMessage('assistant', '');
  history.push({ role: 'user', content: prompt });
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
    engine = null;
    body.textContent = 'The local model stopped before completing this response. Re-initialize it and try again; no prompt was sent to a server.';
    setStatus('Model stopped · re-initialize', 'warn');
    setChatEnabled(false);
    loadButton.disabled = false;
    loadButton.textContent = 'Re-initialize local model ↗';
  } finally {
    if (engine) sendButton.disabled = false;
  }
}

setChatEnabled(false);
setPanel(false);
launcher.addEventListener('click', () => setPanel(!studio.classList.contains('ai-open')));
closeButton.addEventListener('click', () => setPanel(false));
navLink?.addEventListener('click', (event) => { event.preventDefault(); setPanel(true); });
loadButton.addEventListener('click', initModel);
$('#ai-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const prompt = input.value.trim();
  if (!prompt || sendButton.disabled) return;
  input.value = '';
  answer(prompt);
});
document.querySelectorAll('[data-ai-prompt]').forEach((button) => button.addEventListener('click', () => {
  $('#ai-input').value = button.dataset.aiPrompt;
  $('#ai-input').focus();
}));
clearButton.addEventListener('click', () => {
  history.length = 0;
  messages.innerHTML = '<div class="ai-message assistant"><span class="ai-avatar">AI</span><p>Chat cleared. I still only know the public portfolio knowledge embedded in this page.</p></div>';
});
