document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('imageForm');
  const promptInput = document.getElementById('prompt');
  const styleSelect = document.getElementById('style');
  const generateBtn = document.getElementById('generateBtn');
  const imageContainer = document.getElementById('imageContainer');
  const placeholderContent = document.getElementById('placeholderContent');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const generatedImage = document.getElementById('generatedImage');
  const downloadContainer = document.getElementById('downloadContainer');
  const downloadBtn = document.getElementById('downloadBtn');
  const suggestionButtons = document.querySelectorAll('.button-suggestion');
  const toastContainer = document.getElementById('toastContainer');

  form.addEventListener('submit', handleFormSubmit);
  downloadBtn.addEventListener('click', handleDownload);

  suggestionButtons.forEach(button => {
    button.addEventListener('click', () => {
      promptInput.value = button.textContent;
      generateImage(button.textContent);
    });
  });

  function handleFormSubmit(e) {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showToast('Empty prompt', 'Please enter a description for your image', 'error');
      return;
    }
    generateImage(prompt, styleSelect.value);
  }

  async function generateImage(prompt, style = '') {
    setLoadingState(true);

    try {
      const response = await fetchGeneratedImage(prompt, style);
      generatedImage.src = response.url;

      generatedImage.onload = function() {
        setLoadingState(false);
        generatedImage.classList.remove('hidden');
        downloadContainer.classList.remove('hidden');
        showToast('Image generated!', 'Your image was created successfully.');
      };

      generatedImage.onerror = function() {
        setLoadingState(false);
        placeholderContent.classList.remove('hidden');
        showToast('Failed to load image', 'The image could not be loaded. Please try again.', 'error');
      };
    } catch (error) {
      console.error('Error generating image:', error);
      setLoadingState(false);
      placeholderContent.classList.remove('hidden');
      showToast('Generation failed', 'There was an error generating your image. Please try again.', 'error');
    }
  }

  function setLoadingState(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.innerHTML = isLoading
      ? '<svg class="icon animate-spin" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" fill="none" stroke-width="4" stroke="currentColor" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"/></svg> Generating...'
      : 'Generate Image';

    placeholderContent.classList.toggle('hidden', isLoading);
    loadingIndicator.classList.toggle('hidden', !isLoading);
    generatedImage.classList.add('hidden');
    downloadContainer.classList.add('hidden');
  }

  function handleDownload() {
    if (!generatedImage.src) return;

    const link = document.createElement('a');
    link.href = generatedImage.src;
    link.download = `dreamlab-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showToast(title, description, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div>
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(1rem)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 5000);
  }
  async function fetchGeneratedImage(prompt, style) {
    try {
      const fullPrompt = style ? `${prompt}, ${style} style` : prompt;

      const response = await fetch("http://localhost:5000/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);

      const imageData = result;

      if (!imageData?.url) {
        throw new Error("No image URL found in response.");
      }

      return {
        url: imageData.url,
        prompt: fullPrompt,
      };
    } catch (error) {
      console.error("Error with backend API:", error);

      return {
        url: `https://source.unsplash.com/random/1024x1024/?${encodeURIComponent(prompt)}`,
        prompt,
      };
    }
  }
});
