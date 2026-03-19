const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxk8N0MxJDMUZmQcuPD7QvQfPd26afFTSLCcASG5E03zeCXAh4fx1L1I3sBlklT3DVF/exec';

document.addEventListener('DOMContentLoaded', function() {
    function showToast(message, success) {
        if (success === undefined) success = true;
        var toast = document.getElementById('toast');

        if (!toast) {
            alert(message); // fallback
            return;
        }

        toast.textContent = message;
        toast.style.background = success ? '#4CAF50' : '#E74C3C';
        toast.classList.add('show');

        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }

    var uploadBtn = document.getElementById('showUpload');
    var galleryBtn = document.getElementById('showGallery');
    var uploadSection = document.getElementById('uploadSection');
    var gallerySection = document.getElementById('gallerySection');
    var uploadForm = document.getElementById('uploadForm');
    var fileInput = document.getElementById('photoInput');
    var imagePreview = document.getElementById('imagePreview');
    var previewContainer = document.querySelector('.preview-container');
    var loadingOverlay = document.getElementById('loadingOverlay');
    var modal = document.getElementById('imageModal');
    var modalImg = document.getElementById('modalImg');
    var closeModal = document.querySelector('.close-modal');

    // Navigation
    uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        uploadSection.classList.add('active');
        gallerySection.classList.remove('active');
        uploadBtn.classList.add('btn-primary');
        uploadBtn.classList.remove('btn-secondary');
        galleryBtn.classList.add('btn-secondary');
        galleryBtn.classList.remove('btn-primary');
    });

    galleryBtn.addEventListener('click', function(e) {
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
    fileInput.addEventListener('change', function(e) {
        var files = e.target.files;

        if (!files || files.length === 0) {
            showToast('Selecione pelo menos uma foto', false);
            previewContainer.style.display = 'none';
            return;
        }

        imagePreview.src = URL.createObjectURL(files[0]);
        previewContainer.style.display = 'block';
    });

    // Form Submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var files = fileInput.files;
        var nameInput = document.getElementById('nameInput');
        var name = (nameInput && nameInput.value) ? nameInput.value : 'Convidado';

        if (!files || files.length === 0) {
            showToast('Selecione pelo menos uma foto', false);
            return;
        }

        loadingOverlay.style.display = 'flex';

        var uploads = [];
        for (var i = 0; i < files.length; i++) {
            (function(file) {
                var p = compressImage(file).then(function(base64) {
                    var payload = {
                        image: base64.split(',')[1],
                        mimeType: 'image/jpeg',
                        name: name,
                        filename: file.name
                    };

                    return fetch(SCRIPT_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        body: JSON.stringify(payload)
                    });
                });
                uploads.push(p);
            })(files[i]);
        }

        Promise.all(uploads).then(function() {
            showToast('Fotos enviadas com sucesso! 📸', true);
            uploadForm.reset();
            previewContainer.style.display = 'none';
            fileInput.value = "";
            galleryBtn.click();
        }).catch(function(error) {
            console.error(error);
            showToast('Erro ao enviar 😢', false);
        }).finally(function() {
            loadingOverlay.style.display = 'none';
        });
    });

    // Gallery Loading
    function loadGallery() {
        var grid = document.getElementById('galleryGrid');
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Carregando galeria...</p>';

        fetch(SCRIPT_URL + '?action=getPhotos')
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                grid.innerHTML = '';

                if (data && data.photos && data.photos.length > 0) {
                    for (var i = 0; i < data.photos.length; i++) {
                        var photo = data.photos[i];
                        var item = document.createElement('div');
                        item.className = 'gallery-item';
                        item.innerHTML = '<img src="' + photo.url + '" alt="Foto" loading="lazy">' +
                                         '<div class="overlay">' +
                                             '<span class="author-name">Por: ' + photo.name + '</span>' +
                                         '</div>';
                        
                        (function(imgUrl) {
                            item.addEventListener('click', function() {
                                modalImg.src = imgUrl;
                                modal.style.display = 'flex';
                            });
                        })(photo.url);

                        grid.appendChild(item);
                    }
                } else {
                    grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Nenhuma foto ainda. Seja o primeiro a enviar!</p>';
                }
            })
            .catch(function(error) {
                console.error('Gallery error:', error);
                grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Erro ao carregar a galeria.</p>';
            });
    }

    // Modal Close
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Helper: Compress Image
    function compressImage(file) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(img.src);
                var canvas = document.createElement('canvas');
                var MAX_WIDTH = 1200;
                var MAX_HEIGHT = 1200;
                var width = img.width;
                var height = img.height;

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
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = function(error) {
                URL.revokeObjectURL(img.src);
                reject(error);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // Retirado o erro global para HTML
});
