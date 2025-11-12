// Carousel Gallery - Drag functionality and Lightbox
(function() {
    'use strict';

    // Lightbox HTML
    const lightboxHTML = `
        <div id="certificate-lightbox" class="certificate-lightbox">
            <div class="lightbox-overlay"></div>
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <button class="lightbox-prev" aria-label="Previous">&larr;</button>
                <button class="lightbox-next" aria-label="Next">&rarr;</button>
                <div class="lightbox-image-container">
                    <img src="" alt="Certificate" class="lightbox-image">
                </div>
                <div class="lightbox-counter"></div>
            </div>
        </div>
    `;

    // Add lightbox to DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Carousel Gallery: Initializing...');
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        console.log('Carousel Gallery: Lightbox HTML added');
        initializeLightbox();
        initializeDragFunctionality();
        console.log('Carousel Gallery: Ready');
    });

    // Lightbox functionality
    function initializeLightbox() {
        const lightbox = document.getElementById('certificate-lightbox');
        const lightboxImage = lightbox.querySelector('.lightbox-image');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        const counter = lightbox.querySelector('.lightbox-counter');
        const overlay = lightbox.querySelector('.lightbox-overlay');

        let currentIndex = 0;
        let allImages = [];

        // Collect all certificate images (only unique ones, avoiding duplicates)
        function collectImages() {
            const allCarouselImages = Array.from(document.querySelectorAll('.carousel-image'));
            const uniqueImages = new Map();
            
            allCarouselImages.forEach(img => {
                // Use the src as the key to avoid duplicates
                if (!uniqueImages.has(img.src)) {
                    uniqueImages.set(img.src, {
                        src: img.src,
                        alt: img.alt
                    });
                }
            });
            
            allImages = Array.from(uniqueImages.values());
            console.log('Collected', allImages.length, 'unique images');
        }

        // Open lightbox - expose this function globally
        window.openCertificateLightbox = function(index) {
            console.log('Opening lightbox for image index:', index);
            collectImages();
            
            // Map the clicked image index to the unique images array
            const clickedImage = document.querySelectorAll('.carousel-image')[index];
            if (clickedImage) {
                const clickedSrc = clickedImage.src;
                console.log('Clicked image src:', clickedSrc);
                
                // Find this image in our unique images array
                const uniqueIndex = allImages.findIndex(img => img.src === clickedSrc);
                console.log('Unique index:', uniqueIndex, 'Total images:', allImages.length);
                
                if (uniqueIndex !== -1) {
                    currentIndex = uniqueIndex;
                    showImage(currentIndex);
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    console.error('Could not find image in unique images array');
                }
            }
        };

        // Close lightbox
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Show image
        function showImage(index) {
            if (allImages.length === 0) {
                console.error('No images to show');
                return;
            }
            
            // Wrap around
            if (index < 0) index = allImages.length - 1;
            if (index >= allImages.length) index = 0;
            
            currentIndex = index;
            const imageData = allImages[index];
            
            console.log('===== SHOWING IMAGE =====');
            console.log('Image index:', index + 1, 'of', allImages.length);
            console.log('Image src:', imageData.src);
            console.log('Image alt:', imageData.alt);
            console.log('Lightbox element:', lightboxImage);
            
            // Set image source
            lightboxImage.src = imageData.src;
            lightboxImage.alt = imageData.alt;
            counter.textContent = `${index + 1} / ${allImages.length}`;
            
            // Force image to be visible with important styles
            lightboxImage.style.cssText = `
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                max-width: 90vw;
                max-height: 85vh;
                width: auto;
                height: auto;
                position: relative;
                z-index: 10002;
            `;
            
            // Log after setting
            setTimeout(() => {
                console.log('Image element src after set:', lightboxImage.src);
                console.log('Image naturalWidth:', lightboxImage.naturalWidth);
                console.log('Image naturalHeight:', lightboxImage.naturalHeight);
                console.log('Image complete:', lightboxImage.complete);
            }, 100);
        }

        // Navigate
        function nextImage() {
            showImage(currentIndex + 1);
        }

        function prevImage() {
            showImage(currentIndex - 1);
        }

        // Event listeners for lightbox
        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        nextBtn.addEventListener('click', nextImage);
        prevBtn.addEventListener('click', prevImage);

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        });

        // Make images clickable with pointer cursor
        const carouselImages = document.querySelectorAll('.carousel-image');
        console.log('Found', carouselImages.length, 'carousel images');
        carouselImages.forEach(img => {
            img.style.cursor = 'pointer';
        });
    }

    // Drag functionality for carousel
    function initializeDragFunctionality() {
        const carouselRows = document.querySelectorAll('.carousel-row');

        carouselRows.forEach(row => {
            const track = row.querySelector('.carousel-track');
            if (!track) return;

            let isDragging = false;
            let startPos = 0;
            let currentTranslate = 0;
            let prevTranslate = 0;
            let animationID = 0;
            let currentAnimation = '';
            let hasMoved = false;  // Track if there was actual movement
            let clickTarget = null;  // Store the click target

            // Get current transform value
            function getTransformValue() {
                const style = window.getComputedStyle(track);
                const matrix = style.transform;
                if (matrix === 'none') return 0;
                const values = matrix.split('(')[1].split(')')[0].split(',');
                return parseFloat(values[4]) || 0;
            }

            // Mouse events
            track.addEventListener('mousedown', dragStart);
            track.addEventListener('mouseup', dragEnd);
            track.addEventListener('mouseleave', dragEnd);
            track.addEventListener('mousemove', drag);

            // Touch events
            track.addEventListener('touchstart', dragStart, { passive: true });
            track.addEventListener('touchend', dragEnd);
            track.addEventListener('touchmove', drag, { passive: true });

            // Prevent context menu on long press
            track.addEventListener('contextmenu', e => e.preventDefault());

            function dragStart(e) {
                isDragging = true;
                hasMoved = false;  // Reset movement flag
                clickTarget = e.target;  // Store what was clicked
                startPos = getPositionX(e);
                prevTranslate = getTransformValue();
                
                // Pause animation
                currentAnimation = track.style.animation;
                track.style.animation = 'none';
                
                track.style.cursor = 'grabbing';
                cancelAnimationFrame(animationID);
            }

            function drag(e) {
                if (!isDragging) return;
                
                const currentPosition = getPositionX(e);
                const distance = Math.abs(currentPosition - startPos);
                
                // Only consider it a drag if moved more than 5 pixels
                if (distance > 5) {
                    hasMoved = true;
                    currentTranslate = prevTranslate + currentPosition - startPos;
                    track.style.transform = `translateX(${currentTranslate}px)`;
                }
            }

            function dragEnd(e) {
                if (!isDragging) return;
                
                isDragging = false;
                track.style.cursor = 'grab';
                
                // If there was no movement and clicked on an image, open lightbox
                if (!hasMoved && clickTarget && clickTarget.classList.contains('carousel-image')) {
                    console.log('Click on image detected - opening lightbox');
                    
                    // Find the index of the clicked image
                    const allCarouselImages = Array.from(document.querySelectorAll('.carousel-image'));
                    const imageIndex = allCarouselImages.indexOf(clickTarget);
                    
                    console.log('Image index:', imageIndex, 'of', allCarouselImages.length);
                    
                    if (imageIndex !== -1 && window.openCertificateLightbox) {
                        window.openCertificateLightbox(imageIndex);
                    }
                }
                
                // Resume animation from current position
                const currentPos = getTransformValue();
                prevTranslate = currentPos;
                
                // Restore animation
                setTimeout(() => {
                    track.style.animation = currentAnimation;
                }, 50);
                
                hasMoved = false;  // Reset for next interaction
                clickTarget = null;  // Clear click target
            }

            function getPositionX(e) {
                return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            }

            // Make cursor show grab
            track.style.cursor = 'grab';
        });
    }

})();

