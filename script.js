// Language Toggle Functionality
let currentLanguage = 'en';

// Language data
const languages = {
    en: 'عربي',
    ar: 'English'
};

function toggleLanguage() {
    console.log('Language toggle clicked! Current language:', currentLanguage);
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    console.log('New language:', currentLanguage);
    updateLanguage();
}

function updateLanguage() {
    console.log('Updating language to:', currentLanguage);
    
    // Get the current language span element
    const currentLangSpan = document.getElementById('currentLang');
    console.log('Current language span element:', currentLangSpan);
    
    // Update language button
    if (currentLangSpan) {
        currentLangSpan.textContent = languages[currentLanguage];
        console.log('Updated button text to:', languages[currentLanguage]);
    } else {
        console.error('Current language span not found!');
    }
    
    // Update document direction
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    
    // Update all elements with language data
    const elementsWithLang = document.querySelectorAll('[data-en][data-ar]');
    elementsWithLang.forEach(element => {
        const text = element.getAttribute(`data-${currentLanguage}`);
        if (text) {
            // Check if the text contains HTML tags
            if (text.includes('<') && text.includes('>')) {
                element.innerHTML = text;
            } else {
                element.textContent = text;
            }
        }
    });
    
    // Update WhatsApp link with appropriate language
    const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
    whatsappLinks.forEach(link => {
        const message = currentLanguage === 'ar' 
            ? 'مرحباً، أود حجز موعد مع د. أحمد مبروك الشيخ'
            : 'Hello, I would like to schedule an appointment with Dr. Ahmed Mabrouk Elsheikh';
        link.href = `https://wa.me/+201003808332?text=${encodeURIComponent(message)}`;
    });
    
    // Save language preference
    localStorage.setItem('preferredLanguage', currentLanguage);
    
    // Adjust navigation layout based on language
    adjustNavigationForLanguage();
    
    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

function adjustNavigationForLanguage() {
    const navMenu = document.querySelector('.nav-menu');
    
    // Simple responsive menu spacing
    if (window.innerWidth > 1024) {
        navMenu.style.gap = '2rem';
    } else if (window.innerWidth > 900) {
        navMenu.style.gap = '1.5rem';
    } else if (window.innerWidth > 600) {
        navMenu.style.gap = '1rem';
    } else if (navMenu) {
        navMenu.style.gap = '0.8rem';
    }
}

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== currentLanguage) {
        currentLanguage = savedLang;
        updateLanguage();
    }
}

// Adjust navigation on window resize
window.addEventListener('resize', adjustNavigationForLanguage);

// URL-based Admin Access System
class SecretAdminAccess {
    constructor() {
        this.setupUrlAccess();
    }
    
    setupUrlAccess() {
        // Check for admin access URL parameter
        this.checkUrlForAdminAccess();
        
        // Listen for URL changes (for SPA-like behavior)
        window.addEventListener('popstate', () => {
            this.checkUrlForAdminAccess();
        });
    }
    
    checkUrlForAdminAccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const adminParam = urlParams.get('admin');
        
        if (adminParam === 'access') {
            this.promptForPassword();
        }
    }
    
    promptForPassword() {
        const password = prompt('Enter admin password:');
        if (password === 'drahmedmabrouk##777') {
            // Wait for blogManager to be available
            this.waitForBlogManager();
        } else if (password !== null) {
            alert('Incorrect password');
        }
    }
    
    waitForBlogManager() {
        const checkBlogManager = () => {
            if (typeof window.blogManager !== 'undefined' && window.blogManager.openAdminModal) {
                window.blogManager.openAdminModal();
            } else {
                // Wait a bit more and try again
                setTimeout(checkBlogManager, 100);
            }
        };
        
        // Start checking immediately
        checkBlogManager();
    }
}

// Certificates and Conferences Manager
class CertificatesConferencesManager {
    constructor() {
        this.certificates = [];
        this.conferences = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        // Modal close buttons
        const closeCertificatesModal = document.getElementById('closeCertificatesModal');
        const closeConferencesModal = document.getElementById('closeConferencesModal');

        if (closeCertificatesModal) {
            closeCertificatesModal.addEventListener('click', () => this.closeCertificatesModal());
        }
        if (closeConferencesModal) {
            closeConferencesModal.addEventListener('click', () => this.closeConferencesModal());
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });

        // Close modals on outside click
        document.getElementById('certificatesModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'certificatesModal') this.closeCertificatesModal();
        });
        document.getElementById('conferencesModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'conferencesModal') this.closeConferencesModal();
        });
    }

    loadSampleData() {
        // Sample certificates data
        this.certificates = [
            {
                id: 1,
                title: "T2T Certificate from Harvard University",
                description: "Advanced training in kidney transplantation techniques and patient management from one of the world's leading medical institutions.",
                image: "https://via.placeholder.com/400x300/2c5530/ffffff?text=Harvard+T2T+Certificate",
                date: "2023",
                location: "Boston, USA",
                institution: "Harvard University",
                category: "international"
            },
            {
                id: 2,
                title: "Preceptorship in Kidney Transplantation",
                description: "Specialized training program in kidney transplantation at the prestigious Hospital Clinic in Barcelona.",
                image: "https://via.placeholder.com/400x300/3a6b3a/ffffff?text=Barcelona+Preceptorship",
                date: "2022",
                location: "Barcelona, Spain",
                institution: "Hospital Clinic - University of Barcelona",
                category: "international"
            },
            {
                id: 3,
                title: "Leadership Management Certificate",
                description: "Comprehensive leadership and management training from Washington University.",
                image: "https://via.placeholder.com/400x300/2c5530/ffffff?text=Leadership+Management",
                date: "2021",
                location: "St. Louis, USA",
                institution: "Washington University",
                category: "management"
            },
            {
                id: 4,
                title: "Hospital Management Diploma",
                description: "Specialized diploma in hospital management and healthcare administration.",
                image: "https://via.placeholder.com/400x300/3a6b3a/ffffff?text=Hospital+Management",
                date: "2020",
                location: "Manchester, UK",
                institution: "University of Manchester",
                category: "management"
            },
            {
                id: 5,
                title: "Egyptian Fellowship in Nephrology",
                description: "Comprehensive fellowship program in nephrology and kidney transplantation.",
                image: "https://via.placeholder.com/400x300/2c5530/ffffff?text=Egyptian+Fellowship",
                date: "2019",
                location: "Cairo, Egypt",
                institution: "Egyptian Medical Syndicate",
                category: "medical"
            }
        ];

        // Sample conferences data
        this.conferences = [
            {
                id: 1,
                title: "International Society of Nephrology Congress",
                description: "Keynote speaker on advances in kidney transplantation and innovative treatment protocols.",
                image: "https://via.placeholder.com/400x300/2c5530/ffffff?text=ISN+Congress",
                date: "2024",
                location: "Vienna, Austria",
                institution: "International Society of Nephrology",
                category: "speaking"
            },
            {
                id: 2,
                title: "European Renal Association Congress",
                description: "Active participation in the largest European nephrology conference with focus on patient care.",
                image: "https://via.placeholder.com/400x300/3a6b3a/ffffff?text=ERA+Congress",
                date: "2023",
                location: "Milan, Italy",
                institution: "European Renal Association",
                category: "attending"
            },
            {
                id: 3,
                title: "World Kidney Academy Workshop",
                description: "Intensive workshop on deceased donor transplantation under supervision of leading experts.",
                image: "https://via.placeholder.com/400x300/2c5530/ffffff?text=WKA+Workshop",
                date: "2023",
                location: "London, UK",
                institution: "World Kidney Academy",
                category: "attending"
            },
            {
                id: 4,
                title: "Egyptian Nephrology Society Annual Meeting",
                description: "Organized and chaired the annual meeting of the Egyptian Nephrology Society.",
                image: "https://via.placeholder.com/400x300/3a6b3a/ffffff?text=ENS+Meeting",
                date: "2023",
                location: "Cairo, Egypt",
                institution: "Egyptian Nephrology Society",
                category: "organizing"
            },
            {
                id: 5,
                title: "American Society of Nephrology Conference",
                description: "Presented research findings on kidney transplantation outcomes and patient care protocols.",
                image: "https://via.placeholder.com/400x300/2c5530/ffffff?text=ASN+Conference",
                date: "2022",
                location: "Orlando, USA",
                institution: "American Society of Nephrology",
                category: "speaking"
            }
        ];
    }

    openCertificatesPage() {
        document.getElementById('certificatesModal').style.display = 'flex';
        this.renderCertificates();
    }

    openConferencesPage() {
        document.getElementById('conferencesModal').style.display = 'flex';
        this.renderConferences();
    }

    closeCertificatesModal() {
        document.getElementById('certificatesModal').style.display = 'none';
    }

    closeConferencesModal() {
        document.getElementById('conferencesModal').style.display = 'none';
    }

    handleFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Re-render content
        if (document.getElementById('certificatesModal').style.display === 'flex') {
            this.renderCertificates();
        } else if (document.getElementById('conferencesModal').style.display === 'flex') {
            this.renderConferences();
        }
    }

    renderCertificates() {
        const gallery = document.getElementById('certificatesGallery');
        const filteredCertificates = this.currentFilter === 'all' 
            ? this.certificates 
            : this.certificates.filter(cert => cert.category === this.currentFilter);
        
        gallery.innerHTML = filteredCertificates.map(cert => `
            <div class="gallery-item">
                <img src="${cert.image}" alt="${cert.title}" class="gallery-item-image">
                <div class="gallery-item-content">
                    <h3 class="gallery-item-title">${cert.title}</h3>
                    <div class="gallery-item-meta">
                        <span><i class="fas fa-calendar"></i> ${cert.date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${cert.location}</span>
                        <span><i class="fas fa-university"></i> ${cert.institution}</span>
                    </div>
                    <p class="gallery-item-description">${cert.description}</p>
                    <span class="gallery-item-category">${cert.category}</span>
                </div>
            </div>
        `).join('');
    }

    renderConferences() {
        const gallery = document.getElementById('conferencesGallery');
        const filteredConferences = this.currentFilter === 'all' 
            ? this.conferences 
            : this.conferences.filter(conf => conf.category === this.currentFilter);
        
        gallery.innerHTML = filteredConferences.map(conf => `
            <div class="gallery-item">
                <img src="${conf.image}" alt="${conf.title}" class="gallery-item-image">
                <div class="gallery-item-content">
                    <h3 class="gallery-item-title">${conf.title}</h3>
                    <div class="gallery-item-meta">
                        <span><i class="fas fa-calendar"></i> ${conf.date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${conf.location}</span>
                        <span><i class="fas fa-university"></i> ${conf.institution}</span>
                    </div>
                    <p class="gallery-item-description">${conf.description}</p>
                    <span class="gallery-item-category">${conf.category}</span>
                </div>
            </div>
        `).join('');
    }
}

// Global functions for onclick handlers
function openCertificatesPage() {
    certificatesManager.openCertificatesPage();
}

function openConferencesPage() {
    certificatesManager.openConferencesPage();
}

// Achievement Section Animations and Interactions
class AchievementManager {
    constructor() {
        this.setupAchievementAnimations();
    }
    
    setupAchievementAnimations() {
        const achievementItems = document.querySelectorAll('.achievement-item');
        
        achievementItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const icon = item.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1.1) rotate(5deg)';
                    icon.style.transition = 'transform 0.3s ease';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const icon = item.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });
    }
}

// Veseta Reviews Interactions
class VesetaManager {
    constructor() {
        this.setupVesetaInteractions();
    }
    
    setupVesetaInteractions() {
        // Setup review image lightbox
        const reviewImages = document.querySelectorAll('.review-image');
        
        reviewImages.forEach(image => {
            image.addEventListener('click', () => {
                this.openLightbox(image.src, image.alt);
            });
        });
        
        // Setup Veseta button hover effects
        const vesetaBtn = document.querySelector('.veseta-btn');
        if (vesetaBtn) {
            vesetaBtn.addEventListener('mouseenter', () => {
                const icon = vesetaBtn.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.transition = 'transform 0.3s ease';
                }
            });
            
            vesetaBtn.addEventListener('mouseleave', () => {
                const icon = vesetaBtn.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1)';
                }
            });
        }
    }
    
    openLightbox(imageSrc, imageAlt) {
        // Create lightbox overlay
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox-overlay';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <span class="lightbox-close">&times;</span>
                <img src="${imageSrc}" alt="${imageAlt}" class="lightbox-image">
            </div>
        `;
        
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        const closeBtn = lightbox.querySelector('.lightbox-close');
        closeBtn.addEventListener('click', () => this.closeLightbox(lightbox));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) this.closeLightbox(lightbox);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeLightbox(lightbox);
        });
    }
    
    closeLightbox(lightbox) {
        document.body.removeChild(lightbox);
        document.body.style.overflow = 'auto';
    }
}

// WhatsApp Floating Button Enhancements
class WhatsAppManager {
    constructor() {
        this.setupWhatsAppEnhancements();
    }
    
    setupWhatsAppEnhancements() {
        const whatsappBtn = document.querySelector('.floating-whatsapp');
        if (!whatsappBtn) return;
        
        this.setupHoverEffects();
        this.setupClickAnimation();
        this.updateButtonSize();
        window.addEventListener('resize', () => this.updateButtonSize());
    }
    
    setupHoverEffects() {
        const whatsappBtn = document.querySelector('.floating-whatsapp');
        if (!whatsappBtn) return;
        
        whatsappBtn.addEventListener('mouseenter', () => {
            const icon = whatsappBtn.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        whatsappBtn.addEventListener('mouseleave', () => {
            const icon = whatsappBtn.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    }
    
    setupClickAnimation() {
        const whatsappBtn = document.querySelector('.floating-whatsapp');
        if (!whatsappBtn) return;
        
        whatsappBtn.addEventListener('click', () => {
            // Add click animation
            whatsappBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                whatsappBtn.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    updateButtonSize() {
        const whatsappBtn = document.querySelector('.floating-whatsapp');
        if (!whatsappBtn) return;
        
        // Remove fixed width/height to allow text to show
        whatsappBtn.style.width = 'auto';
        whatsappBtn.style.height = 'auto';
        
        // Ensure minimum size but allow text to be visible
        if (window.innerWidth < 768) {
            whatsappBtn.style.minWidth = '60px';
            whatsappBtn.style.minHeight = '60px';
        } else {
            whatsappBtn.style.minWidth = '70px';
            whatsappBtn.style.minHeight = '70px';
        }
        
        // Ensure text is always visible
        const whatsappText = whatsappBtn.querySelector('.whatsapp-text');
        if (whatsappText) {
            whatsappText.style.display = 'block';
            whatsappText.style.visibility = 'visible';
            whatsappText.style.opacity = '1';
        }
    }
}

// Text Alignment and Breaking Improvements
class TextManager {
    constructor() {
        this.setupTextImprovements();
    }
    
    setupTextImprovements() {
        this.updateTextSizes();
        this.setupRTLSupport();
        window.addEventListener('resize', () => this.updateTextSizes());
    }
    
    updateTextSizes() {
        // Update text sizes based on screen size
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        
        if (heroTitle) {
            if (window.innerWidth < 360) {
                heroTitle.style.fontSize = '1.1rem';
                heroTitle.style.lineHeight = '1.4';
            } else if (window.innerWidth < 480) {
                heroTitle.style.fontSize = '1.3rem';
                heroTitle.style.lineHeight = '1.4';
            } else if (window.innerWidth < 768) {
                heroTitle.style.fontSize = '1.5rem';
                heroTitle.style.lineHeight = '1.4';
            } else {
                heroTitle.style.fontSize = '1.8rem';
                heroTitle.style.lineHeight = '1.4';
            }
        }
        
        if (heroSubtitle) {
            if (window.innerWidth < 360) {
                heroSubtitle.style.fontSize = '0.7rem';
            } else if (window.innerWidth < 480) {
                heroSubtitle.style.fontSize = '0.75rem';
            } else if (window.innerWidth < 768) {
                heroSubtitle.style.fontSize = '0.8rem';
            } else {
                heroSubtitle.style.fontSize = '0.85rem';
            }
            heroSubtitle.style.lineHeight = '1.5';
        }
    }
    
    setupRTLSupport() {
        const updateRTLSupport = () => {
            const isArabic = currentLanguage === 'ar';
            const aboutSection = document.querySelector('.about-section');
            
            if (aboutSection) {
                if (isArabic) {
                    aboutSection.style.direction = 'rtl';
                    aboutSection.style.textAlign = 'right';
                } else {
                    aboutSection.style.direction = 'ltr';
                    aboutSection.style.textAlign = 'left';
                }
            }
        };
        
        updateRTLSupport();
        // Update when language changes
        document.addEventListener('languageChanged', updateRTLSupport);
    }
}

// Add lightbox styles
const lightboxStyles = document.createElement('style');
lightboxStyles.textContent = `
    .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }
    
    .lightbox-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }
    
    .lightbox-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
    
    .lightbox-close {
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 30px;
        cursor: pointer;
        background: rgba(0, 0, 0, 0.5);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }
`;
document.head.appendChild(lightboxStyles);


// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language toggle
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', toggleLanguage);
        console.log('Language toggle initialized');
    } else {
        console.error('Language toggle button not found!');
    }
    
    // Initialize hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const body = document.body;
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            
            // Toggle body class for better state management
            if (mobileMenu.classList.contains('active')) {
                body.classList.add('menu-open');
            } else {
                body.classList.remove('menu-open');
            }
        });
        
        // Close mobile menu when clicking on a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                body.classList.remove('menu-open');
            });
        });
        
        console.log('Hamburger menu initialized');
    } else {
        console.error('Hamburger menu elements not found!');
    }
    
    // Initialize desktop navigation links
    const desktopNavLinks = document.querySelectorAll('.desktop-nav-link');
    desktopNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    // Initialize smooth scrolling for all anchor links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Initialize navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Initialize active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    if (sections.length > 0) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY + 100;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                const correspondingNavLink = document.querySelector(`a[href="#${sectionId}"]`);
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    // Remove active class from all nav links
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                    });
                    if (correspondingNavLink) {
                        correspondingNavLink.classList.add('active');
                    }
                }
            });
        });
    }
    
    // Initialize scroll animations
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    if (animateElements.length > 0) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    // Initialize scroll to top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 20px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
    `;
    document.body.appendChild(scrollToTopBtn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (hamburger && mobileMenu && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
    
    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && hamburger && mobileMenu && mobileMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && hamburger && mobileMenu) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
    
    // Load saved language preference
    loadLanguagePreference();
    
    // Initialize all managers
    new SecretAdminAccess();
    new AchievementManager();
    new VesetaManager();
    new WhatsAppManager();
    new TextManager();
    window.certificatesManager = new CertificatesConferencesManager();
    
    console.log('All components initialized successfully!');
    
    // Function to ensure Arabic text uses Cairo font
    function applyArabicFont() {
        // Apply Cairo font to all elements with Arabic text
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            const text = element.textContent || element.innerText;
            if (text && /[\u0600-\u06FF]/.test(text)) {
                element.style.fontFamily = 'Cairo, sans-serif';
            }
        });
        
        // Apply Cairo font to elements with data-ar attributes
        const arabicElements = document.querySelectorAll('[data-ar]');
        arabicElements.forEach(element => {
            element.style.fontFamily = 'Cairo, sans-serif';
        });
        
        // Apply Cairo font when language is Arabic
        if (currentLanguage === 'ar' || document.documentElement.dir === 'rtl') {
            document.body.style.fontFamily = 'Cairo, sans-serif';
        }
    }
    
    // Apply Arabic font on page load
    applyArabicFont();
    
    // Reapply Arabic font when language changes
    const originalUpdateLanguage = updateLanguage;
    updateLanguage = function() {
        originalUpdateLanguage();
        setTimeout(applyArabicFont, 100); // Small delay to ensure DOM is updated
    };
});