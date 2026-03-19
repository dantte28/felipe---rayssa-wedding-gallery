const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxk8N0MxJDMUZmQcuPD7QvQfPd26afFTSLCcASG5E03zeCXAh4fx1L1I3sBlklT3DVF/exec';

window.onerror = function(msg) {
    alert("Erro JS: " + msg);
};

document.addEventListener('DOMContentLoaded', () => {
    function showToast(message, success = true) {
        const toast = document.getElementById('toast');

        if (!toast) {
            alert(message); // fallback
            return;
        }

        toast.textContent = message;
        toast.style.background = success ? '#4CAF50' : '#E74C3C';

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    const uploadBtn = document.getElementById('showUpload');
    const galleryBtn = document.getElementById('showGallery');
    const uploadSection = document.getElementById('uploadSection');
    const gallerySection = document.getElementById('gallerySection');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('photoInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.querySelector('.preview-container');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const closeModal = document.querySelector('.close-modal');

    // Navigation
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        uploadSection.classList.add('active');
        gallerySection.classList.remove('active');
        uploadBtn.classList.add('btn-primary');
        uploadBtn.classList.remove('btn-secondary');
        galleryBtn.classList.add('btn-secondary');
        galleryBtn.classList.remove('btn-primary');
    });

    galleryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        gallerySection.classList.add('active');
        uploadSection.classList.remove('active');
        galleryBtn.classList.add('btn-primary');
        galleryBtn.classList.remove('btn-secondary');
        uploadBtn.classList.add('btn-secondary');
        uploadBtn.classList.remove('btn-primary');
        loadGallery();
    });

    // File Preview
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;

        if (!files.length) {
            showToast('Selecione pelo menos uma foto', false);
            previewContainer.style.display = 'none';
            return;
        }

        console.log("Arquivos selecionados:", files);
        imagePreview.src = URL.createObjectURL(files[0]);
        previewContainer.style.display = 'block';
    });

    // Form Submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const files = fileInput.files;
        const name = document.getElementById('nameInput').value || 'Convidado';

        if (!files.length) {
            showToast('Selecione pelo menos uma foto', false);
            return;
        }

        loadingOverlay.style.display = 'flex';

        try {
            for (let file of files) {
                const base64 = await compressImage(file);
                const payload = {
                    image: base64.split(',')[1],
                    mimeType: 'image/jpeg',
                    name: name,
                    filename: file.name
                };

                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload)
                });
            }

            showToast('Fotos enviadas com sucesso! 📸', true);

            uploadForm.reset();
            previewContainer.style.display = 'none';
            fileInput.value = "";

            galleryBtn.click();
        } catch (error) {
            console.error(error);
            showToast('Erro ao enviar 😢', false);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });

    // Gallery Loading
    async function loadGallery() {
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Carregando galeria...</p>';

        try {
            // Apps Script doGet usually handles listing
            const response = await fetch(`${SCRIPT_URL}?action=getPhotos`);
            const data = await response.json();

            grid.innerHTML = '';

            if (data.photos && data.photos.length > 0) {
                data.photos.forEach(photo => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.innerHTML = `
                        <img src="${photo.url}" alt="Foto de ${photo.name}" loading="lazy">
                        <div class="overlay">
                            <span class="author-name">Por: ${photo.name}</span>
                        </div>
                    `;
                    item.addEventListener('click', () => {
                        modalImg.src = photo.url;
                        modal.style.display = 'flex';
                    });
                    grid.appendChild(item);
                });
            } else {
                grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Nenhuma foto ainda. Seja o primeiro a enviar!</p>';
            }
        } catch (error) {
            console.error('Gallery error:', error);
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Erro ao carregar a galeria.</p>';
        }
    }

    // Modal Close
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Helper: Compress Image
    const compressImage = file => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = error => {
            URL.revokeObjectURL(img.src);
            reject(error);
        };
        img.src = URL.createObjectURL(file);
    });

    // Initial Load
    // loadGallery(); // Optional: load on start
});
