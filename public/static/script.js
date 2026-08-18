// ==========================================================
// EARNIFY PROMPT DETECTOR PRO - JAVASCRIPT CONTROLLER
// Handles Drag & Drop, Video Previews, API Key Storage & Generation
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dropZone = document.getElementById('dropZone');
  const videoFileInput = document.getElementById('videoFileInput');
  const previewContainer = document.getElementById('previewContainer');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoMetaName = document.getElementById('videoMetaName');
  const videoMetaSize = document.getElementById('videoMetaSize');
  const clearFilesBtn = document.getElementById('clearFilesBtn');
  const previewCount = document.getElementById('previewCount');
  const multiVideoList = document.getElementById('multiVideoList');
  const singleVideoPreviewWrapper = document.getElementById('singleVideoPreviewWrapper');
  
  const generateBtn = document.getElementById('generateBtn');
  const generateBtnText = document.getElementById('generateBtnText');
  const apiWarningNote = document.getElementById('apiWarningNote');
  
  const pipelineCard = document.getElementById('pipelineCard');
  const pipelineStatusText = document.getElementById('pipelineStatusText');
  const progressBarFill = document.getElementById('progressBarFill');
  const stepUpload = document.getElementById('stepUpload');
  const stepProcess = document.getElementById('stepProcess');
  const stepFormat = document.getElementById('stepFormat');
  
  const resultCard = document.getElementById('resultCard');
  const resultCardHeading = document.getElementById('resultCardHeading');
  const formattedPromptOutput = document.getElementById('formattedPromptOutput');
  const rawPromptOutput = document.getElementById('rawPromptOutput');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const downloadResultBtn = document.getElementById('downloadResultBtn');
  const newAnalysisBtn = document.getElementById('newAnalysisBtn');
  
  // API Modal Elements
  const openApiModalBtn = document.getElementById('openApiModalBtn');
  const footerApiBtn = document.getElementById('footerApiBtn');
  const closeApiModalBtn = document.getElementById('closeApiModalBtn');
  const apiModal = document.getElementById('apiModal');
  const apiKeyInputModal = document.getElementById('apiKeyInputModal');
  const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const apiKeyTestStatus = document.getElementById('apiKeyTestStatus');
  const keyIndicatorDot = document.getElementById('keyIndicatorDot');
  const apiKeyStatusLabel = document.getElementById('apiKeyStatusLabel');
  
  // Mode selection
  const modeSingleLabel = document.getElementById('modeSingleLabel');
  const modeMultiLabel = document.getElementById('modeMultiLabel');
  const detectorModeInputs = document.querySelectorAll('input[name="detectorMode"]');
  const uploadHint = document.getElementById('uploadHint');
  const dropMainText = document.getElementById('dropMainText');
  
  // State
  let selectedFiles = [];
  let currentMode = 'video_prompt';
  let currentPromptResult = '';
  let storedApiKey = localStorage.getItem('gemini_api_key') || '';
  let currentVideoObjectURL = null;

  // ==========================================================
  // API KEY INITIALIZATION & MODAL
  // ==========================================================
  
  function updateApiKeyUI() {
    if (storedApiKey && storedApiKey.trim().length > 10) {
      keyIndicatorDot.classList.add('configured');
      apiKeyStatusLabel.textContent = 'API Key (Set)';
      apiWarningNote.style.display = 'none';
      apiKeyInputModal.value = storedApiKey;
    } else {
      keyIndicatorDot.classList.remove('configured');
      apiKeyStatusLabel.textContent = 'Set API Key';
      apiKeyInputModal.value = '';
    }
    checkReadyToGenerate();
  }

  updateApiKeyUI();

  openApiModalBtn.addEventListener('click', () => {
    apiKeyInputModal.value = storedApiKey;
    apiKeyTestStatus.style.display = 'none';
    apiModal.classList.add('show');
  });

  if (footerApiBtn) {
    footerApiBtn.addEventListener('click', () => {
      apiKeyInputModal.value = storedApiKey;
      apiKeyTestStatus.style.display = 'none';
      apiModal.classList.add('show');
    });
  }

  closeApiModalBtn.addEventListener('click', () => {
    apiModal.classList.remove('show');
  });

  apiModal.addEventListener('click', (e) => {
    if (e.target === apiModal) {
      apiModal.classList.remove('show');
    }
  });

  toggleApiKeyVisibility.addEventListener('click', () => {
    if (apiKeyInputModal.type === 'password') {
      apiKeyInputModal.type = 'text';
      toggleApiKeyVisibility.textContent = '🙈';
    } else {
      apiKeyInputModal.type = 'password';
      toggleApiKeyVisibility.textContent = '👁️';
    }
  });

  saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInputModal.value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      storedApiKey = key;
      showToast('✅ Gemini API Key saved securely in browser!');
    } else {
      localStorage.removeItem('gemini_api_key');
      storedApiKey = '';
      showToast('ℹ️ API Key cleared.');
    }
    updateApiKeyUI();
    apiModal.classList.remove('show');
  });

  testApiKeyBtn.addEventListener('click', async () => {
    const keyToTest = apiKeyInputModal.value.trim() || storedApiKey;
    if (!keyToTest) {
      showTestStatus('error', '❌ Please enter an API key to test.');
      return;
    }

    testApiKeyBtn.disabled = true;
    testApiKeyBtn.textContent = 'Testing...';
    apiKeyTestStatus.style.display = 'none';

    try {
      const response = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest })
      });
      const data = await response.json();

      if (response.ok && data.valid) {
        showTestStatus('success', '✅ Gemini Connection Successful! Model: gemini-3.6-flash is ready.');
      } else {
        showTestStatus('error', '❌ Invalid Key: ' + (data.error || 'Connection refused.'));
      }
    } catch (err) {
      showTestStatus('error', '❌ Network error testing API key.');
    } finally {
      testApiKeyBtn.disabled = false;
      testApiKeyBtn.textContent = '⚡ Test Connection';
    }
  });

  function showTestStatus(type, msg) {
    apiKeyTestStatus.className = 'test-status-box ' + type;
    apiKeyTestStatus.textContent = msg;
    apiKeyTestStatus.style.display = 'block';
  }

  // ==========================================================
  // MODE TOGGLE HANDLERS
  // ==========================================================
  
  detectorModeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      currentMode = e.target.value;
      if (currentMode === 'master_prompt') {
        modeSingleLabel.classList.remove('active');
        modeMultiLabel.classList.add('active');
        videoFileInput.multiple = true;
        uploadHint.textContent = 'Select 1 or multiple video clips to find viral patterns';
        dropMainText.textContent = 'Drag & Drop one or multiple video clips';
      } else {
        modeMultiLabel.classList.remove('active');
        modeSingleLabel.classList.add('active');
        videoFileInput.multiple = false;
        uploadHint.textContent = 'Supports MP4, MOV, WebM (Up to 150MB)';
        dropMainText.textContent = 'Drag & Drop your video clip here';
      }
      // Reset selected files on mode change if needed
      if (selectedFiles.length > 1 && currentMode === 'video_prompt') {
        selectedFiles = [selectedFiles[0]];
        renderFilePreview();
      }
    });
  });

  // ==========================================================
  // DRAG & DROP & FILE HANDLING
  // ==========================================================
  
  dropZone.addEventListener('click', () => videoFileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
    }
  });

  videoFileInput.addEventListener('change', () => {
    if (videoFileInput.files && videoFileInput.files.length > 0) {
      handleIncomingFiles(videoFileInput.files);
    }
  });

  function handleIncomingFiles(fileList) {
    const valid = Array.from(fileList).filter(f => f.type.startsWith('video/'));
    if (valid.length === 0) {
      showToast('❌ Please select valid video files (MP4, MOV, WebM).');
      return;
    }

    if (currentMode === 'video_prompt') {
      selectedFiles = [valid[0]];
    } else {
      selectedFiles = valid;
    }

    renderFilePreview();
    checkReadyToGenerate();
  }

  function renderFilePreview() {
    if (selectedFiles.length === 0) {
      dropZone.style.display = 'block';
      previewContainer.style.display = 'none';
      if (currentVideoObjectURL) {
        URL.revokeObjectURL(currentVideoObjectURL);
        currentVideoObjectURL = null;
      }
      return;
    }

    dropZone.style.display = 'none';
    previewContainer.style.display = 'flex';

    if (selectedFiles.length === 1) {
      const file = selectedFiles[0];
      previewCount.textContent = '1 Video Selected';
      videoMetaName.textContent = file.name;
      videoMetaSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      if (currentVideoObjectURL) {
        URL.revokeObjectURL(currentVideoObjectURL);
      }
      currentVideoObjectURL = URL.createObjectURL(file);
      videoPlayer.src = currentVideoObjectURL;

      singleVideoPreviewWrapper.style.display = 'block';
      multiVideoList.style.display = 'none';
    } else {
      previewCount.textContent = `${selectedFiles.length} Videos Ready for Analysis`;
      singleVideoPreviewWrapper.style.display = 'none';
      multiVideoList.style.display = 'grid';
      multiVideoList.innerHTML = '';

      selectedFiles.forEach((file, idx) => {
        const item = document.createElement('div');
        item.className = 'multi-video-item';
        item.innerHTML = `
          <span class="multi-video-name">📹 ${file.name}</span>
          <span class="multi-video-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        `;
        multiVideoList.appendChild(item);
      });
    }
  }

  clearFilesBtn.addEventListener('click', () => {
    selectedFiles = [];
    videoFileInput.value = '';
    renderFilePreview();
    checkReadyToGenerate();
  });

  function checkReadyToGenerate() {
    const hasFiles = selectedFiles.length > 0;
    const hasKey = storedApiKey && storedApiKey.trim().length > 10;
    
    // Check if server might have a fallback key
    generateBtn.disabled = !hasFiles;
    
    if (hasFiles && !hasKey) {
      apiWarningNote.style.display = 'block';
    } else {
      apiWarningNote.style.display = 'none';
    }
  }

  // ==========================================================
  // GENERATION & ANALYSIS PROCESS
  // ==========================================================
  
  generateBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    // UI state transitions
    generateBtn.disabled = true;
    resultCard.style.display = 'none';
    pipelineCard.style.display = 'flex';
    pipelineCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Step 1: Uploading
    setPipelineStep(1, 25, 'Uploading video to Gemini Cloud API...');

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('video', file);
    });
    formData.append('apiKey', storedApiKey);
    formData.append('mode', currentMode);

    // Simulated progress transitions
    const stepTimer1 = setTimeout(() => {
      setPipelineStep(2, 65, 'Inspecting video frames, lighting, camera angles...');
    }, 3000);

    const stepTimer2 = setTimeout(() => {
      setPipelineStep(3, 90, 'Synthesizing viral master prompt blueprint...');
    }, 12000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      setPipelineStep(3, 100, 'Master Prompt synthesized!');
      setTimeout(() => {
        pipelineCard.style.display = 'none';
        displayResult(data.master_prompt, data.mode);
      }, 600);

    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      pipelineCard.style.display = 'none';
      showToast('❌ ' + err.message);
      console.error(err);
      
      // If missing API key error, open modal automatically
      if (err.message.toLowerCase().includes('api key')) {
        apiModal.classList.add('show');
      }
    } finally {
      generateBtn.disabled = false;
    }
  });

  function setPipelineStep(stepNum, percent, statusText) {
    pipelineStatusText.textContent = statusText;
    progressBarFill.style.width = percent + '%';

    [stepUpload, stepProcess, stepFormat].forEach((el, index) => {
      if (index + 1 < stepNum) {
        el.className = 'pipeline-step done';
        el.querySelector('.step-status-icon').innerHTML = '✅';
      } else if (index + 1 === stepNum) {
        el.className = 'pipeline-step active';
        el.querySelector('.step-status-icon').innerHTML = '<div class="spinner-small"></div>';
      } else {
        el.className = 'pipeline-step';
        el.querySelector('.step-status-icon').innerHTML = '⏳';
      }
    });
  }

  // ==========================================================
  // RESULT DISPLAY & FORMATTING
  // ==========================================================
  
  function displayResult(promptText, mode) {
    currentPromptResult = promptText;
    rawPromptOutput.value = promptText;

    if (mode === 'master_prompt') {
      resultCardHeading.textContent = 'Viral Niche Master Prompt Template';
    } else {
      resultCardHeading.textContent = 'Exact Recreated Video Prompt';
    }

    // Format text: Highlight [Placeholders] and headers
    const formattedHTML = formatMasterPromptHTML(promptText);
    formattedPromptOutput.innerHTML = formattedHTML;

    resultCard.style.display = 'flex';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('✨ Master Prompt extracted successfully!');
  }

  const copyOnlyPromptBtn = document.getElementById('copyOnlyPromptBtn');
  
  function formatMasterPromptHTML(text) {
    // Clean raw text
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Format section banners (e.g. ===== TITLE =====)
    escaped = escaped.replace(/={5,}\s*([\s\S]*?)\s*={5,}/g, (match, p1) => {
      return `<div class="prompt-header-tag">${p1.trim()}</div>`;
    });

    // Format bold markdown (**text**)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Format bullet points (* or •)
    escaped = escaped.replace(/^[•*]\s*(.*?)$/gm, '<div class="bullet-line">👉 $1</div>');

    // Format [Bracketed Variables]
    escaped = escaped.replace(/\[([^[\]]+)\]/g, '<span class="prompt-var">[$1]</span>');

    return escaped;
  }

  // Helper to extract only the core prompt text from quotation marks
  function extractCorePrompt(fullText) {
    // If enclosed in quotes under THE MASTER PROMPT TEMPLATE
    const quoteMatch = fullText.match(/"([^"]{30,})"/s);
    if (quoteMatch && quoteMatch[1]) {
      return quoteMatch[1].trim();
    }
    // Check if there is a section for MASTER PROMPT
    const sectionMatch = fullText.match(/THE MASTER PROMPT TEMPLATE\s*=+\s*([\s\S]*?)(?:={5,}|$)/i);
    if (sectionMatch && sectionMatch[1]) {
      return sectionMatch[1].replace(/["']/g, '').replace(/\*\*/g, '').trim();
    }
    // Otherwise clean asterisks
    return fullText.replace(/\*\*/g, '').trim();
  }

  // Tabs toggle
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      if (targetTab === 'formatted') {
        document.getElementById('tabFormatted').classList.add('active');
      } else {
        document.getElementById('tabRaw').classList.add('active');
      }
    });
  });

  // Copy Prompt Only (Clean text for Sora/Runway/Kling)
  if (copyOnlyPromptBtn) {
    copyOnlyPromptBtn.addEventListener('click', () => {
      if (!currentPromptResult) return;
      const cleanPrompt = extractCorePrompt(currentPromptResult);
      navigator.clipboard.writeText(cleanPrompt).then(() => {
        showToast('⚡ Copied Clean Prompt (Ready for Sora/Runway)!');
        copyOnlyPromptBtn.innerHTML = '<span class="action-icon">✅</span><span class="action-text">Copied!</span>';
        setTimeout(() => {
          copyOnlyPromptBtn.innerHTML = '<span class="action-icon">⚡</span><span class="action-text">Copy Prompt Only</span>';
        }, 2500);
      }).catch(() => {
        showToast('❌ Unable to copy');
      });
    });
  }

  // Copy Full Report
  copyResultBtn.addEventListener('click', () => {
    if (!currentPromptResult) return;
    const cleanFullReport = currentPromptResult.replace(/\*\*/g, '');
    navigator.clipboard.writeText(cleanFullReport).then(() => {
      showToast('📋 Copied Full Analysis Report!');
      copyResultBtn.innerHTML = '<span class="action-icon">✅</span><span class="action-text">Copied!</span>';
      setTimeout(() => {
        copyResultBtn.innerHTML = '<span class="action-icon">📋</span><span class="action-text">Copy Full Report</span>';
      }, 2500);
    }).catch(() => {
      showToast('❌ Unable to copy');
    });
  });

  // Download .TXT
  downloadResultBtn.addEventListener('click', () => {
    if (!currentPromptResult) return;
    const cleanFullReport = currentPromptResult.replace(/\*\*/g, '');
    const blob = new Blob([cleanFullReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Prompt_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 Prompt downloaded as text file!');
  });

  newAnalysisBtn.addEventListener('click', () => {
    clearFilesBtn.click();
    resultCard.style.display = 'none';
    window.scrollTo({ top: 300, behavior: 'smooth' });
  });

  // ==========================================================
  // PRESETS SHOWCASE DEMO
  // ==========================================================
  
  const samplePresets = [
    {
      title: "🏎️ Luxury Supercar Glide",
      mode: "video_prompt",
      prompt: `A cinematic 8K photorealistic night tracking shot of a metallic obsidian [Vehicle / Supercar model] cruising slowly along rain-slicked Tokyo asphalt. Neon signs in vivid cyan and magenta reflect crisply in the wet street and curved car panels. The camera glides from a low three-quarter front angle, smoothly orbiting around to the rear taillights as volumetric smoke curls from the exhaust pipes. Cinematic shallow depth of field, anamorphic 35mm lens flares, 60fps ultra-smooth motion.`
    },
    {
      title: "🧠 Dark Psychology Shadow Reel",
      mode: "master_prompt",
      prompt: `=========================================
🔥 NICHE & VIRAL FORMULA ANALYSIS
=========================================
* **Target Niche**: Dark Psychology / Mindset Reels
* **Hook Strategy**: High-contrast silhouette stepping out of shadow in 0.5 seconds with intense eye contact
* **Visual Theme & Color Palette**: Desaturated obsidian, cold blue rim light, volumetric dust particles
* **Camera & Editing Pace**: Fast push-in zoom with subtle handheld jitter

=========================================
🧠 THE MASTER PROMPT TEMPLATE
=========================================
"Cinematic 4k dramatic portrait video of [Subject: e.g. a stoic businessman in tailored black trenchcoat] stepping forward from deep shadows into a single harsh [Lighting style: e.g. icy blue overhead spotlight]. The camera executes a [Camera Movement: e.g. tense dolly zoom / vertigo effect] focusing on [Focal Detail: e.g. piercing focused eyes]. The background features [Atmosphere: e.g. floating smoky haze in a dark brutalist concrete room]. 24fps film noir aesthetic, photorealistic texture."

=========================================
🛠️ HOW TO USE THIS MASTER PROMPT
=========================================
1. Replace [Subject] with any archetypal character (Warrior, Thinker, CEO, Mystery figure).
2. Use strong contrasting single light sources (Crimson, Ice Blue, Gold) for maximum TikTok/Reels scroll-stopping power.`
    },
    {
      title: "💻 Futuristic Holographic Showcase",
      mode: "video_prompt",
      prompt: `Hyper-futuristic product showcase of a floating translucent [Tech Device: e.g. quantum neural phone], hovering in mid-air. Glowing neon teal and purple circuit diagrams project outward in 3D holographic layers. The camera does a slow macro 360-degree orbital rotation with smooth rotational parallax. Clean minimalist cyberpunk laboratory backdrop, soft diffused white studio lighting, 8k resolution, Unreal Engine 5 render style.`
    }
  ];

  window.showPreset = function(index) {
    const preset = samplePresets[index];
    if (preset) {
      displayResult(preset.prompt, preset.mode);
      showToast(`✨ Loaded Preset: ${preset.title}`);
    }
  };

  // ==========================================================
  // TOAST UTILITY
  // ==========================================================
  
  function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    if (msg.startsWith('✅') || msg.startsWith('✨') || msg.startsWith('📋') || msg.startsWith('💾')) {
      toastIcon.textContent = msg.slice(0, 2);
      toastMsg.textContent = msg.slice(2).trim();
    } else if (msg.startsWith('❌')) {
      toastIcon.textContent = '❌';
      toastMsg.textContent = msg.slice(2).trim();
    } else {
      toastIcon.textContent = 'ℹ️';
      toastMsg.textContent = msg;
    }

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
});
