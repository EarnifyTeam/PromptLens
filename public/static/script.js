// ==========================================================
// PROMPTLENS BY BORNALABS - JAVASCRIPT CLIENT CONTROLLER
// Direct Gemini Vision 3.6 API + Hybrid Cloud Backend Fallback
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
  const copyOnlyPromptBtn = document.getElementById('copyOnlyPromptBtn');
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

  // Prompts definition
  const VIDEO_PROMPT_TEMPLATE = `You are an expert AI Video Engineer and Prompt Engineer. Your task is to analyze the uploaded video(s) in detail and reverse-engineer a highly optimized, descriptive text-to-video prompt. This prompt should allow text-to-video AI generators (like Sora, Runway Gen-3, Kling AI, Luma Dream Machine, Pika) to recreate the exact visual style, setting, and motion of the input video.

Analyze the video and describe:
1. Subject Details: Physical appearance, age, clothing, facial expression, and posture.
2. Environment & Setting: Background details, location, time of day, atmospheric conditions, color palette, and lighting (e.g., cinematic, dramatic, soft, neon-lit, volumetric).
3. Camera Work: Camera angle (e.g., close-up, wide shot, drone view), movement (e.g., slow pan, dynamic zoom, tracking shot, hand-held jitter), depth of field, and camera lens style.
4. Motion & Action: Precise sequence of movements, transitions, pacing, and actions happening in the scene.
5. Aesthetic & Quality: Visual style (e.g., hyper-realistic, 8k, cinematic film grain, 3D render, anime, vaporwave), texture, and overall vibe.

Combine these elements into a single, cohesive, and highly detailed paragraph that starts directly with the description, ready to be copied and pasted into a text-to-video model. Do not include asterisks (**) or markdown formatting in the prompt text itself. Do not include any intro or outro text, only the prompt itself.`;

  const MASTER_PROMPT_TEMPLATE = `You are a world-class Viral Short-Form Video Producer and prompt engineering expert. Your task is to analyze the uploaded video(s) and reverse-engineer the underlying creative blueprint, style guide, and viral pattern. 

Based on this analysis, you will output a "Niche Master Prompt". This master prompt should act as a reusable template (using variables/brackets like [Insert Subject], [Insert Action], etc.) so that the user can plug in their own ideas and generate new viral videos that maintain the exact same aesthetic quality, camera style, pacing, and vibe as the source video(s).

IMPORTANT FORMATTING RULE: 
Do not use markdown bold asterisks (**) anywhere in your response. Use clean plain text headers and labels instead.

Analyze the input video(s) and provide the result in the following exact structured format:

=========================================
🔥 NICHE & VIRAL FORMULA ANALYSIS
=========================================
• Target Niche: [Identify the specific niche, e.g., Luxury Travel, Dark Psychology, Tech Mockups, Motivation]
• Hook Strategy: [What makes the video immediately engaging in the first 2 seconds?]
• Visual Theme & Color Palette: [Describe the signature look, colors, and lighting style]
• Camera & Editing Pace: [Analyze the camera angles, movements, and pacing/cut frequency]

=========================================
🧠 THE MASTER PROMPT TEMPLATE
=========================================
Write a structured, variable-based master prompt enclosed in quotation marks that the user can directly copy and customize. Ensure every customizable element is in [Bracketed Placeholders].

"A [cinematic style / resolution] video of [Subject Description: e.g., a modern workspace], [Lighting style: e.g., dramatic neon light leaking through blinds]. The camera does a [Camera Movement: e.g., slow macro tracking shot] showcasing [Focal Point: e.g., futuristic gadgets on the desk]. The mood is [Vibe/Atmosphere: e.g., focused, lo-fi cyberpunk]. [Editing style / Motion details: e.g., high frame rate, slow-motion dust particles floating]."

=========================================
🛠️ HOW TO USE THIS MASTER PROMPT
=========================================
• Tip 1: Provide quick tip on what inputs work best in the placeholders.
• Tip 2: Provide advice on lighting/pacing to maintain viral appeal.`;

  // ==========================================================
  // API KEY INITIALIZATION & MODAL
  // ==========================================================
  
  function updateApiKeyUI() {
    if (storedApiKey && storedApiKey.trim().length > 10) {
      if (keyIndicatorDot) keyIndicatorDot.classList.add('configured');
      if (apiKeyStatusLabel) apiKeyStatusLabel.textContent = 'API Key (Set)';
      if (apiWarningNote) apiWarningNote.style.display = 'none';
      if (apiKeyInputModal) apiKeyInputModal.value = storedApiKey;
    } else {
      if (keyIndicatorDot) keyIndicatorDot.classList.remove('configured');
      if (apiKeyStatusLabel) apiKeyStatusLabel.textContent = 'Set API Key';
      if (apiKeyInputModal) apiKeyInputModal.value = '';
    }
    checkReadyToGenerate();
  }

  updateApiKeyUI();

  if (openApiModalBtn) {
    openApiModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      apiKeyInputModal.value = storedApiKey;
      apiKeyTestStatus.style.display = 'none';
      apiModal.classList.add('show');
    });
  }

  if (footerApiBtn) {
    footerApiBtn.addEventListener('click', (e) => {
      e.preventDefault();
      apiKeyInputModal.value = storedApiKey;
      apiKeyTestStatus.style.display = 'none';
      apiModal.classList.add('show');
    });
  }

  if (closeApiModalBtn) {
    closeApiModalBtn.addEventListener('click', () => {
      apiModal.classList.remove('show');
    });
  }

  if (apiModal) {
    apiModal.addEventListener('click', (e) => {
      if (e.target === apiModal) {
        apiModal.classList.remove('show');
      }
    });
  }

  if (toggleApiKeyVisibility) {
    toggleApiKeyVisibility.addEventListener('click', () => {
      if (apiKeyInputModal.type === 'password') {
        apiKeyInputModal.type = 'text';
        toggleApiKeyVisibility.textContent = '🙈';
      } else {
        apiKeyInputModal.type = 'password';
        toggleApiKeyVisibility.textContent = '👁️';
      }
    });
  }

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
      const key = apiKeyInputModal.value.trim();
      if (key) {
        localStorage.setItem('gemini_api_key', key);
        storedApiKey = key;
        showToast('✅ Gemini API Key saved securely!');
      } else {
        localStorage.removeItem('gemini_api_key');
        storedApiKey = '';
        showToast('ℹ️ API Key cleared.');
      }
      updateApiKeyUI();
      apiModal.classList.remove('show');
    });
  }

  // DIRECT CLIENT-SIDE API KEY TEST
  if (testApiKeyBtn) {
    testApiKeyBtn.addEventListener('click', async () => {
      const keyToTest = (apiKeyInputModal.value.trim() || storedApiKey).trim();
      if (!keyToTest) {
        showTestStatus('error', '❌ Please enter an API key to test.');
        return;
      }

      testApiKeyBtn.disabled = true;
      testApiKeyBtn.textContent = 'Testing connection...';
      apiKeyTestStatus.style.display = 'none';

      try {
        // Direct test call to Google Gemini API
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(keyToTest)}`;
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }]
          })
        });

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates.length > 0) {
          showTestStatus('success', '✅ Gemini Connection Successful! Model: gemini-3.6-flash is ready.');
          localStorage.setItem('gemini_api_key', keyToTest);
          storedApiKey = keyToTest;
          updateApiKeyUI();
        } else {
          const errMsg = (data.error && data.error.message) || 'Invalid API Key or quota exhausted.';
          showTestStatus('error', '❌ ' + errMsg);
        }
      } catch (err) {
        showTestStatus('error', '❌ Network error connecting to Google Gemini API.');
      } finally {
        testApiKeyBtn.disabled = false;
        testApiKeyBtn.textContent = '⚡ Test Connection';
      }
    });
  }

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
      if (selectedFiles.length > 1 && currentMode === 'video_prompt') {
        selectedFiles = [selectedFiles[0]];
        renderFilePreview();
      }
    });
  });

  // ==========================================================
  // DRAG & DROP & FILE HANDLING
  // ==========================================================
  
  if (dropZone) {
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
  }

  if (videoFileInput) {
    videoFileInput.addEventListener('change', () => {
      if (videoFileInput.files && videoFileInput.files.length > 0) {
        handleIncomingFiles(videoFileInput.files);
      }
    });
  }

  function handleIncomingFiles(fileList) {
    const valid = Array.from(fileList).filter(f => f.type.startsWith('video/') || f.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i));
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

      selectedFiles.forEach((file) => {
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

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener('click', () => {
      selectedFiles = [];
      videoFileInput.value = '';
      renderFilePreview();
      checkReadyToGenerate();
    });
  }

  function checkReadyToGenerate() {
    const hasFiles = selectedFiles.length > 0;
    const hasKey = storedApiKey && storedApiKey.trim().length > 10;
    
    if (generateBtn) {
      generateBtn.disabled = !hasFiles;
    }
    
    if (apiWarningNote) {
      if (hasFiles && !hasKey) {
        apiWarningNote.style.display = 'block';
      } else {
        apiWarningNote.style.display = 'none';
      }
    }
  }

  // ==========================================================
  // DIRECT CLOUD / GEMINI GENERATION PIPELINE
  // ==========================================================
  
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      if (selectedFiles.length === 0) return;

      const apiKey = (storedApiKey || '').trim();
      if (!apiKey) {
        apiModal.classList.add('show');
        showToast('🔑 Please enter your Gemini API Key first.');
        return;
      }

      // UI Transitions
      generateBtn.disabled = true;
      resultCard.style.display = 'none';
      pipelineCard.style.display = 'flex';
      pipelineCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      try {
        // Run Direct Browser-to-Gemini Vision Pipeline (Zero Vercel Timeout Risk)
        const promptResult = await runDirectGeminiVisionAnalysis(selectedFiles, apiKey, currentMode);
        
        setPipelineStep(3, 100, 'Master Prompt synthesized!');
        setTimeout(() => {
          pipelineCard.style.display = 'none';
          displayResult(promptResult, currentMode);
        }, 500);

      } catch (err) {
        console.error('Direct Gemini error:', err);
        
        // Try Backend Fallback if Direct fails
        try {
          setPipelineStep(2, 60, 'Trying secondary cloud pipeline...');
          const fallbackResult = await runBackendFallbackAnalysis(selectedFiles, apiKey, currentMode);
          pipelineCard.style.display = 'none';
          displayResult(fallbackResult, currentMode);
        } catch (fallbackErr) {
          pipelineCard.style.display = 'none';
          showToast('❌ ' + (err.message || fallbackErr.message || 'Analysis failed.'));
          if (err.message && err.message.toLowerCase().includes('api key')) {
            apiModal.classList.add('show');
          }
        }
      } finally {
        generateBtn.disabled = false;
      }
    });
  }

  // DIRECT BROWSER GEMINI VISION PIPELINE
  async function runDirectGeminiVisionAnalysis(files, apiKey, mode) {
    setPipelineStep(1, 25, 'Uploading video clip directly to Gemini Cloud...');
    
    const uploadedFileURIs = [];
    const fileResourceNames = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setPipelineStep(1, 30 + (i * 15), `Uploading Video ${i + 1}/${files.length} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

      // 1. Initiate Resumable Upload
      const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(apiKey)}`;
      const initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': file.size.toString(),
          'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file: { display_name: file.name }
        })
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error((errorData.error && errorData.error.message) || 'Failed to initiate Gemini video upload.');
      }

      const uploadUrl = initResponse.headers.get('X-Goog-Upload-URL');
      if (!uploadUrl) {
        throw new Error('Upload URL not received from Gemini.');
      }

      // 2. Upload Binary Data
      setPipelineStep(1, 45, `Transferring video frames to Gemini AI...`);
      const uploadBinaryResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Command': 'upload, finalize',
          'X-Goog-Upload-Offset': '0',
          'Content-Length': file.size.toString(),
          'Content-Type': file.type || 'video/mp4'
        },
        body: file
      });

      const uploadData = await uploadBinaryResponse.json();
      if (!uploadBinaryResponse.ok || !uploadData.file) {
        throw new Error((uploadData.error && uploadData.error.message) || 'Failed to complete video upload.');
      }

      const fileResource = uploadData.file;
      fileResourceNames.push(fileResource.name);

      // 3. Poll file state until ACTIVE
      setPipelineStep(2, 65, `Neural analysis of video motion and frames...`);
      let isActive = false;
      let attempts = 0;
      
      while (!isActive && attempts < 40) {
        attempts++;
        await new Promise(r => setTimeout(r, 3000));
        
        const stateUrl = `https://generativelanguage.googleapis.com/v1beta/${fileResource.name}?key=${encodeURIComponent(apiKey)}`;
        const stateResponse = await fetch(stateUrl);
        const stateData = await stateResponse.json();

        if (stateData.state === 'ACTIVE') {
          isActive = true;
          uploadedFileURIs.push(stateData.uri);
          break;
        } else if (stateData.state === 'FAILED') {
          throw new Error('Gemini vision engine failed to parse this video format.');
        }
      }

      if (!isActive) {
        throw new Error('Video processing timed out on Gemini AI servers.');
      }
    }

    // 4. Generate Content using Gemini 3.6 Flash
    setPipelineStep(3, 90, 'Synthesizing viral master prompt template...');
    const selectedSystemPrompt = (mode === 'master_prompt') ? MASTER_PROMPT_TEMPLATE : VIDEO_PROMPT_TEMPLATE;

    const parts = [
      ...uploadedFileURIs.map(uri => ({ file_data: { mime_type: 'video/mp4', file_uri: uri } })),
      { text: selectedSystemPrompt }
    ];

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const genResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      })
    });

    const genData = await genResponse.json();

    // 5. Cleanup files from Gemini Cloud asynchronously
    fileResourceNames.forEach(resourceName => {
      fetch(`https://generativelanguage.googleapis.com/v1beta/${resourceName}?key=${encodeURIComponent(apiKey)}`, {
        method: 'DELETE'
      }).catch(() => {});
    });

    if (!genResponse.ok) {
      throw new Error((genData.error && genData.error.message) || 'Gemini prompt generation failed.');
    }

    const candidate = genData.candidates && genData.candidates[0];
    const textOutput = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;

    if (!textOutput) {
      throw new Error('Empty response received from Gemini.');
    }

    return textOutput;
  }

  // BACKEND FALLBACK
  async function runBackendFallbackAnalysis(files, apiKey, mode) {
    const formData = new FormData();
    files.forEach(file => formData.append('video', file));
    formData.append('apiKey', apiKey);
    formData.append('mode', mode);

    const endpoints = ['/api/analyze', '/analyze'];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { method: 'POST', body: formData });
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (response.ok && data.master_prompt) {
            return data.master_prompt;
          }
          throw new Error(data.error || 'Backend analysis failed');
        }
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError || new Error('Unable to connect to backend.');
  }

  function setPipelineStep(stepNum, percent, statusText) {
    if (pipelineStatusText) pipelineStatusText.textContent = statusText;
    if (progressBarFill) progressBarFill.style.width = percent + '%';

    [stepUpload, stepProcess, stepFormat].forEach((el, index) => {
      if (!el) return;
      if (index + 1 < stepNum) {
        el.className = 'pipeline-step done';
        const icon = el.querySelector('.step-status-icon');
        if (icon) icon.innerHTML = '✅';
      } else if (index + 1 === stepNum) {
        el.className = 'pipeline-step active';
        const icon = el.querySelector('.step-status-icon');
        if (icon) icon.innerHTML = '<div class="spinner-small"></div>';
      } else {
        el.className = 'pipeline-step';
        const icon = el.querySelector('.step-status-icon');
        if (icon) icon.innerHTML = '⏳';
      }
    });
  }

  // ==========================================================
  // RESULT DISPLAY & FORMATTING
  // ==========================================================
  
  function displayResult(promptText, mode) {
    currentPromptResult = promptText;
    if (rawPromptOutput) rawPromptOutput.value = promptText;

    if (resultCardHeading) {
      if (mode === 'master_prompt') {
        resultCardHeading.textContent = 'Viral Niche Master Prompt Template';
      } else {
        resultCardHeading.textContent = 'Exact Recreated Video Prompt';
      }
    }

    if (formattedPromptOutput) {
      const formattedHTML = formatMasterPromptHTML(promptText);
      formattedPromptOutput.innerHTML = formattedHTML;
    }

    if (resultCard) {
      resultCard.style.display = 'flex';
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showToast('✨ Master Prompt extracted successfully!');
  }

  function formatMasterPromptHTML(text) {
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    escaped = escaped.replace(/={5,}\s*([\s\S]*?)\s*={5,}/g, (match, p1) => {
      return `<div class="prompt-header-tag">${p1.trim()}</div>`;
    });

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/^[•*]\s*(.*?)$/gm, '<div class="bullet-line">👉 $1</div>');
    escaped = escaped.replace(/\[([^[\]]+)\]/g, '<span class="prompt-var">[$1]</span>');

    return escaped;
  }

  function extractCorePrompt(fullText) {
    const quoteMatch = fullText.match(/"([^"]{30,})"/s);
    if (quoteMatch && quoteMatch[1]) {
      return quoteMatch[1].trim();
    }
    const sectionMatch = fullText.match(/THE MASTER PROMPT TEMPLATE\s*=+\s*([\s\S]*?)(?:={5,}|$)/i);
    if (sectionMatch && sectionMatch[1]) {
      return sectionMatch[1].replace(/["']/g, '').replace(/\*\*/g, '').trim();
    }
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

  // Copy Prompt Only
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
  if (copyResultBtn) {
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
  }

  // Download .TXT
  if (downloadResultBtn) {
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
  }

  if (newAnalysisBtn) {
    newAnalysisBtn.addEventListener('click', () => {
      if (clearFilesBtn) clearFilesBtn.click();
      if (resultCard) resultCard.style.display = 'none';
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }

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
• Target Niche: Dark Psychology / Mindset Reels
• Hook Strategy: High-contrast silhouette stepping out of shadow in 0.5 seconds with intense eye contact
• Visual Theme & Color Palette: Desaturated obsidian, cold blue rim light, volumetric dust particles
• Camera & Editing Pace: Fast push-in zoom with subtle handheld jitter

=========================================
🧠 THE MASTER PROMPT TEMPLATE
=========================================
"Cinematic 4k dramatic portrait video of [Subject: e.g. a stoic businessman in tailored black trenchcoat] stepping forward from deep shadows into a single harsh [Lighting style: e.g. icy blue overhead spotlight]. The camera executes a [Camera Movement: e.g. tense dolly zoom / vertigo effect] focusing on [Focal Detail: e.g. piercing focused eyes]. The background features [Atmosphere: e.g. floating smoky haze in a dark brutalist concrete room]. 24fps film noir aesthetic, photorealistic texture."

=========================================
🛠️ HOW TO USE THIS MASTER PROMPT
=========================================
• Tip 1: Replace [Subject] with any archetypal character (Warrior, Thinker, CEO, Mystery figure).
• Tip 2: Use strong contrasting single light sources (Crimson, Ice Blue, Gold) for maximum TikTok/Reels scroll-stopping power.`
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
    if (!toast) return;
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    if (msg.startsWith('✅') || msg.startsWith('✨') || msg.startsWith('📋') || msg.startsWith('💾') || msg.startsWith('⚡')) {
      if (toastIcon) toastIcon.textContent = msg.slice(0, 2);
      if (toastMsg) toastMsg.textContent = msg.slice(2).trim();
    } else if (msg.startsWith('❌')) {
      if (toastIcon) toastIcon.textContent = '❌';
      if (toastMsg) toastMsg.textContent = msg.slice(2).trim();
    } else {
      if (toastIcon) toastIcon.textContent = 'ℹ️';
      if (toastMsg) toastMsg.textContent = msg;
    }

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
});
