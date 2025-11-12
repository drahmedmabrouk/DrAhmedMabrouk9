// Supabase Configuration
const SUPABASE_URL = 'https://ukdjiptolebhuolvcbzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZGppcHRvbGViaHVvbHZjYnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTQwNzUsImV4cCI6MjA3MzMzMDA3NX0.jlBz9EOOKfpkegr23gmdzkY5b00CQJ14C5oOZugyVro';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Blog Management Class
class BlogManager {
    constructor() {
        this.currentEditingPost = null;
        this.isAdminLoggedIn = false;
        this.adminPassword = window.ADMIN_CONFIG?.password || 'admin123';
        this.loginAttempts = 0;
        this.lockoutUntil = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBlogPosts();
        this.setupAdminAccess();
        this.checkAdminLogin();
    }

    setupEventListeners() {
        // Admin modal controls
        const adminModal = document.getElementById('adminModal');
        const adminLoginModal = document.getElementById('adminLoginModal');
        const closeAdmin = document.getElementById('closeAdmin');
        const closeLoginAdmin = document.getElementById('closeLoginAdmin');
        const adminAccess = document.getElementById('adminAccess');
        const cancelForm = document.getElementById('cancelForm');
        const blogForm = document.getElementById('blogForm');
        const adminLoginForm = document.getElementById('adminLoginForm');
        const cancelLogin = document.getElementById('cancelLogin');

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Content type switching
        const contentTypeCheckboxes = document.querySelectorAll('input[name="contentTypes"]');
        contentTypeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleContentTypeChange();
            });
        });

        // File upload handling
        this.setupFileUpload();

        // Modal controls
        if (closeAdmin) closeAdmin.addEventListener('click', () => this.closeAdminModal());
        if (closeLoginAdmin) closeLoginAdmin.addEventListener('click', () => this.closeLoginModal());
        if (adminAccess) adminAccess.addEventListener('click', () => this.openAdminModal());
        if (cancelForm) cancelForm.addEventListener('click', () => this.resetForm());
        if (cancelLogin) cancelLogin.addEventListener('click', () => this.closeLoginModal());
        if (blogForm) blogForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        if (adminLoginForm) adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));

        // Hidden access methods
        this.setupHiddenAccess();

        // Close modal on outside click
        if (adminModal) {
            adminModal.addEventListener('click', (e) => {
                if (e.target === adminModal) this.closeAdminModal();
            });
        }
        if (adminLoginModal) {
            adminLoginModal.addEventListener('click', (e) => {
                if (e.target === adminLoginModal) this.closeLoginModal();
            });
        }
    }

    setupAdminAccess() {
        // Admin access is now always visible through multiple buttons
        // No need for keyboard shortcuts anymore
        console.log('Admin access buttons are now always visible');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        if (tabName === 'posts') {
            this.loadAllContent();
        } else if (tabName === 'add-video') {
            // Only reset form when switching to add mode (not edit mode)
            if (window.videoManager && !window.videoManager.currentEditingVideo) {
                window.videoManager.resetVideoForm();
                // Reset form title and button text
                const formTitle = document.querySelector('#add-video h3');
                if (formTitle) {
                    formTitle.textContent = 'Add New Video';
                }
                const submitBtn = document.querySelector('#videoForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Add Video';
                }
            }
        }
    }

    async loadBlogPosts() {
        try {
            console.log('Loading blog posts...');
            
            // First try to get all posts to see what we have
            const { data: allPosts, error: allError } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (allError) {
                console.error('Error loading all posts:', allError);
                throw allError;
            }

            console.log('All posts from database:', allPosts);

            // Filter published posts
            const publishedPosts = allPosts.filter(post => 
                post.status === 'published' || 
                (post.published === true && !post.status) // fallback for old posts
            );

            console.log('Published posts:', publishedPosts);
            this.displayBlogPosts(publishedPosts);
        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.displayError('Failed to load blog posts: ' + error.message);
        }
    }

    displayBlogPosts(posts) {
        const blogGrid = document.getElementById('blogGrid');
        if (!blogGrid) {
            console.error('Blog grid element not found!');
            return;
        }

        console.log('Displaying blog posts:', posts.length, 'posts');

        if (posts.length === 0) {
            blogGrid.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-newspaper"></i>
                    <p>No blog posts available yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        const html = posts.map(post => this.createBlogPostCard(post)).join('');
        console.log('Generated HTML:', html);
        blogGrid.innerHTML = html;
        
        // Force visibility
        setTimeout(() => {
            const cards = blogGrid.querySelectorAll('.blog-card');
            cards.forEach(card => {
                card.style.opacity = '1';
                card.style.visibility = 'visible';
                card.style.display = 'block';
            });
        }, 100);
    }

    createBlogPostCard(post) {
        const currentLang = document.documentElement.lang || 'en';
        const title = currentLang === 'ar' ? (post.title_ar || post.title) : post.title;
        const content = currentLang === 'ar' ? (post.content_ar || post.content) : post.content;
        const excerpt = content.length > 150 ? content.substring(0, 150) + '...' : content;
        
        // Parse content types (support both old single type and new multiple types)
        const contentTypes = post.content_types ? 
            post.content_types.split(',').filter(t => t.trim()) : 
            [post.content_type || 'text'];
        
        const hasImage = contentTypes.includes('image') && (post.image_url || post.featured_image_url);
        const hasPdf = contentTypes.includes('pdf') && post.pdf_url;
        const hasLink = contentTypes.includes('link') && post.external_link;
        const hasText = contentTypes.includes('text');
        
        // Build card image section only if there's an image
        let cardImage = '';
        if (hasImage) {
            const imageUrl = post.image_url || post.featured_image_url;
            cardImage = `
                <div class="blog-image">
                    <img src="${imageUrl}" alt="${title}" loading="lazy">
                    <div class="blog-category">${this.getCategoryLabel(post.category)}</div>
                    ${hasPdf ? '<div class="content-type-badge pdf-badge"><i class="fas fa-file-pdf"></i></div>' : ''}
                    ${hasLink ? '<div class="content-type-badge link-badge"><i class="fas fa-external-link-alt"></i></div>' : ''}
                </div>
            `;
        }
        
        // Build action buttons based on available content
        let actionButtons = '';
        
        // Add Read More button for text content (always show if there's text content)
        if (hasText && content.length > 150) {
            actionButtons += `
                <button class="btn btn-outline" onclick="blogManager.showFullArticle('${post.id}')">
                    <i class="fas fa-book-open"></i> Read More
                </button>
            `;
        }
        
        // Add PDF button if PDF is available
        if (hasPdf) {
            actionButtons += `
                <a href="${post.pdf_url}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-file-pdf"></i> View PDF
                </a>
            `;
        }
        
        // Add link button if external link is available
        if (hasLink) {
            actionButtons += `
                <a href="${post.external_link}" target="_blank" class="btn btn-secondary">
                    <i class="fas fa-external-link-alt"></i> ${post.link_text || 'Visit Link'}
                </a>
            `;
        }

        return `
            <div class="blog-card ${!hasImage ? 'no-image' : ''}" data-id="${post.id}" data-content-types="${contentTypes.join(',')}" style="opacity: 1; visibility: visible; display: block;">
                ${cardImage}
                <div class="blog-content">
                    <h3 class="blog-title">${title}</h3>
                    <p class="blog-excerpt">${excerpt}</p>
                    <div class="blog-meta">
                        <span class="blog-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(post.created_at).toLocaleDateString()}
                        </span>
                        <span class="blog-category-tag">${this.getCategoryLabel(post.category)}</span>
                    </div>
                    <div class="blog-actions">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = {
            'research': 'Research Paper',
            'article': 'Article',
            'news': 'News',
            'case-study': 'Case Study'
        };
        return labels[category] || category;
    }

    async loadPostsList() {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.displayPostsList(data || []);
        } catch (error) {
            console.error('Error loading posts list:', error);
            this.displayError('Failed to load posts list');
        }
    }

    async loadAllContent() {
        try {
            console.log('Loading all content (posts and videos)...');
            
            // Use timeout for each query
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 8000)
            );
            
            // Load posts with optimized query
            const postsPromise = supabase
                .from('blog_posts')
                .select('id, title, title_ar, content, content_ar, image_url, featured_image_url, status, created_at')
                .order('created_at', { ascending: false })
                .limit(25);

            const { data: posts, error: postsError } = await Promise.race([postsPromise, timeoutPromise]);

            if (postsError) throw postsError;

            // Load videos with optimized query
            const videosPromise = supabase
                .from('videos')
                .select('id, title, title_ar, description, description_ar, video_url, thumbnail_url, category, duration, status, views, created_at')
                .order('created_at', { ascending: false })
                .limit(25);

            const { data: videos, error: videosError } = await Promise.race([videosPromise, timeoutPromise]);

            if (videosError) throw videosError;

            // Combine and sort by creation date
            const allContent = [
                ...(posts || []).map(post => ({ ...post, type: 'post' })),
                ...(videos || []).map(video => ({ ...video, type: 'video' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            console.log('All content loaded:', allContent.length, 'items');
            
            // Try to cache content (with size check)
            try {
                const cacheKey = 'all_content_cache';
                const cacheTimeKey = 'all_content_cache_time';
                const cacheData = JSON.stringify(allContent);
                const now = Date.now();
                
                // Check if data is too large (3MB limit for combined content)
                if (cacheData.length > 3 * 1024 * 1024) {
                    console.warn('Content data too large for cache, skipping cache');
                } else {
                    localStorage.setItem(cacheKey, cacheData);
                    localStorage.setItem(cacheTimeKey, now.toString());
                }
            } catch (cacheError) {
                console.warn('Content cache write error, continuing without cache:', cacheError);
            }
            
            this.displayAllContent(allContent);
        } catch (error) {
            console.error('Error loading all content:', error);
            
            if (error.message.includes('timeout') || error.message.includes('canceling statement')) {
                this.displayError('Database query timed out. Please try again.');
            } else {
                this.displayError('Failed to load content: ' + error.message);
            }
        }
    }

    showPostsOnly() {
        console.log('Showing posts only...');
        const contentList = document.getElementById('contentList');
        if (contentList) {
            const postItems = contentList.querySelectorAll('.content-item[data-type="post"]');
            const videoItems = contentList.querySelectorAll('.content-item[data-type="video"]');
            
            console.log('Found posts:', postItems.length);
            console.log('Found videos:', videoItems.length);
            
            postItems.forEach(item => {
                item.style.display = 'flex';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
            });
            videoItems.forEach(item => {
                item.style.display = 'none';
            });
            
            // Update button states
            this.updateFilterButtons('posts');
        }
    }

    showVideosOnly() {
        console.log('Showing videos only...');
        const contentList = document.getElementById('contentList');
        if (contentList) {
            const postItems = contentList.querySelectorAll('.content-item[data-type="post"]');
            const videoItems = contentList.querySelectorAll('.content-item[data-type="video"]');
            
            console.log('Found posts:', postItems.length);
            console.log('Found videos:', videoItems.length);
            
            postItems.forEach(item => {
                item.style.display = 'none';
            });
            videoItems.forEach(item => {
                item.style.display = 'flex';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
            });
            
            // Update button states
            this.updateFilterButtons('videos');
        }
    }

    showAllContent() {
        console.log('Showing all content...');
        const contentList = document.getElementById('contentList');
        if (contentList) {
            const allItems = contentList.querySelectorAll('.content-item');
            
            allItems.forEach(item => {
                item.style.display = 'flex';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
            });
            
            // Update button states
            this.updateFilterButtons('all');
        }
    }

    updateFilterButtons(activeFilter) {
        // Update button styles based on active filter
        const allBtn = document.querySelector('[onclick="blogManager.showAllContent()"]');
        const postsBtn = document.querySelector('[onclick="blogManager.showPostsOnly()"]');
        const videosBtn = document.querySelector('[onclick="blogManager.showVideosOnly()"]');
        
        // Reset all buttons
        [allBtn, postsBtn, videosBtn].forEach(btn => {
            if (btn) {
                btn.classList.remove('active');
                btn.style.background = '#6c757d';
            }
        });
        
        // Activate current filter button
        let activeBtn = null;
        if (activeFilter === 'all') activeBtn = allBtn;
        else if (activeFilter === 'posts') activeBtn = postsBtn;
        else if (activeFilter === 'videos') activeBtn = videosBtn;
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#007bff';
        }
    }

    displayPostsList(posts) {
        const postsList = document.getElementById('postsList');
        if (!postsList) return;

        if (posts.length === 0) {
            postsList.innerHTML = '<p>No posts found. Create your first post!</p>';
            return;
        }

        postsList.innerHTML = posts.map(post => `
            <div class="post-item" data-id="${post.id}">
                <div class="post-info">
                    <h4>${post.title}</h4>
                    <p class="post-meta">
                        <span class="status ${post.status}">${post.status}</span>
                        <span class="date">${new Date(post.created_at).toLocaleDateString()}</span>
                        <span class="category">${this.getCategoryLabel(post.category)}</span>
                    </p>
                </div>
                <div class="post-actions">
                    <button class="btn btn-sm btn-primary" onclick="blogManager.editPost('${post.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="blogManager.deletePost('${post.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayAllContent(allContent) {
        const contentList = document.getElementById('contentList');
        if (!contentList) {
            console.error('Content list element not found!');
            return;
        }

        if (allContent.length === 0) {
            contentList.innerHTML = '<p>No content found. Create your first post or video!</p>';
            return;
        }

        console.log('Displaying all content:', allContent.length, 'items');
        contentList.innerHTML = allContent.map(item => this.createContentItem(item)).join('');
        
        // Set initial filter state
        this.updateFilterButtons('all');
    }

    createContentItem(item) {
        if (item.type === 'post') {
            return `
                <div class="content-item post-item" data-id="${item.id}" data-type="post" style="
                    background: white;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <div class="content-icon" style="
                        width: 40px;
                        height: 40px;
                        background: #007bff;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 18px;
                    ">
                        <i class="fas fa-newspaper"></i>
                    </div>
                    <div class="content-info" style="flex: 1;">
                        <h4 style="
                            font-weight: 600;
                            margin-bottom: 4px;
                            color: var(--text-color);
                            font-size: 16px;
                        ">${item.title}</h4>
                        <div class="content-meta">
                            <span class="status-badge status-${item.status}">${item.status}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(item.created_at).toLocaleDateString()}</span>
                            <span><i class="fas fa-tag"></i> ${this.getCategoryLabel(item.category)}</span>
                            <span style="color: #007bff; font-weight: 600;"><i class="fas fa-newspaper"></i> POST</span>
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-primary" onclick="blogManager.editPost('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="blogManager.deletePost('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        } else if (item.type === 'video') {
            return `
                <div class="content-item video-item" data-id="${item.id}" data-type="video" style="
                    background: white;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <div class="content-icon" style="
                        width: 40px;
                        height: 40px;
                        background: #28a745;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 18px;
                    ">
                        <i class="fas fa-video"></i>
                    </div>
                    <div class="content-info" style="flex: 1;">
                        <h4 style="
                            font-weight: 600;
                            margin-bottom: 4px;
                            color: var(--text-color);
                            font-size: 16px;
                        ">${item.title}</h4>
                        <div class="content-meta">
                            <span class="status-badge status-${item.status}">${item.status}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(item.created_at).toLocaleDateString()}</span>
                            <span><i class="fas fa-tag"></i> ${this.getVideoCategoryLabel(item.category)}</span>
                            <span style="color: #28a745; font-weight: 600;"><i class="fas fa-video"></i> VIDEO</span>
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-primary" onclick="blogManager.editVideo('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="blogManager.deleteVideo('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }
    }

    getVideoCategoryLabel(category) {
        const labels = {
            'lecture': 'Lecture',
            'procedure': 'Procedure', 
            'education': 'Education',
            'research': 'Research',
            'interview': 'Interview'
        };
        return labels[category] || category;
    }

    // Video CRUD operations integrated into BlogManager
    async editVideo(videoId) {
        try {
            console.log('=== EDIT VIDEO DEBUG ===');
            console.log('Loading video for editing:', videoId);
            console.log('Current editing video before:', window.videoManager?.currentEditingVideo);
            
            // Show loading state
            if (window.videoManager) {
                window.videoManager.showVideoLoadingState();
            }
            
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error) {
                console.error('Error fetching video:', error);
                if (window.videoManager) {
                    window.videoManager.hideVideoLoadingState();
                }
                throw error;
            }

            console.log('Video data loaded:', data);

            // Wait a bit to ensure form is ready
            await new Promise(resolve => setTimeout(resolve, 200));

            // Check if form elements exist before populating
            const formElements = [
                'videoTitle', 'videoTitleAr', 'videoDescription', 'videoDescriptionAr',
                'videoUrl', 'videoThumbnail', 'videoCategory', 'videoDuration', 'videoStatus'
            ];
            
            console.log('Checking form elements:');
            formElements.forEach(id => {
                const element = document.getElementById(id);
                console.log(`${id}:`, element ? 'Found' : 'NOT FOUND');
            });

            // Set editing state in both managers FIRST
            if (window.videoManager) {
                window.videoManager.currentEditingVideo = videoId;
                console.log('Set videoManager.currentEditingVideo to:', videoId);
            }
            this.currentEditingVideo = videoId;
            console.log('Set blogManager.currentEditingVideo to:', videoId);
            
            // Switch to add video tab
            console.log('Switching to add-video tab...');
            this.switchTab('add-video');
            
            // Wait a bit for tab switch to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Populate form with video data AFTER tab switch
            this.populateVideoForm(data);
            
            // Update UI elements
            this.updateEditModeUI();
            
            if (window.videoManager) {
                window.videoManager.hideVideoLoadingState();
            }
            console.log('Video form populated and switched to edit mode');
            console.log('Current editing video after:', window.videoManager?.currentEditingVideo);
        } catch (error) {
            console.error('Error loading video for editing:', error);
            if (window.videoManager) {
                window.videoManager.hideVideoLoadingState();
            }
            this.displayError('Failed to load video for editing: ' + error.message);
        }
    }

    populateVideoForm(data) {
        const fields = [
            { id: 'videoTitle', value: data.title || '' },
            { id: 'videoTitleAr', value: data.title_ar || '' },
            { id: 'videoDescription', value: data.description || '' },
            { id: 'videoDescriptionAr', value: data.description_ar || '' },
            { id: 'videoUrl', value: data.video_url || '' },
            { id: 'videoThumbnail', value: data.thumbnail_url || '' },
            { id: 'videoCategory', value: data.category || '' },
            { id: 'videoDuration', value: data.duration || '' },
            { id: 'videoStatus', value: data.status || '' }
        ];

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.value = field.value;
            } else {
                console.warn(`Element not found: ${field.id}`);
            }
        });
    }

    updateEditModeUI() {
        // Update the form title to show "Edit Video" instead of "Add New Video"
        const formTitle = document.querySelector('#add-video h3');
        if (formTitle) {
            formTitle.textContent = 'Edit Video';
        }
        
        // Update the submit button text
        const submitBtn = document.querySelector('#videoForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Video';
        }
    }

    async deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            console.log('Deleting video with ID:', videoId);
            const { error } = await supabase
                .from('videos')
                .delete()
                .eq('id', videoId);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }
            
            console.log('Video deleted successfully from database');
            this.displaySuccess('Video deleted successfully!');
            
            // Refresh all content
            this.loadAllContent();
        } catch (error) {
            console.error('Error deleting video:', error);
            this.displayError('Failed to delete video: ' + error.message);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const contentTypes = formData.getAll('contentTypes');
        
        console.log('Form data:', Object.fromEntries(formData.entries()));
        console.log('Content types:', contentTypes);

        // Prepare base post data
        const mappedData = {
            title: formData.get('title_en'),
            title_ar: formData.get('title_ar'),
            content: formData.get('content_en'),
            content_ar: formData.get('content_ar'),
            category: formData.get('category'),
            status: formData.get('status'),
            published: formData.get('status') === 'published',
            content_types: contentTypes.join(','), // Store multiple types as comma-separated
            updated_at: new Date().toISOString()
        };

        try {
            // Handle file uploads
            if (this.selectedFiles) {
                for (const [type, file] of Object.entries(this.selectedFiles)) {
                    const fileUrl = await this.uploadFile(file);
                    if (fileUrl) {
                        if (type === 'image') {
                            mappedData.image_url = fileUrl;
                            mappedData.featured_image_url = fileUrl;
                        } else if (type === 'pdf') {
                            mappedData.pdf_url = fileUrl;
                        }
                    }
                }
            }

            // Handle URL inputs
            const imageUrl = formData.get('image_url');
            const pdfUrl = formData.get('pdf_url');
            const externalLink = formData.get('external_link');
            const linkText = formData.get('link_text');

            if (imageUrl) {
                mappedData.image_url = imageUrl;
                mappedData.featured_image_url = imageUrl;
            }
            if (pdfUrl) {
                mappedData.pdf_url = pdfUrl;
            }
            if (externalLink) {
                mappedData.external_link = externalLink;
                mappedData.link_text = linkText;
            }

            console.log('Mapped data:', mappedData);

            if (this.currentEditingPost) {
                // Update existing post
                const { error } = await supabase
                    .from('blog_posts')
                    .update(mappedData)
                    .eq('id', this.currentEditingPost);

                if (error) throw error;
                this.displaySuccess('Post updated successfully!');
            } else {
                // Create new post - let Supabase generate the UUID
                const { error } = await supabase
                    .from('blog_posts')
                    .insert([mappedData]);

                if (error) throw error;
                this.displaySuccess('Post created successfully!');
            }

            this.resetForm();
            
            // Force refresh the blog posts
            setTimeout(() => {
                this.loadBlogPosts();
                this.loadPostsList();
                this.loadAllContent(); // Refresh unified content list
            }, 500);
        } catch (error) {
            console.error('Error saving post:', error);
            this.displayError('Failed to save post: ' + error.message);
        }
    }

    async uploadFile(file) {
        try {
            // For now, we'll use a simple approach with base64 encoding
            // In production, you'd want to use a proper file storage service
            const base64 = await this.fileToBase64(file);
            const fileUrl = `data:${file.type};base64,${base64}`;
            return fileUrl;
        } catch (error) {
            console.error('Error uploading file:', error);
            this.displayError('Error uploading file: ' + error.message);
            return null;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    async editPost(postId) {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;

            // Populate form with post data
            document.getElementById('postTitle').value = data.title || '';
            document.getElementById('postTitleAr').value = data.title_ar || '';
            document.getElementById('postContent').value = data.content || '';
            document.getElementById('postContentAr').value = data.content_ar || '';
            document.getElementById('postImage').value = data.image_url || data.featured_image_url || '';
            document.getElementById('postPdf').value = data.pdf_url || '';
            document.getElementById('postCategory').value = data.category || '';
            document.getElementById('postStatus').value = data.status || '';

            this.currentEditingPost = postId;
            this.switchTab('add');
        } catch (error) {
            console.error('Error loading post for editing:', error);
            this.displayError('Failed to load post for editing');
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const { error } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            this.displaySuccess('Post deleted successfully!');
            this.loadBlogPosts();
            this.loadPostsList();
            this.loadAllContent(); // Refresh unified content list
        } catch (error) {
            console.error('Error deleting post:', error);
            this.displayError('Failed to delete post');
        }
    }

    readMore(postId) {
        // This could open a modal with full content or navigate to a detail page
        console.log('Read more for post:', postId);
        // For now, just show an alert
        alert('Read more functionality - this would show the full post content');
    }

    async showFullArticle(postId) {
        try {
            // Fetch the full post data
            const { data: post, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;

            // Create and show the full article modal
            this.createFullArticleModal(post);
        } catch (error) {
            console.error('Error loading full article:', error);
            this.displayError('Failed to load full article');
        }
    }

    createFullArticleModal(post) {
        const currentLang = document.documentElement.lang || 'en';
        const title = currentLang === 'ar' ? (post.title_ar || post.title) : post.title;
        const content = currentLang === 'ar' ? (post.content_ar || post.content) : post.content;
        const category = this.getCategoryLabel(post.category);

        // Create modal HTML
        const modalHTML = `
            <div id="fullArticleModal" class="full-article-modal">
                <div class="full-article-content">
                    <div class="full-article-header">
                        <h2 class="full-article-title">${title}</h2>
                        <button class="close-full-article" onclick="blogManager.closeFullArticle()">&times;</button>
                    </div>
                    <div class="full-article-meta">
                        <span class="full-article-category">${category}</span>
                        <span class="full-article-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(post.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="full-article-body">
                        ${content.replace(/\n/g, '<br>')}
                    </div>
                    <div class="full-article-footer">
                        <button class="btn btn-primary" onclick="blogManager.closeFullArticle()">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('fullArticleModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById('fullArticleModal');
            if (modal) {
                modal.classList.add('active');
            }
        }, 10);
    }

    closeFullArticle() {
        const modal = document.getElementById('fullArticleModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    resetForm() {
        document.getElementById('blogForm').reset();
        this.currentEditingPost = null;
        this.selectedFiles = {};
        this.handleContentTypeChange();
        // Remove all file previews
        ['image', 'pdf'].forEach(type => this.removeFile(type));
    }

    setupFileUpload() {
        // Setup image upload
        this.setupFileUploadForType('image');
        // Setup PDF upload
        this.setupFileUploadForType('pdf');
    }

    setupFileUploadForType(type) {
        const uploadArea = document.getElementById(`${type}UploadArea`);
        const fileInput = document.getElementById(`${type}Input`);
        const uploadLinks = document.querySelectorAll(`#${type}UploadArea .file-upload-link`);

        // Click to upload
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
        }
        uploadLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        });

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0], type);
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0], type);
                }
            });
        }
    }

    handleContentTypeChange() {
        const checkedTypes = Array.from(document.querySelectorAll('input[name="contentTypes"]:checked'))
            .map(cb => cb.value);

        // Show/hide sections based on selected content types
        const imageUploadSection = document.getElementById('imageUploadSection');
        const pdfUploadSection = document.getElementById('pdfUploadSection');
        const imageUrlSection = document.getElementById('imageUrlSection');
        const pdfUrlSection = document.getElementById('pdfUrlSection');
        const linkInputSection = document.getElementById('linkInputSection');

        // Hide all sections first
        [imageUploadSection, pdfUploadSection, imageUrlSection, pdfUrlSection, linkInputSection]
            .forEach(section => {
                if (section) section.style.display = 'none';
            });

        // Show relevant sections based on selected types
        if (checkedTypes.includes('image')) {
            if (imageUploadSection) imageUploadSection.style.display = 'block';
            if (imageUrlSection) imageUrlSection.style.display = 'block';
        }
        if (checkedTypes.includes('pdf')) {
            if (pdfUploadSection) pdfUploadSection.style.display = 'block';
            if (pdfUrlSection) pdfUrlSection.style.display = 'block';
        }
        if (checkedTypes.includes('link')) {
            if (linkInputSection) linkInputSection.style.display = 'block';
        }
    }

    handleFileSelect(file, type) {
        if (!file) return;

        // Validate file type based on upload type
        let allowedTypes = [];
        if (type === 'image') {
            allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        } else if (type === 'pdf') {
            allowedTypes = ['application/pdf'];
        }

        if (!allowedTypes.includes(file.type)) {
            this.displayError(`Please select a valid ${type} file`);
            return;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.displayError('File size must be less than 10MB');
            return;
        }

        // Store file for upload
        if (!this.selectedFiles) this.selectedFiles = {};
        this.selectedFiles[type] = file;
        this.showFilePreview(file, type);
    }

    showFilePreview(file, type) {
        const filePreview = document.getElementById(`${type}Preview`);
        const fileName = filePreview?.querySelector('.file-name');
        const fileSize = filePreview?.querySelector('.file-size');
        const fileIcon = filePreview?.querySelector('.file-preview-icon');

        if (filePreview && fileName && fileSize && fileIcon) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            
            // Set icon based on file type
            fileIcon.className = 'file-preview-icon';
            if (type === 'image') {
                fileIcon.classList.add('image');
                fileIcon.innerHTML = '<i class="fas fa-image"></i>';
            } else if (type === 'pdf') {
                fileIcon.classList.add('pdf');
                fileIcon.innerHTML = '<i class="fas fa-file-pdf"></i>';
            }

            filePreview.style.display = 'block';
        }
    }

    removeFile(type) {
        if (this.selectedFiles) {
            delete this.selectedFiles[type];
        }
        const filePreview = document.getElementById(`${type}Preview`);
        const fileInput = document.getElementById(`${type}Input`);
        
        if (filePreview) filePreview.style.display = 'none';
        if (fileInput) fileInput.value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    openAdminModal() {
        if (this.isAdminLoggedIn) {
            document.getElementById('adminModal').style.display = 'block';
            this.loadAllContent();
        } else {
            document.getElementById('adminLoginModal').style.display = 'block';
        }
    }

    closeAdminModal() {
        document.getElementById('adminModal').style.display = 'none';
        this.resetForm();
    }

    closeLoginModal() {
        document.getElementById('adminLoginModal').style.display = 'none';
        document.getElementById('adminPassword').value = '';
    }

    handleAdminLogin(e) {
        e.preventDefault();
        
        // Check if account is locked out
        if (this.lockoutUntil && new Date() < this.lockoutUntil) {
            const remainingTime = Math.ceil((this.lockoutUntil - new Date()) / 60000);
            this.displayError(`Account locked. Try again in ${remainingTime} minutes.`);
            return;
        }
        
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            this.loginAttempts = 0;
            this.lockoutUntil = null;
            this.closeLoginModal();
            this.openAdminModal();
            this.displaySuccess('Welcome! You are now logged in as admin.');
            
            // Store login state in session storage
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.updateAdminButtonVisibility();
        } else {
            this.loginAttempts++;
            const maxAttempts = window.ADMIN_CONFIG?.maxLoginAttempts || 3;
            
            if (this.loginAttempts >= maxAttempts) {
                const lockoutDuration = window.ADMIN_CONFIG?.lockoutDuration || 15;
                this.lockoutUntil = new Date(Date.now() + lockoutDuration * 60000);
                this.displayError(`Too many failed attempts. Account locked for ${lockoutDuration} minutes.`);
            } else {
                const remainingAttempts = maxAttempts - this.loginAttempts;
                this.displayError(`Incorrect password. ${remainingAttempts} attempts remaining.`);
            }
            
            document.getElementById('adminPassword').value = '';
        }
    }

    setupHiddenAccess() {
        // Method 1: Secret click sequence
        this.setupSecretClick();
        
        // Method 2: Keyboard shortcut
        this.setupKeyboardShortcut();
        
        // Method 3: URL parameter
        this.checkUrlParameter();
    }

    setupSecretClick() {
        const config = window.ADMIN_CONFIG?.hiddenAccess?.secretClick;
        if (!config?.enabled) return;
        
        let clickCount = 0;
        let clickTimeout = null;
        
        // Add click listener to logo
        const logo = document.querySelector('.nav-logo');
        if (logo) {
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                clickCount++;
                
                // Clear existing timeout
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                }
                
                // Set new timeout to reset counter
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                }, config.resetTimeout);
                
                // Check if required clicks reached
                if (clickCount >= config.requiredClicks) {
                    clickCount = 0;
                    this.openLoginModal();
                }
            });
        }
        
        // Add click listener to secret area
        const secretArea = document.getElementById('secretAdminAccess');
        if (secretArea) {
            secretArea.addEventListener('click', (e) => {
                e.preventDefault();
                clickCount++;
                
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                }
                
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                }, config.resetTimeout);
                
                if (clickCount >= config.requiredClicks) {
                    clickCount = 0;
                    this.openLoginModal();
                }
            });
        }
    }

    setupKeyboardShortcut() {
        const config = window.ADMIN_CONFIG?.hiddenAccess?.keyboardShortcut;
        if (!config?.enabled) return;
        
        document.addEventListener('keydown', (e) => {
            const isCtrl = e.ctrlKey;
            const isShift = e.shiftKey;
            const key = e.key.toLowerCase();
            
            if (isCtrl && isShift && key === config.key) {
                e.preventDefault();
                this.openLoginModal();
            }
        });
    }

    checkUrlParameter() {
        const config = window.ADMIN_CONFIG?.hiddenAccess?.urlParameter;
        if (!config?.enabled) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const paramValue = urlParams.get(config.parameter);
        
        if (paramValue === config.value) {
            // Remove the parameter from URL for security
            const url = new URL(window.location);
            url.searchParams.delete(config.parameter);
            window.history.replaceState({}, document.title, url.pathname);
            
            this.openLoginModal();
        }
    }

    openLoginModal() {
        document.getElementById('adminLoginModal').style.display = 'flex';
        document.getElementById('adminPassword').focus();
    }

    checkAdminLogin() {
        // Check if admin is already logged in from session storage
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (isLoggedIn === 'true') {
            this.isAdminLoggedIn = true;
        }
        this.updateAdminButtonVisibility();
    }

    updateAdminButtonVisibility() {
        // Show/hide admin buttons based on login status
        const adminButtons = document.querySelectorAll('.admin-nav-btn, .footer-admin-btn');
        adminButtons.forEach(button => {
            if (this.isAdminLoggedIn) {
                button.style.display = 'inline-block';
            } else {
                button.style.display = 'none';
            }
        });
    }

    logoutAdmin() {
        this.isAdminLoggedIn = false;
        sessionStorage.removeItem('adminLoggedIn');
        this.closeAdminModal();
        this.updateAdminButtonVisibility();
        this.displaySuccess('You have been logged out.');
    }

    displaySuccess(message) {
        this.showNotification(message, 'success');
    }

    displayError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Video Management Class
class VideoManager {
    constructor() {
        this.currentEditingVideo = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadVideos();
    }

    setupEventListeners() {
        // Video form submission
        const videoForm = document.getElementById('videoForm');
        const cancelVideoForm = document.getElementById('cancelVideoForm');
        const videoModal = document.getElementById('videoModal');
        const videoModalClose = document.getElementById('videoModalClose');

        if (videoForm) {
            videoForm.addEventListener('submit', (e) => this.handleVideoFormSubmit(e));
        }
        
        
        // Handle thumbnail file input change
        const thumbnailFileInput = document.getElementById('thumbnailFileInput');
        if (thumbnailFileInput) {
            thumbnailFileInput.addEventListener('change', (e) => this.handleThumbnailInputChange(e));
        }
        
        // Handle remove thumbnail button
        const removeThumbnailBtn = document.getElementById('removeThumbnail');
        if (removeThumbnailBtn) {
            removeThumbnailBtn.addEventListener('click', () => this.removeThumbnail());
        }
        
        if (cancelVideoForm) {
            cancelVideoForm.addEventListener('click', () => this.resetVideoForm());
        }
        
        if (videoModalClose) {
            videoModalClose.addEventListener('click', () => this.closeVideoModal());
        }
        
        if (videoModal) {
            videoModal.addEventListener('click', (e) => {
                if (e.target === videoModal) this.closeVideoModal();
            });
        }
    }

    async loadVideos() {
        try {
            console.log('Loading videos...');
            
            // Check cache first (with error handling)
            const cacheKey = 'videos_cache';
            const cacheTimeKey = 'videos_cache_time';
            const now = Date.now();
            
            try {
                const cached = localStorage.getItem(cacheKey);
                const cacheTime = localStorage.getItem(cacheTimeKey);
                
                // Use cache if less than 5 minutes old
                if (cached && cacheTime && (now - parseInt(cacheTime)) < 300000) {
                    console.log('Using cached videos');
                    this.displayVideos(JSON.parse(cached));
                    return;
                }
            } catch (cacheError) {
                console.warn('Cache read error, proceeding with fresh data:', cacheError);
                // Clear corrupted cache
                this.clearVideoCache();
            }
            
            const { data: videos, error } = await supabase
                .from('videos')
                .select('id, title, title_ar, description, description_ar, video_url, thumbnail_url, category, duration, status, views, created_at')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(20); // Limit to prevent large cache

            if (error) throw error;
            
            // Try to cache the results (with error handling)
            try {
                const videosToCache = videos || [];
                const cacheData = JSON.stringify(videosToCache);
                
                // Check if data is too large (5MB limit)
                if (cacheData.length > 5 * 1024 * 1024) {
                    console.warn('Video data too large for cache, skipping cache');
                } else {
                    localStorage.setItem(cacheKey, cacheData);
                    localStorage.setItem(cacheTimeKey, now.toString());
                }
            } catch (cacheError) {
                console.warn('Cache write error, continuing without cache:', cacheError);
                
                // If it's a quota exceeded error, clear all cache
                if (cacheError.name === 'QuotaExceededError' || cacheError.message.includes('quota')) {
                    console.log('Quota exceeded, clearing all cache');
                    this.clearAllCache();
                } else {
                    // Clear cache if it's corrupted
                    this.clearVideoCache();
                }
            }
            
            this.displayVideos(videos || []);
        } catch (error) {
            console.error('Error loading videos:', error);
            this.displayError('Failed to load videos: ' + error.message);
        }
    }

    displayVideos(videos) {
        const videosGrid = document.getElementById('videosGrid');
        if (!videosGrid) {
            console.error('Videos grid element not found!');
            return;
        }

        if (videos.length === 0) {
            videosGrid.innerHTML = `
                <div class="no-videos" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--light-text);">
                    <i class="fas fa-video" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p>No videos available yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        const html = videos.map(video => this.createVideoCard(video)).join('');
        videosGrid.innerHTML = html;
    }

    createVideoCard(video) {
        const currentLang = document.documentElement.lang || 'en';
        const title = currentLang === 'ar' ? (video.title_ar || video.title) : video.title;
        const description = currentLang === 'ar' ? (video.description_ar || video.description) : video.description;
        
        let thumbnailUrl = video.thumbnail_url;
        let isFacebookVideo = false;
        let isYouTubeVideo = false;
        let isVimeoVideo = false;
        let isDeviceVideo = false;
        let platformIcon = '';
        let platformName = '';
        let platformColor = '';
        
        if (!thumbnailUrl && video.video_url) {
            if (video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')) {
                isYouTubeVideo = true;
                platformIcon = 'fab fa-youtube';
                platformName = 'YouTube';
                platformColor = '#ff0000';
                const videoId = this.extractYouTubeId(video.video_url);
                if (videoId) {
                    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                }
            } else if (video.video_url.includes('vimeo.com')) {
                isVimeoVideo = true;
                platformIcon = 'fab fa-vimeo';
                platformName = 'Vimeo';
                platformColor = '#1ab7ea';
            } else if (video.video_url.includes('facebook.com') || video.video_url.includes('fb.watch')) {
                isFacebookVideo = true;
                platformIcon = 'fab fa-facebook';
                platformName = 'Facebook';
                platformColor = '#1877f2';
            } else if (video.video_url.startsWith('data:video/')) {
                isDeviceVideo = true;
                platformIcon = 'fas fa-upload';
                platformName = 'Uploaded';
                platformColor = '#28a745';
                // For device videos, use the video itself as thumbnail if no custom thumbnail
                if (!thumbnailUrl) {
                    thumbnailUrl = video.video_url;
                }
            }
        }

        // Create platform-specific video card
        const platformClass = isFacebookVideo ? 'facebook-video-card' : 
                             isYouTubeVideo ? 'youtube-video-card' : 
                             isVimeoVideo ? 'vimeo-video-card' : 
                             isDeviceVideo ? 'device-video-card' : 'video-card';
        
        const playIcon = isFacebookVideo ? 'fas fa-external-link-alt' : 'fas fa-play';
        const platformInfo = platformName ? `
            <div class="platform-info" style="background: ${platformColor};">
                <i class="${platformIcon}"></i>
                <span>${platformName}</span>
            </div>
        ` : '';

        return `
            <div class="video-card ${platformClass}" data-id="${video.id}" onclick="videoManager.openVideo('${video.id}')">
                <div class="video-thumbnail">
                    ${isDeviceVideo ? `
                        <video preload="metadata" muted>
                            <source src="${video.video_url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    ` : thumbnailUrl ? `
                        <img src="${thumbnailUrl}" alt="${title}" loading="lazy">
                    ` : `
                        <div class="no-thumbnail">
                            <i class="${platformIcon}"></i>
                            <span>${platformName} Video</span>
                        </div>
                    `}
                    
                    <div class="video-overlay">
                        <div class="video-play-button">
                            <i class="${playIcon}"></i>
                        </div>
                        <div class="video-duration">${this.formatDuration(video.duration)}</div>
                        <div class="video-category" style="background: ${platformColor}20; color: ${platformColor}; border: 1px solid ${platformColor}40;">
                            ${this.getVideoCategoryLabel(video.category)}
                        </div>
                    </div>
                    
                    ${platformInfo}
                </div>
                
                <div class="video-content">
                    <div class="video-header">
                        <h3 class="video-title">${title}</h3>
                        <div class="video-platform-badge" style="background: ${platformColor};">
                            <i class="${platformIcon}"></i>
                        </div>
                    </div>
                    
                    <p class="video-description">${description}</p>
                    
                    <div class="video-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${this.formatDuration(video.duration)}</span>
                        </div>
                    </div>
                    
                    ${isFacebookVideo ? `
                        <div class="platform-link">
                            <small><i class="fab fa-facebook"></i> Click to open on Facebook</small>
                        </div>
                    ` : isDeviceVideo ? `
                        <div class="platform-link">
                            <small><i class="fas fa-upload"></i> Uploaded Video</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    extractFacebookId(url) {
        // Facebook video URL patterns - Updated for Reels and all Facebook video formats
        const patterns = [
            /facebook\.com\/watch\/\?v=(\d+)/,
            /facebook\.com\/.*\/videos\/(\d+)/,
            /facebook\.com\/reel\/(\d+)/,
            /facebook\.com\/.*\/reels\/(\d+)/,
            /fb\.watch\/([a-zA-Z0-9_-]+)/,
            /facebook\.com\/.*\/posts\/(\d+)/,
            /facebook\.com\/.*\/permalink\/(\d+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }


    isImageFile(file) {
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        return imageTypes.includes(file.type);
    }


    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }






    async uploadThumbnailFile(file) {
        try {
            console.log('Starting thumbnail upload:', file.name, 'Size:', file.size, 'Type:', file.type);
            
            // Check file size (limit to 5MB for images)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error(`Image too large. Please keep images under 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
            }
            
            // Convert to base64
            const base64 = await this.fileToBase64(file);
            const fileUrl = `data:${file.type};base64,${base64}`;
            
            console.log('Thumbnail uploaded successfully');
            return fileUrl;
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            throw error;
        }
    }

    handleThumbnailInputChange(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('Thumbnail selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB', 'Type:', file.type);
            
            // Validate file type
            if (!this.isImageFile(file)) {
                this.displayError('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)');
                e.target.value = ''; // Clear the input
                return;
            }
            
            // Check file size
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                this.displayError(`Image too large. Please keep images under 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
                e.target.value = ''; // Clear the input
                return;
            }
            
            // Show preview
            this.showThumbnailPreview(file);
            
            // Clear the URL input since we're using file upload
            const urlInput = document.getElementById('videoThumbnail');
            if (urlInput) {
                urlInput.value = '';
            }
        }
    }

    showThumbnailPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.getElementById('thumbnailPreviewContainer');
            const previewImg = document.getElementById('thumbnailPreview');
            
            if (previewContainer && previewImg) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }

    removeThumbnail() {
        const previewContainer = document.getElementById('thumbnailPreviewContainer');
        const thumbnailInput = document.getElementById('thumbnailFileInput');
        const urlInput = document.getElementById('videoThumbnail');
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        if (thumbnailInput) {
            thumbnailInput.value = '';
        }
        
        if (urlInput) {
            urlInput.value = '';
        }
        
        console.log('Thumbnail removed');
    }

    showVideoLoadingState() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'videoLoadingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-size: 18px;
        `;
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <div>Loading video...</div>
            </div>
        `;
        
        // Add CSS animation
        if (!document.getElementById('loadingAnimation')) {
            const style = document.createElement('style');
            style.id = 'loadingAnimation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loadingOverlay);
    }

    hideVideoLoadingState() {
        const loadingOverlay = document.getElementById('videoLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    clearVideoCache() {
        localStorage.removeItem('videos_cache');
        localStorage.removeItem('videos_cache_time');
        localStorage.removeItem('all_content_cache');
        localStorage.removeItem('all_content_cache_time');
        console.log('Video cache cleared');
    }

    clearAllCache() {
        // Clear all cache-related items
        const cacheKeys = [
            'videos_cache', 'videos_cache_time',
            'all_content_cache', 'all_content_cache_time',
            'posts_cache', 'posts_cache_time'
        ];
        
        cacheKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Error removing cache key ${key}:`, error);
            }
        });
        
        console.log('All cache cleared');
    }

    getLocalStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        return totalSize;
    }

    async retryQuery(queryFunction, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await queryFunction();
            } catch (error) {
                console.log(`Query attempt ${i + 1} failed:`, error.message);
                if (i === maxRetries - 1) throw error;
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }


    formatDuration(minutes) {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}:00`;
    }

    getVideoCategoryLabel(category) {
        const labels = {
            'lecture': 'Lecture', 'procedure': 'Procedure', 'education': 'Education',
            'research': 'Research', 'interview': 'Interview'
        };
        return labels[category] || category;
    }

    async openVideo(videoId) {
        try {
            console.log('Opening video with ID:', videoId);
            
            // Show loading state immediately
            this.showVideoLoadingState();
            
            // First check if it's a Facebook video
            const { data: video, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error) throw error;

            // If it's a Facebook video, open in new tab instead of modal
            if (video.video_url && (video.video_url.includes('facebook.com') || video.video_url.includes('fb.watch'))) {
                console.log('Facebook video detected, opening in new tab');
                this.hideVideoLoadingState();
                window.open(video.video_url, '_blank');
                return;
            }

            // For other videos, use the normal modal
            await this.fetchVideoAndOpen(videoId);
            this.hideVideoLoadingState();
        } catch (error) {
            console.error('Error opening video:', error);
            this.hideVideoLoadingState();
            this.displayError('Failed to open video');
        }
    }

    async fetchVideoAndOpen(videoId) {
        try {
            const { data: video, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error) throw error;
            this.showVideoModal(video);
        } catch (error) {
            console.error('Error fetching video:', error);
            this.displayError('Failed to load video');
        }
    }

    showVideoModal(video) {
        const modal = document.getElementById('videoModal');
        const title = document.getElementById('videoModalTitle');
        const description = document.getElementById('videoModalDescription');
        const player = document.getElementById('videoPlayer');

        if (!modal || !title || !description || !player) return;

        const currentLang = document.documentElement.lang || 'en';
        const videoTitle = currentLang === 'ar' ? (video.title_ar || video.title) : video.title;
        const videoDescription = currentLang === 'ar' ? (video.description_ar || video.description) : video.description;

        title.textContent = videoTitle;
        description.textContent = videoDescription;

        let playerHTML = '';
        const videoUrl = video.video_url;

        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(videoUrl);
            playerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>`;
        } else if (videoUrl.includes('vimeo.com')) {
            const videoId = this.extractVimeoId(videoUrl);
            playerHTML = `<iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
        } else if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
            // Facebook videos often get blocked, so show a preview card instead
            const videoId = this.extractFacebookId(videoUrl);
            playerHTML = `
                <div style="background: linear-gradient(135deg, #1877f2, #42a5f5); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 8px 32px rgba(24, 119, 242, 0.3);">
                    <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                    <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">Facebook Video</h3>
                    <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">This video is hosted on Facebook</p>
                    <div style="background: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 14px; word-break: break-all;">${videoUrl}</p>
                    </div>
                    <a href="${videoUrl}" target="_blank" style="
                        display: inline-block; 
                        background: white; 
                        color: #1877f2; 
                        padding: 12px 24px; 
                        border-radius: 8px; 
                        text-decoration: none; 
                        font-weight: 600; 
                        font-size: 16px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)'">
                        <i class="fab fa-facebook" style="margin-right: 8px;"></i>
                        Watch on Facebook
                    </a>
                    <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
                        Video ID: ${videoId || 'Unknown'}
                    </p>
                </div>
            `;
        } else if (videoUrl.startsWith('data:') || videoUrl.includes('.mp4') || videoUrl.includes('.mov') || videoUrl.includes('.avi')) {
            playerHTML = `<video controls autoplay style="width: 100%; height: 100%;"><source src="${videoUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
        } else {
            // Try to embed as iframe for other platforms
            playerHTML = `<iframe src="${videoUrl}" frameborder="0" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
        }

        player.innerHTML = playerHTML;
        modal.classList.add('active');
        this.incrementViewCount(video.id);
    }

    extractVimeoId(url) {
        const regExp = /vimeo\.com\/(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    async incrementViewCount(videoId) {
        try {
            await supabase.rpc('increment_video_views', { video_id: videoId });
        } catch (error) {
            console.error('Error updating view count:', error);
        }
    }

    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');
        if (modal) modal.classList.remove('active');
        if (player) player.innerHTML = '';
    }

    async loadVideosList() {
        try {
            console.log('Loading videos list for admin...');
            
            // Use a timeout promise to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            // Optimized query with specific fields and limit
            const queryPromise = supabase
                .from('videos')
                .select('id, title, title_ar, description, description_ar, video_url, thumbnail_url, category, duration, status, views, created_at')
                .order('created_at', { ascending: false })
                .limit(50); // Limit to prevent timeout

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Videos data received:', data);
            console.log('Number of videos:', data ? data.length : 0);
            
            // Show all videos in admin panel (both published and draft)
            this.displayVideosList(data || []);
        } catch (error) {
            console.error('Error loading videos list:', error);
            
            // Show more specific error messages
            if (error.message.includes('timeout') || error.message.includes('canceling statement')) {
                this.displayError('Database query timed out. Please try again or contact support if this persists.');
                
                // Show a fallback message in the videos list
                const videosList = document.getElementById('videosList');
                if (videosList) {
                    videosList.innerHTML = `
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 20px; margin: 10px; border-radius: 8px;">
                            <h4>⚠️ Database Timeout</h4>
                            <p>The database query timed out. This might be due to:</p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>High server load</li>
                                <li>Network connectivity issues</li>
                                <li>Large amount of data</li>
                            </ul>
                            <p>Please try refreshing the page or contact support if this persists.</p>
                            <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                                Refresh Page
                            </button>
                        </div>
                    `;
                }
            } else {
                this.displayError('Failed to load videos list: ' + error.message);
            }
        }
    }

    displayVideosList(videos) {
        const videosList = document.getElementById('videosList');
        console.log('Videos list element:', videosList);
        if (!videosList) {
            console.error('Videos list element not found!');
            return;
        }

        console.log('Displaying videos list:', videos.length, 'videos');
        console.log('Videos data:', videos);
        
        if (videos.length === 0) {
            videosList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-video" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 18px; margin-bottom: 10px;">No videos found</p>
                    <p style="font-size: 14px;">Create your first video using the "Add New Video" tab</p>
                </div>
            `;
            return;
        }

        // Force clear any existing content
        videosList.innerHTML = '';

        console.log('Creating video items HTML...');
        const videoItemsHTML = videos.map(video => `
            <div class="video-item" data-id="${video.id}" style="
                background: white;
                border: 1px solid #eee;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 16px;
            ">
                <div class="video-item-info" style="flex: 1;">
                    <h4 style="
                        font-weight: 600;
                        margin-bottom: 4px;
                        color: var(--text-color);
                    ">${video.title}</h4>
                    <p style="
                        font-size: 12px;
                        color: var(--light-text);
                        margin-bottom: 8px;
                        display: flex;
                        gap: 12px;
                        flex-wrap: wrap;
                    ">
                        <span class="status ${video.status}" style="
                            background: ${video.status === 'published' ? '#d4edda' : '#fff3cd'};
                            color: ${video.status === 'published' ? '#155724' : '#856404'};
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-weight: 600;
                            font-size: 10px;
                            text-transform: uppercase;
                        ">${video.status}</span>
                        <span style="color: #6c757d;">${new Date(video.created_at).toLocaleDateString()}</span>
                        <span style="color: #6c757d;">${this.getVideoCategoryLabel(video.category)}</span>
                        <span style="color: #6c757d;">${this.formatDuration(video.duration)}</span>
                    </p>
                </div>
                <div class="video-item-actions" style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" onclick="videoManager.editVideo('${video.id}')" style="
                        padding: 6px 12px;
                        font-size: 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="videoManager.deleteVideo('${video.id}')" style="
                        padding: 6px 12px;
                        font-size: 12px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('Video items HTML created, length:', videoItemsHTML.length);
        videosList.innerHTML = videoItemsHTML;
        console.log('Videos list innerHTML set, length:', videosList.innerHTML.length);
        console.log('Videos list children count:', videosList.children.length);
        
        // Force visibility and add debugging
        videosList.style.display = 'block';
        videosList.style.visibility = 'visible';
        videosList.style.opacity = '1';
        videosList.style.height = 'auto';
        videosList.style.minHeight = '200px';
        
        // Log the actual video items
        const videoItems = videosList.querySelectorAll('.video-item');
        console.log('Found video items:', videoItems.length);
        videoItems.forEach((item, index) => {
            console.log(`Video ${index + 1}:`, item);
            item.style.display = 'flex';
            item.style.visibility = 'visible';
            item.style.opacity = '1';
        });
        
        // Add a test element to make sure the container is visible
        if (videoItems.length === 0) {
            console.log('No video items found, adding test element...');
            videosList.innerHTML = `
                <div style="background: red; color: white; padding: 20px; margin: 10px; border-radius: 8px;">
                    <h3>TEST: Videos container is working!</h3>
                    <p>This is a test element to verify the container is visible.</p>
                    <p>Videos data: ${videos.length} videos loaded</p>
                </div>
            `;
        }
    }

    async handleVideoFormSubmit(e) {
        e.preventDefault();
        console.log('=== VIDEO FORM SUBMIT DEBUG ===');
        console.log('VideoManager.currentEditingVideo:', this.currentEditingVideo);
        console.log('Form data:', Object.fromEntries(new FormData(e.target)));
        
        const formData = new FormData(e.target);
        
        let videoUrl = formData.get('video_url');
        let thumbnailUrl = formData.get('thumbnail_url');
        const thumbnailFile = document.getElementById('thumbnailFileInput').files[0];
        
        
        // Handle thumbnail file upload
        if (thumbnailFile && this.isImageFile(thumbnailFile)) {
            try {
                console.log('Uploading thumbnail file:', thumbnailFile.name, 'Size:', (thumbnailFile.size / 1024 / 1024).toFixed(2) + 'MB');
                
                const fileUrl = await this.uploadThumbnailFile(thumbnailFile);
                if (fileUrl) {
                    thumbnailUrl = fileUrl;
                    console.log('Thumbnail uploaded successfully');
                }
                
            } catch (error) {
                console.error('Error uploading thumbnail file:', error);
                this.displayError('Failed to upload thumbnail file: ' + error.message);
                return;
            }
        } else if (thumbnailFile) {
            this.displayError('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)');
            return;
        }
        
        if (!videoUrl) {
            this.displayError('Please provide a video URL or upload a video file');
            return;
        }
        
        const videoData = {
            title: formData.get('title_en'),
            title_ar: formData.get('title_ar'),
            description: formData.get('description_en'),
            description_ar: formData.get('description_ar'),
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            category: formData.get('category'),
            duration: parseInt(formData.get('duration')) || 0,
            status: formData.get('status'),
            views: 0
        };

        try {
            console.log('Checking editing state...');
            console.log('this.currentEditingVideo:', this.currentEditingVideo);
            
            if (this.currentEditingVideo) {
                console.log('Updating existing video with ID:', this.currentEditingVideo);
                const { error } = await supabase
                    .from('videos')
                    .update(videoData)
                    .eq('id', this.currentEditingVideo);
                if (error) throw error;
                this.displaySuccess('Video updated successfully!');
            } else {
                console.log('Creating new video');
                const { error } = await supabase
                    .from('videos')
                    .insert([videoData]);
                if (error) throw error;
                this.displaySuccess('Video created successfully!');
            }

            this.resetVideoForm();
            
            // Clear editing state
            this.currentEditingVideo = null;
            
            // Reset form title and button text
            const formTitle = document.querySelector('#add-video h3');
            if (formTitle) {
                formTitle.textContent = 'Add New Video';
            }
            const submitBtn = document.querySelector('#videoForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Add Video';
            }
            
            // Clear cache and refresh the unified content list
            this.clearVideoCache();
            setTimeout(() => {
                if (window.blogManager) {
                    window.blogManager.loadAllContent();
                } else {
                    console.error('blogManager not found, cannot refresh content list');
                }
            }, 500);
        } catch (error) {
            console.error('Error saving video:', error);
            this.displayError('Failed to save video: ' + error.message);
        }
    }


    async deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            console.log('Deleting video with ID:', videoId);
            const { error } = await supabase
                .from('videos')
                .delete()
                .eq('id', videoId);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }
            
            console.log('Video deleted successfully from database');
            this.displaySuccess('Video deleted successfully!');
            
            // Refresh the unified content list
            if (window.blogManager) {
                window.blogManager.loadAllContent();
            } else {
                console.error('blogManager not found, cannot refresh content list');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            this.displayError('Failed to delete video: ' + error.message);
        }
    }

    resetVideoForm() {
        document.getElementById('videoForm').reset();
        this.currentEditingVideo = null;
        
        // Clear thumbnail preview
        const previewContainer = document.getElementById('thumbnailPreviewContainer');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        // Clear file inputs
        const videoFileInput = document.getElementById('videoFileInput');
        const thumbnailFileInput = document.getElementById('thumbnailFileInput');
        
        if (videoFileInput) {
            videoFileInput.value = '';
        }
        
        if (thumbnailFileInput) {
            thumbnailFileInput.value = '';
        }
    }

    displayError(message) {
        console.error('Error:', message);
        this.showNotification(message, 'error');
    }

    displaySuccess(message) {
        console.log('Success:', message);
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Test function to check if videos table exists
async function testVideosTable() {
    try {
        console.log('Testing videos table...');
        const { data, error } = await supabase
            .from('videos')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Videos table error:', error);
            if (error.code === 'PGRST116') {
                console.error('Videos table does not exist! Please create it in Supabase.');
                alert('Videos table does not exist! Please check the setup instructions.');
            } else if (error.message.includes('row-level security')) {
                console.error('RLS policy error:', error);
                alert('RLS Policy Error! Please run the RLS fix SQL in Supabase.');
            }
        } else {
            console.log('Videos table exists and is accessible');
        }
    } catch (err) {
        console.error('Error testing videos table:', err);
    }
}

// RLS Fix SQL - Run this in Supabase SQL Editor
window.getRLSFixSQL = function() {
    return `
-- Fix RLS policies for videos table
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON videos;
DROP POLICY IF EXISTS "Enable read access for all users" ON videos;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON videos;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON videos;

-- Create new policies
CREATE POLICY "Enable insert for all users" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON videos FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON videos FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON videos FOR DELETE USING (true);

-- Alternative: If you want to restrict to authenticated users only
-- CREATE POLICY "Enable insert for authenticated users only" ON videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable read access for all users" ON videos FOR SELECT USING (true);
-- CREATE POLICY "Enable update for authenticated users only" ON videos FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable delete for authenticated users only" ON videos FOR DELETE USING (auth.role() = 'authenticated');
`;
};

// Manual test function for videos - call this from browser console
async function testVideosLoading() {
    console.log('=== TESTING VIDEOS LOADING ===');
    
    try {
        // Test 1: Check if videos table exists
        console.log('1. Testing videos table access...');
        const { data: countData, error: countError } = await supabase
            .from('videos')
            .select('id', { count: 'exact' });
        
        if (countError) {
            console.error('❌ Videos table error:', countError);
            return;
        }
        console.log('✅ Videos table accessible, count:', countData.length);
        
        // Test 2: Get all videos
        console.log('2. Fetching all videos...');
        const { data: videos, error: videosError } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (videosError) {
            console.error('❌ Error fetching videos:', videosError);
            return;
        }
        
        console.log('✅ Videos fetched successfully:', videos);
        console.log('Number of videos:', videos.length);
        
        // Test 3: Check if videoManager exists
        console.log('3. Checking videoManager...');
        if (window.videoManager) {
            console.log('✅ videoManager exists');
            console.log('4. Testing displayVideosList...');
            window.videoManager.displayVideosList(videos);
        } else {
            console.error('❌ videoManager not found');
        }
        
    } catch (err) {
        console.error('❌ Test failed:', err);
    }
}

// Make test function available globally
window.testVideosLoading = testVideosLoading;

// Simple debug function to check videos
window.debugVideos = async function() {
    console.log('=== DEBUG VIDEOS ===');
    console.log('1. Checking videoManager:', window.videoManager);
    console.log('2. Checking videosList element:', document.getElementById('videosList'));
    
    if (window.videoManager) {
        console.log('3. Calling loadVideosList...');
        await window.videoManager.loadVideosList();
    } else {
        console.error('videoManager not found!');
    }
};

// Force display videos function
window.forceDisplayVideos = function() {
    console.log('=== FORCE DISPLAY VIDEOS ===');
    const videosList = document.getElementById('videosList');
    if (videosList) {
        videosList.innerHTML = `
            <div style="background: #007bff; color: white; padding: 20px; margin: 10px; border-radius: 8px;">
                <h3>FORCE TEST: Videos container is working!</h3>
                <p>This is a force test to verify the container is visible.</p>
                <p>If you can see this, the container is working properly.</p>
            </div>
        `;
        videosList.style.display = 'block';
        videosList.style.visibility = 'visible';
        videosList.style.opacity = '1';
        console.log('Force test element added to videosList');
    } else {
        console.error('videosList element not found!');
    }
};

// Test video delete function
window.testVideoDelete = async function(videoId) {
    console.log('=== TESTING VIDEO DELETE ===');
    console.log('Video ID to delete:', videoId);
    
    if (window.blogManager) {
        console.log('Calling blogManager.deleteVideo...');
        await window.blogManager.deleteVideo(videoId);
    } else {
        console.error('blogManager not found!');
    }
};

// Test video edit function
window.testVideoEdit = async function(videoId) {
    console.log('=== TESTING VIDEO EDIT ===');
    console.log('Video ID to edit:', videoId);
    
    if (window.blogManager) {
        console.log('Calling blogManager.editVideo...');
        await window.blogManager.editVideo(videoId);
    } else {
        console.error('blogManager not found!');
    }
};

// Test all video operations
window.testVideoOperations = function() {
    console.log('=== TESTING VIDEO OPERATIONS ===');
    console.log('BlogManager exists:', !!window.blogManager);
    console.log('VideoManager exists:', !!window.videoManager);
    console.log('Content list element:', document.getElementById('contentList'));
    
    // Test if video buttons are calling the right functions
    const videoItems = document.querySelectorAll('.content-item[data-type="video"]');
    console.log('Found video items:', videoItems.length);
    
    videoItems.forEach((item, index) => {
        const editBtn = item.querySelector('button[onclick*="editVideo"]');
        const deleteBtn = item.querySelector('button[onclick*="deleteVideo"]');
        console.log(`Video ${index + 1}:`, {
            id: item.dataset.id,
            editButton: editBtn ? editBtn.onclick.toString() : 'Not found',
            deleteButton: deleteBtn ? deleteBtn.onclick.toString() : 'Not found'
        });
    });
};

// Test edit functionality
window.testEditVideo = function(videoId) {
    console.log('=== TESTING EDIT VIDEO ===');
    console.log('Video ID:', videoId);
    console.log('BlogManager exists:', !!window.blogManager);
    console.log('VideoManager exists:', !!window.videoManager);
    
    if (window.blogManager) {
        console.log('Calling blogManager.editVideo...');
        window.blogManager.editVideo(videoId);
    } else {
        console.error('blogManager not found!');
    }
};

// Test form population
window.testFormPopulation = function() {
    console.log('=== TESTING FORM POPULATION ===');
    const testData = {
        title: 'Test Video',
        title_ar: 'فيديو تجريبي',
        description: 'Test description',
        description_ar: 'وصف تجريبي',
        video_url: 'https://www.youtube.com/watch?v=test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        category: 'lecture',
        duration: 120,
        status: 'published'
    };
    
    if (window.blogManager) {
        console.log('Testing form population with data:', testData);
        window.blogManager.populateVideoForm(testData);
    } else {
        console.error('blogManager not found!');
    }
};

// Test device video detection
window.testDeviceVideoDetection = function() {
    console.log('=== TESTING DEVICE VIDEO DETECTION ===');
    
    const testVideos = [
        { video_url: 'data:video/mp4;base64,ABC123', title: 'Device Video 1' },
        { video_url: 'https://www.youtube.com/watch?v=test', title: 'YouTube Video' },
        { video_url: 'https://www.facebook.com/watch?v=123', title: 'Facebook Video' },
        { video_url: 'https://example.com/video.mp4', title: 'Regular Video' }
    ];
    
    testVideos.forEach((video, index) => {
        const isDevice = video.video_url.startsWith('data:video/');
        const isYouTube = video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');
        const isFacebook = video.video_url.includes('facebook.com') || video.video_url.includes('fb.watch');
        
        console.log(`Video ${index + 1}: ${video.title}`);
        console.log(`  URL: ${video.video_url.substring(0, 50)}...`);
        console.log(`  Is Device Video: ${isDevice}`);
        console.log(`  Is YouTube: ${isYouTube}`);
        console.log(`  Is Facebook: ${isFacebook}`);
        console.log('---');
    });
};

// Test video loading
window.testVideoLoading = async function() {
    console.log('=== TESTING VIDEO LOADING ===');
    
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        console.log('Loaded videos:', videos.length);
        videos.forEach((video, index) => {
            console.log(`Video ${index + 1}:`);
            console.log(`  ID: ${video.id}`);
            console.log(`  Title: ${video.title}`);
            console.log(`  URL Type: ${video.video_url ? video.video_url.substring(0, 20) + '...' : 'No URL'}`);
            console.log(`  Is Device Video: ${video.video_url ? video.video_url.startsWith('data:video/') : false}`);
            console.log('---');
        });
        
        // Test display
        if (window.videoManager) {
            console.log('Testing video display...');
            window.videoManager.displayVideos(videos);
        }
        
    } catch (error) {
        console.error('Error loading videos:', error);
    }
};

// Test Facebook video URL parsing
window.testFacebookVideo = function(url) {
    console.log('=== TESTING FACEBOOK VIDEO URL ===');
    console.log('Input URL:', url);
    
    if (window.videoManager) {
        const videoId = window.videoManager.extractFacebookId(url);
        console.log('Extracted Video ID:', videoId);
        
        if (videoId) {
            console.log('✅ Facebook video ID extracted successfully');
            console.log('Embed URL would be:', `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&height=315&appId=`);
        } else {
            console.log('❌ Could not extract Facebook video ID');
            console.log('Supported patterns:');
            console.log('- facebook.com/watch/?v=VIDEO_ID');
            console.log('- facebook.com/.../videos/VIDEO_ID');
            console.log('- facebook.com/reel/VIDEO_ID');
            console.log('- facebook.com/.../reels/VIDEO_ID');
            console.log('- fb.watch/VIDEO_ID');
        }
    } else {
        console.error('VideoManager not found!');
    }
};

// Test Facebook video embedding
window.testFacebookEmbed = function(url) {
    console.log('=== TESTING FACEBOOK EMBED ===');
    console.log('Testing URL:', url);
    
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&height=315&appId=`;
    console.log('Embed URL:', embedUrl);
    
    // Create a test iframe
    const testDiv = document.createElement('div');
    testDiv.style.position = 'fixed';
    testDiv.style.top = '50%';
    testDiv.style.left = '50%';
    testDiv.style.transform = 'translate(-50%, -50%)';
    testDiv.style.width = '560px';
    testDiv.style.height = '315px';
    testDiv.style.zIndex = '10000';
    testDiv.style.backgroundColor = 'white';
    testDiv.style.border = '2px solid #1877f2';
    testDiv.style.borderRadius = '8px';
    testDiv.style.padding = '10px';
    
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.width = '560';
    iframe.height = '315';
    iframe.style.border = 'none';
    iframe.allowfullscreen = true;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Test';
    closeBtn.style.marginTop = '10px';
    closeBtn.style.padding = '5px 10px';
    closeBtn.onclick = () => testDiv.remove();
    
    testDiv.appendChild(iframe);
    testDiv.appendChild(closeBtn);
    document.body.appendChild(testDiv);
    
    console.log('Test iframe created. Check if video loads.');
};

// Test video file upload
window.testVideoFileUpload = function() {
    console.log('=== TESTING VIDEO FILE UPLOAD ===');
    
    // Create a test file input
    const testInput = document.createElement('input');
    testInput.type = 'file';
    testInput.accept = 'video/*';
    testInput.style.display = 'none';
    
    testInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Test file selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB', 'Type:', file.type);
            
            if (window.videoManager) {
                try {
                    console.log('Testing file validation...');
                    const isValid = window.videoManager.isVideoFile(file);
                    console.log('Is valid video file:', isValid);
                    
                    if (isValid) {
                        console.log('Testing file upload...');
                        const fileUrl = await window.videoManager.uploadVideoFile(file);
                        console.log('Upload result:', fileUrl ? 'Success' : 'Failed');
                        console.log('File URL length:', fileUrl ? fileUrl.length : 0);
                    }
                } catch (error) {
                    console.error('Upload test failed:', error);
                }
            } else {
                console.error('VideoManager not found!');
            }
        }
    });
    
    document.body.appendChild(testInput);
    testInput.click();
    
    // Clean up after a delay
    setTimeout(() => {
        if (testInput.parentNode) {
            testInput.parentNode.removeChild(testInput);
        }
    }, 10000);
};

// Initialize blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
    window.videoManager = new VideoManager();
    
    // Add global error handler for localStorage quota issues
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message && event.error.message.includes('quota')) {
            console.warn('localStorage quota exceeded, clearing cache');
            if (window.videoManager) {
                window.videoManager.clearAllCache();
            }
        }
    });
    
    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('quota')) {
            console.warn('localStorage quota exceeded in promise, clearing cache');
            if (window.videoManager) {
                window.videoManager.clearAllCache();
            }
        }
    });
    
    // Test videos table after a short delay
    setTimeout(async () => {
        await testVideosTable();
        // Also test if we can load videos
        if (window.videoManager) {
            console.log('Testing video loading on page load...');
            await window.videoManager.loadVideosList();
        }
    }, 1000);
});
