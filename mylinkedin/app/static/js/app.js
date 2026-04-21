// Image upload preview
const fileInput = document.getElementById('images');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreview = document.getElementById('imagePreview');

if (fileInput) {
  fileInput.addEventListener('change', function () {
    const files = Array.from(this.files);
    if (!files.length) return;

    imagePreview.innerHTML = '';
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;
        imagePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });

    uploadPlaceholder.classList.add('hidden');
    imagePreview.classList.remove('hidden');
  });
}

// Form submit loading state
const postForm = document.getElementById('postForm');
if (postForm) {
  postForm.addEventListener('submit', function () {
    const btn = document.getElementById('submitBtn');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-loading').classList.remove('hidden');
    btn.disabled = true;
  });
}

// Drag-and-drop
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0A66C2';
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
  });
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });
}
