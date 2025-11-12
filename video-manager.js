// Video Management Class
class VideoManager {
    constructor() {
        this.currentEditingVideo = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadVideos();
        this.initializeForm();
        
        // Add a global function to manually load videos list for debugging
        window.loadVideosListManually = () => {
            console.log('Manually loading videos list...');
            this.loadVideosList();
        };
        
        // Add comprehensive CRUD test function
        window.testVideoCRUD = async () => {
            console.log('🧪 Testing Video CRUD Operations...');
            
            try {
                // Test 1: CREATE
                console.log('1. Testing CREATE operation...');
                const testVideo = {
                    title: 'CRUD Test Video ' + new Date().getTime(),
                    title_ar: 'فيديو اختبار CRUD ' + new Date().getTime(),
                    description: 'This is a test video for CRUD operations',
                    description_ar: 'هذا فيديو اختبار لعمليات CRUD',
                    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiB2aWV3Qm94PSIwIDAgMTAwIDc1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiBmaWxsPSIjNjY3ZWVhIi8+CjxwYXRoIGQ9Ik00MCAyOEw2MCA0N0w0MCA2N1YyOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
                    category: 'test',
                    duration: 120,
                    status: 'published',
                    views: 0
                };
                
                const { data: createdVideo, error: createError } = await supabase
                    .from('videos')
                    .insert([testVideo])
                    .select();
                
                if (createError) throw createError;
                console.log('✅ CREATE successful:', createdVideo[0].id);
                
                // Test 2: READ
                console.log('2. Testing READ operation...');
                const { data: readVideo, error: readError } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('id', createdVideo[0].id)
                    .single();
                
                if (readError) throw readError;
                console.log('✅ READ successful:', readVideo.title);
                
                // Test 3: UPDATE
                console.log('3. Testing UPDATE operation...');
                const { data: updatedVideo, error: updateError } = await supabase
                    .from('videos')
                    .update({ 
                        title: 'Updated CRUD Test Video',
                        title_ar: 'فيديو اختبار CRUD محدث',
                        status: 'draft'
                    })
                    .eq('id', createdVideo[0].id)
                    .select();
                
                if (updateError) throw updateError;
                console.log('✅ UPDATE successful:', updatedVideo[0].title);
                
                // Test 4: DELETE
                console.log('4. Testing DELETE operation...');
                const { error: deleteError } = await supabase
                    .from('videos')
                    .delete()
                    .eq('id', createdVideo[0].id);
                
                if (deleteError) throw deleteError;
                console.log('✅ DELETE successful');
                
                console.log('🎉 All CRUD operations working correctly!');
                this.displaySuccess('All CRUD operations tested successfully!');
                
                // Refresh the video lists
                this.loadVideos();
                this.loadVideosList();
                
            } catch (error) {
                console.error('❌ CRUD test failed:', error);
                this.displayError('CRUD test failed: ' + error.message);
            }
        };
        
        // Add function to delete all videos
        window.deleteAllVideos = async () => {
            if (!confirm('Are you sure you want to delete ALL videos? This action cannot be undone!')) {
                return;
            }
            
            console.log('Deleting all videos...');
            try {
                const { error } = await supabase
                    .from('videos')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all videos
                
                if (error) throw error;
                
                console.log('All videos deleted successfully');
                this.displaySuccess('All videos have been deleted successfully!');
                this.loadVideos();
                this.loadVideosList();
            } catch (error) {
                console.error('Error deleting all videos:', error);
                this.displayError('Failed to delete all videos: ' + error.message);
            }
        };
        
        // Add function to create a test video
        window.createTestVideo = async () => {
            console.log('Creating test video...');
            try {
                const testVideo = {
                    title: 'Test Video ' + new Date().getTime(),
                    title_ar: 'فيديو تجريبي ' + new Date().getTime(),
                    description: 'This is a test video created for testing purposes',
                    description_ar: 'هذا فيديو تجريبي تم إنشاؤه لأغراض الاختبار',
                    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiB2aWV3Qm94PSIwIDAgMTAwIDc1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiBmaWxsPSIjNjY3ZWVhIi8+CjxwYXRoIGQ9Ik00MCAyOEw2MCA0N0w0MCA2N1YyOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
                    category: 'test',
                    duration: 120,
                    status: 'published',
                    views: 0
                };
                
                const { data, error } = await supabase
                    .from('videos')
                    .insert([testVideo])
                    .select();
                
                if (error) throw error;
                
                console.log('Test video created:', data[0]);
                this.displaySuccess('Test video created successfully!');
                this.loadVideosList();
                return data[0];
            } catch (error) {
                console.error('Error creating test video:', error);
                this.displayError('Failed to create test video: ' + error.message);
                return null;
            }
        };
        
        // Add function to force show videos with debugging
        window.forceShowVideos = () => {
            console.log('🔧 Force showing videos...');
            
            // Get videos list container
            const videosList = document.getElementById('videosList');
            if (!videosList) {
                console.error('❌ videosList element not found');
                return;
            }
            
            // Add debugging styles
            videosList.style.cssText = `
                background: #f8f9fa !important;
                border: 2px solid #28a745 !important;
                border-radius: 8px !important;
                padding: 20px !important;
                min-height: 200px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
            
            // Force show all video items
            const videoItems = document.querySelectorAll('.video-item');
            console.log('Found video items:', videoItems.length);
            
            videoItems.forEach((item, index) => {
                item.style.cssText = `
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background: white !important;
                    border: 2px solid #007bff !important;
                    border-radius: 8px !important;
                    padding: 20px !important;
                    margin-bottom: 20px !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                `;
                console.log(`Video ${index + 1} forced visible`);
            });
            
            if (videoItems.length === 0) {
                videosList.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; border: 2px dashed #dc3545;">
                        <h3 style="color: #dc3545;">No video items found in DOM</h3>
                        <p>Videos are being loaded but not displayed. Check console for details.</p>
                        <button onclick="loadVideosListManually()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Reload Videos
                        </button>
                    </div>
                `;
            }
            
            console.log('✅ Force show completed');
        };
        
        // Add a function to check what videos exist in the database
        window.checkVideosInDatabase = async () => {
            console.log('Checking videos in database...');
            try {
                const { data, error } = await supabase
                    .from('videos')
                    .select('id, title, status, created_at')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                console.log('Videos in database:', data);
                return data;
            } catch (error) {
                console.error('Error checking videos:', error);
                return null;
            }
        };
        
        // Add comprehensive diagnostic function
        window.diagnoseVideoManagement = async () => {
            console.log('🔍 Starting comprehensive video management diagnosis...');
            
            // 1. Check Supabase connection
            console.log('1. Testing Supabase connection...');
            try {
                const { data, error } = await supabase
                    .from('videos')
                    .select('count')
                    .limit(1);
                
                if (error) {
                    console.error('❌ Supabase connection failed:', error);
                    return { success: false, issue: 'Supabase connection failed', error };
                }
                console.log('✅ Supabase connection successful');
            } catch (err) {
                console.error('❌ Supabase connection error:', err);
                return { success: false, issue: 'Supabase connection error', error: err };
            }
            
            // 2. Check if videos table exists and has data
            console.log('2. Checking videos table...');
            try {
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .limit(5);
                
                if (error) {
                    console.error('❌ Videos table error:', error);
                    return { success: false, issue: 'Videos table error', error };
                }
                
                console.log('✅ Videos table accessible, found', data.length, 'videos');
                console.log('Sample video data:', data[0] || 'No videos found');
            } catch (err) {
                console.error('❌ Videos table error:', err);
                return { success: false, issue: 'Videos table error', error: err };
            }
            
            // 3. Check HTML elements
            console.log('3. Checking HTML elements...');
            const videosList = document.getElementById('videosList');
            const videosGrid = document.getElementById('videosGrid');
            const videoForm = document.getElementById('videoForm');
            
            console.log('videosList element:', videosList ? '✅ Found' : '❌ Missing');
            console.log('videosGrid element:', videosGrid ? '✅ Found' : '❌ Missing');
            console.log('videoForm element:', videoForm ? '✅ Found' : '❌ Missing');
            
            if (!videosList) {
                return { success: false, issue: 'videosList HTML element not found' };
            }
            
            // 4. Test video loading function
            console.log('4. Testing video loading...');
            try {
                await this.loadVideosList();
                console.log('✅ Video loading function executed successfully');
            } catch (err) {
                console.error('❌ Video loading failed:', err);
                return { success: false, issue: 'Video loading failed', error: err };
            }
            
            // 5. Check if videos are displayed
            console.log('5. Checking video display...');
            const videoItems = document.querySelectorAll('.video-item');
            console.log('Video items found in DOM:', videoItems.length);
            
            if (videoItems.length === 0) {
                console.log('❌ No video items found in DOM');
                return { success: false, issue: 'No video items displayed' };
            }
            
            console.log('✅ Video management system is working correctly!');
            return { success: true, videosCount: videoItems.length };
        };
        
        // Add function to test Supabase RLS policies
        window.testSupabaseRLS = async () => {
            console.log('🔐 Testing Supabase RLS policies...');
            
            try {
                // Test SELECT permission
                console.log('Testing SELECT permission...');
                const { data: selectData, error: selectError } = await supabase
                    .from('videos')
                    .select('id, title, status')
                    .limit(1);
                
                if (selectError) {
                    console.error('❌ SELECT permission denied:', selectError);
                    return { success: false, issue: 'SELECT permission denied', error: selectError };
                }
                console.log('✅ SELECT permission granted');
                
                // Test INSERT permission
                console.log('Testing INSERT permission...');
                const testVideo = {
                    title: 'Test Video',
                    title_ar: 'فيديو تجريبي',
                    description: 'Test description',
                    description_ar: 'وصف تجريبي',
                    video_url: 'https://example.com/test.mp4',
                    thumbnail_url: 'https://example.com/test.jpg',
                    category: 'test',
                    status: 'draft',
                    views: 0
                };
                
                const { data: insertData, error: insertError } = await supabase
                    .from('videos')
                    .insert([testVideo])
                    .select();
                
                if (insertError) {
                    console.error('❌ INSERT permission denied:', insertError);
                    return { success: false, issue: 'INSERT permission denied', error: insertError };
                }
                console.log('✅ INSERT permission granted, test video created:', insertData[0].id);
                
                // Test UPDATE permission
                console.log('Testing UPDATE permission...');
                const { error: updateError } = await supabase
                    .from('videos')
                    .update({ title: 'Updated Test Video' })
                    .eq('id', insertData[0].id);
                
                if (updateError) {
                    console.error('❌ UPDATE permission denied:', updateError);
                    return { success: false, issue: 'UPDATE permission denied', error: updateError };
                }
                console.log('✅ UPDATE permission granted');
                
                // Test DELETE permission
                console.log('Testing DELETE permission...');
                const { error: deleteError } = await supabase
                    .from('videos')
                    .delete()
                    .eq('id', insertData[0].id);
                
                if (deleteError) {
                    console.error('❌ DELETE permission denied:', deleteError);
                    return { success: false, issue: 'DELETE permission denied', error: deleteError };
                }
                console.log('✅ DELETE permission granted');
                
                console.log('✅ All RLS policies are working correctly!');
                return { success: true };
                
            } catch (err) {
                console.error('❌ RLS test failed:', err);
                return { success: false, issue: 'RLS test failed', error: err };
            }
        };
        
        // Add a function to clean up large base64 data
        window.cleanupVideoData = async () => {
            console.log('Cleaning up video data...');
            try {
                const { data, error } = await supabase
                    .from('videos')
                    .select('id, video_url')
                    .like('video_url', 'data:%');
                
                if (error) throw error;
                
                console.log('Found', data.length, 'videos with base64 data');
                
                // Update videos with base64 data to use placeholder URLs
                for (const video of data) {
                    const { error: updateError } = await supabase
                        .from('videos')
                        .update({ 
                            video_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+VmlkZW8gVVJMIFJlcXVpcmVkPC90ZXh0Pgo8L3N2Zz4K',
                            thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K'
                        })
                        .eq('id', video.id);
                    
                    if (updateError) {
                        console.error('Error updating video', video.id, ':', updateError);
                    } else {
                        console.log('Updated video', video.id);
                    }
                }
                
                console.log('Cleanup completed');
                this.displaySuccess('Video data cleanup completed');
            } catch (error) {
                console.error('Error during cleanup:', error);
                this.displayError('Cleanup failed: ' + error.message);
            }
        };
    }

    initializeForm() {
        // Initialize video source selection
        this.handleVideoSourceChange();
    }

    setupEventListeners() {
        console.log('Setting up video event listeners...');
        
        const videoForm = document.getElementById('videoForm');
        const cancelVideoForm = document.getElementById('cancelVideoForm');
        const videoModal = document.getElementById('videoModal');
        const videoModalClose = document.getElementById('videoModalClose');

        if (videoForm) {
            console.log('Video form found, adding submit listener');
            videoForm.addEventListener('submit', (e) => this.handleVideoFormSubmit(e));
        } else {
            console.error('Video form not found!');
        }
        
        if (cancelVideoForm) {
            console.log('Cancel button found, adding click listener');
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

        // Video source selection
        const videoSourceRadios = document.querySelectorAll('input[name="video_source"]');
        console.log('Found video source radios:', videoSourceRadios.length);
        videoSourceRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleVideoSourceChange());
        });

        // Video file upload
        this.setupVideoFileUpload();
        
        // Add refresh button listener
        const refreshVideosBtn = document.querySelector('[onclick*="loadVideos"]');
        if (refreshVideosBtn) {
            refreshVideosBtn.addEventListener('click', () => {
                this.loadVideos();
                this.loadVideosList();
            });
        }
        
        console.log('Video event listeners setup complete');
    }

    handleVideoSourceChange() {
        const selectedSourceRadio = document.querySelector('input[name="video_source"]:checked');
        if (!selectedSourceRadio) {
            // Default to URL if no selection
            const urlRadio = document.querySelector('input[name="video_source"][value="url"]');
            if (urlRadio) urlRadio.checked = true;
            return this.handleVideoSourceChange();
        }
        
        const selectedSource = selectedSourceRadio.value;
        const urlSection = document.getElementById('videoUrlSection');
        const uploadSection = document.getElementById('videoUploadSection');
        const videoUrlInput = document.getElementById('videoUrl');

        console.log('Video source changed to:', selectedSource);

        if (selectedSource === 'url') {
            if (urlSection) urlSection.style.display = 'block';
            if (uploadSection) uploadSection.style.display = 'none';
            if (videoUrlInput) videoUrlInput.required = true;
        } else {
            if (urlSection) urlSection.style.display = 'none';
            if (uploadSection) uploadSection.style.display = 'block';
            if (videoUrlInput) videoUrlInput.required = false;
        }
    }

    setupVideoFileUpload() {
        const uploadArea = document.getElementById('videoUploadArea');
        const fileInput = document.getElementById('videoFileInput');
        const uploadLinks = document.querySelectorAll('#videoUploadArea .file-upload-link');

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
                this.handleVideoFileSelect(e.target.files[0]);
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
                    this.handleVideoFileSelect(files[0]);
                }
            });
        }
    }

    handleVideoFileSelect(file) {
        if (!file) return;

        console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            this.displayError('Please select a valid video file (MP4, WebM, or MOV)');
            return;
        }

        // Validate file size (50MB max for better performance)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.displayError('Video file size must be less than 50MB for better performance');
            return;
        }

        // Check if file is too small (might be corrupted)
        if (file.size < 1024) { // Less than 1KB
            this.displayError('File appears to be corrupted or too small');
            return;
        }

        // Store file for upload
        this.selectedVideoFile = file;
        this.showVideoFilePreview(file);
        
        console.log('File validation passed, ready for upload');
    }

    showVideoFilePreview(file) {
        const filePreview = document.getElementById('videoFilePreview');
        const fileName = filePreview?.querySelector('.file-name');
        const fileSize = filePreview?.querySelector('.file-size');
        const fileIcon = filePreview?.querySelector('.file-preview-icon');

        if (filePreview && fileName && fileSize && fileIcon) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            
            fileIcon.className = 'file-preview-icon video';
            fileIcon.innerHTML = '<i class="fas fa-video"></i>';

            filePreview.style.display = 'block';
        }
    }

    removeVideoFile() {
        this.selectedVideoFile = null;
        const filePreview = document.getElementById('videoFilePreview');
        const fileInput = document.getElementById('videoFileInput');
        
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

    async loadVideos() {
        try {
            // Only load essential fields for the main page to avoid performance issues
            const { data: videos, error } = await supabase
                .from('videos')
                .select('id, title, title_ar, description, description_ar, video_url, thumbnail_url, category, duration, views, created_at')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(20); // Limit to 20 videos for main page

            if (error) throw error;
            this.displayVideos(videos || []);
        } catch (error) {
            console.error('Error loading videos:', error);
            this.displayError('Failed to load videos: ' + error.message);
        }
    }

    displayVideos(videos) {
        const videosGrid = document.getElementById('videosGrid');
        if (!videosGrid) return;

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
        if (!thumbnailUrl && video.video_url) {
            if (video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')) {
                const videoId = this.extractYouTubeId(video.video_url);
                if (videoId) {
                    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                }
            }
        }

        return `
            <div class="video-card" data-id="${video.id}" onclick="videoManager.openVideo('${video.id}')">
                <div class="video-thumbnail">
                    ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${title}" loading="lazy">` : ''}
                    <div class="video-play-button"><i class="fas fa-play"></i></div>
                    <div class="video-duration">${this.formatDuration(video.duration)}</div>
                    <div class="video-category">${this.getVideoCategoryLabel(video.category)}</div>
                </div>
                <div class="video-content">
                    <h3 class="video-title">${title}</h3>
                    <p class="video-description">${description}</p>
                    <div class="video-meta">
                        <span class="video-date"><i class="fas fa-calendar"></i> ${new Date(video.created_at).toLocaleDateString()}</span>
                        <span class="video-views"><i class="fas fa-eye"></i> ${video.views || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
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

    openVideo(videoId) {
        this.fetchVideoAndOpen(videoId);
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
        } else if (videoUrl.includes('facebook.com/reel/') || videoUrl.includes('fb.watch/')) {
            // Facebook Reels - redirect to Facebook
            playerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <i class="fab fa-facebook" style="font-size: 48px; color: #1877f2; margin-bottom: 20px;"></i>
                    <h3>Facebook Reel</h3>
                    <p>This video is hosted on Facebook. Click the button below to watch it.</p>
                    <a href="${videoUrl}" target="_blank" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fab fa-facebook"></i> Watch on Facebook
                    </a>
                </div>
            `;
        } else if (videoUrl.includes('instagram.com/p/') || videoUrl.includes('instagram.com/reel/')) {
            // Instagram - redirect to Instagram
            playerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <i class="fab fa-instagram" style="font-size: 48px; color: #e4405f; margin-bottom: 20px;"></i>
                    <h3>Instagram Video</h3>
                    <p>This video is hosted on Instagram. Click the button below to watch it.</p>
                    <a href="${videoUrl}" target="_blank" class="btn btn-primary" style="margin-top: 20px; background: #e4405f;">
                        <i class="fab fa-instagram"></i> Watch on Instagram
                    </a>
                </div>
            `;
        } else if (videoUrl.includes('tiktok.com/@')) {
            // TikTok - redirect to TikTok
            playerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <i class="fab fa-tiktok" style="font-size: 48px; color: #000000; margin-bottom: 20px;"></i>
                    <h3>TikTok Video</h3>
                    <p>This video is hosted on TikTok. Click the button below to watch it.</p>
                    <a href="${videoUrl}" target="_blank" class="btn btn-primary" style="margin-top: 20px; background: #000000;">
                        <i class="fab fa-tiktok"></i> Watch on TikTok
                    </a>
                </div>
            `;
        } else if (videoUrl.startsWith('data:video/') || videoUrl.match(/\.(mp4|webm|mov)$/i)) {
            // Direct video files or base64 videos
            const videoType = videoUrl.startsWith('data:') ? 
                videoUrl.split(';')[0].split(':')[1] : 
                this.getVideoMimeType(videoUrl);
            
            playerHTML = `<video controls autoplay style="width: 100%; height: 100%;"><source src="${videoUrl}" type="${videoType}">Your browser does not support the video tag.</video>`;
        } else {
            // Generic video link - show link
            playerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <i class="fas fa-video" style="font-size: 48px; color: var(--primary-color); margin-bottom: 20px;"></i>
                    <h3>External Video</h3>
                    <p>This video is hosted externally. Click the button below to watch it.</p>
                    <a href="${videoUrl}" target="_blank" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-external-link-alt"></i> Watch Video
                    </a>
                </div>
            `;
        }

        player.innerHTML = playerHTML;
        modal.classList.add('active');
        this.incrementViewCount(video.id);
    }

    getVideoMimeType(url) {
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.webm')) return 'video/webm';
        if (url.includes('.mov')) return 'video/quicktime';
        return 'video/mp4'; // default
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
            console.log('Loading videos list for admin panel...');
            
            // Show loading indicator
            const videosList = document.getElementById('videosList');
            if (videosList) {
                videosList.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
                        <p style="color: #6c757d;">Loading videos...</p>
                    </div>
                `;
            }
            
            // Load all videos (both published and draft) for admin management
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Videos data received:', data);
            this.displayVideosList(data || []);
        } catch (error) {
            console.error('Error loading videos list:', error);
            this.displayError('Failed to load videos list: ' + error.message);
            
            // Show error message in the videos list
            const videosList = document.getElementById('videosList');
            if (videosList) {
                videosList.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; border: 2px solid #dc3545;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                        <h3 style="color: #dc3545; margin-bottom: 10px;">Error Loading Videos</h3>
                        <p style="color: #6c757d; margin-bottom: 20px;">${error.message}</p>
                        <button onclick="loadVideosListManually()" style="
                            padding: 10px 20px; 
                            background: #007bff; 
                            color: white; 
                            border: none; 
                            border-radius: 4px; 
                            cursor: pointer;
                        ">Try Again</button>
                    </div>
                `;
            }
        }
    }

    displayVideosList(videos) {
        console.log('Displaying videos list:', videos);
        const videosList = document.getElementById('videosList');
        if (!videosList) {
            console.error('videosList element not found!');
            return;
        }

        console.log('videosList element found:', videosList);

        if (videos.length === 0) {
            console.log('No videos found, showing empty message');
            videosList.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; border: 2px dashed #dee2e6;">
                    <i class="fas fa-video" style="font-size: 48px; color: #6c757d; margin-bottom: 20px;"></i>
                    <h3 style="color: #6c757d; margin-bottom: 10px;">No videos found</h3>
                    <p style="color: #6c757d;">Create your first video using the "Add New Video" tab</p>
                </div>
            `;
            return;
        }

        console.log('Rendering', videos.length, 'videos');
        const html = videos.map(video => {
            const title = video.title || 'Untitled Video';
            const status = video.status || 'draft';
            const category = video.category || 'general';
            const duration = video.duration || 0;
            const createdDate = video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Unknown date';
            
            return `
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
                        ">${title}</h4>
                        <p style="
                            font-size: 12px;
                            color: var(--light-text);
                            margin-bottom: 8px;
                            display: flex;
                            gap: 12px;
                            flex-wrap: wrap;
                        ">
                            <span class="status ${status}" style="
                                background: ${status === 'published' ? '#d4edda' : '#fff3cd'};
                                color: ${status === 'published' ? '#155724' : '#856404'};
                                padding: 2px 6px;
                                border-radius: 3px;
                                font-weight: 600;
                                font-size: 10px;
                                text-transform: uppercase;
                            ">${status}</span>
                            <span style="color: #6c757d;">${createdDate}</span>
                            <span style="color: #6c757d;">${this.getVideoCategoryLabel(category)}</span>
                            <span style="color: #6c757d;">${this.formatDuration(duration)}</span>
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
            `;
        }).join('');
        
        console.log('Generated HTML:', html);
        videosList.innerHTML = html;
        
        // Force visibility and check if elements are rendered
        setTimeout(() => {
            const videoItems = videosList.querySelectorAll('.video-item');
            console.log('Video items rendered:', videoItems.length);
            videoItems.forEach((item, index) => {
                console.log(`Video ${index + 1}:`, {
                    id: item.dataset.id,
                    title: item.querySelector('h4')?.textContent,
                    status: item.querySelector('.status')?.textContent
                });
            });
        }, 100);
    }

    async handleVideoFormSubmit(e) {
        e.preventDefault();
        console.log('Video form submitted');
        
        const formData = new FormData(e.target);
        const videoSource = formData.get('video_source');
        
        console.log('Video source:', videoSource);
        console.log('Selected video file:', this.selectedVideoFile);
        console.log('Form data:', Object.fromEntries(formData.entries()));

        // Get form values with fallbacks for different field names
        const titleEn = formData.get('title_en') || formData.get('videoTitleEn') || formData.get('videoTitle');
        const titleAr = formData.get('title_ar') || formData.get('videoTitleAr');
        const descriptionEn = formData.get('description_en') || formData.get('videoDescriptionEn') || formData.get('videoDescription');
        const descriptionAr = formData.get('description_ar') || formData.get('videoDescriptionAr');
        const videoUrl = formData.get('video_url') || formData.get('videoUrl');
        const thumbnailUrl = formData.get('thumbnail_url') || formData.get('videoThumbnail');
        const category = formData.get('category') || formData.get('videoCategory');
        const duration = formData.get('duration') || formData.get('videoDuration');
        const status = formData.get('status') || formData.get('videoStatus');

        // Validate required fields
        if (!titleEn || !titleAr) {
            this.displayError('Please fill in both English and Arabic titles');
            return;
        }

        if (!descriptionEn || !descriptionAr) {
            this.displayError('Please fill in both English and Arabic descriptions');
            return;
        }

        let finalVideoUrl = videoUrl;

        // Handle file upload
        if (videoSource === 'upload') {
            if (!this.selectedVideoFile) {
                this.displayError('Please select a video file to upload');
                return;
            }
            
            try {
                console.log('Uploading video file...');
                finalVideoUrl = await this.uploadVideoFile(this.selectedVideoFile);
                if (!finalVideoUrl) {
                    this.displayError('Failed to upload video file');
                    return;
                }
                console.log('Video uploaded successfully:', finalVideoUrl.substring(0, 50) + '...');
            } catch (error) {
                console.error('Error uploading video:', error);
                this.displayError('Error uploading video: ' + error.message);
                return;
            }
        } else {
            // URL source
            if (!finalVideoUrl || finalVideoUrl.trim() === '') {
                this.displayError('Please enter a video URL');
                return;
            }
        }

        // Auto-generate thumbnail for supported platforms
        let finalThumbnailUrl = thumbnailUrl;
        if (!finalThumbnailUrl && finalVideoUrl) {
            finalThumbnailUrl = this.generateThumbnailUrl(finalVideoUrl);
        }

        const videoData = {
            title: titleEn,
            title_ar: titleAr,
            description: descriptionEn,
            description_ar: descriptionAr,
            video_url: finalVideoUrl,
            thumbnail_url: finalThumbnailUrl,
            category: category || 'general',
            duration: parseInt(duration) || 0,
            status: status || 'draft',
            views: 0
        };

        console.log('Saving video data:', videoData);

        try {
            if (this.currentEditingVideo) {
                console.log('Updating existing video:', this.currentEditingVideo);
                const { data, error } = await supabase
                    .from('videos')
                    .update(videoData)
                    .eq('id', this.currentEditingVideo)
                    .select();
                if (error) throw error;
                console.log('Video updated successfully:', data);
                this.displaySuccess('Video updated successfully!');
            } else {
                console.log('Creating new video');
                const { data, error } = await supabase
                    .from('videos')
                    .insert([videoData])
                    .select();
                if (error) throw error;
                console.log('Video created successfully:', data);
                this.displaySuccess('Video created successfully!');
            }

            this.resetVideoForm();
            setTimeout(() => {
                this.loadVideos();
                this.loadVideosList();
            }, 500);
        } catch (error) {
            console.error('Error saving video:', error);
            this.displayError('Failed to save video: ' + error.message);
        }
    }

    async uploadVideoFile(file) {
        try {
            // Show loading indicator
            this.showUploadProgress('Processing video file...');
            
            console.log('Starting file processing for:', file.name, 'Size:', file.size);
            
            // For now, we'll use a placeholder approach
            // In production, you should use Supabase Storage or another file storage service
            this.displayError('Video file upload is temporarily disabled. Please use video URLs instead (YouTube, Vimeo, etc.)');
            this.hideUploadProgress();
            
            // Return a placeholder URL for now
            return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+VmlkZW8gVXBsb2FkIERpc2FibGVkPC90ZXh0Pgo8L3N2Zz4K`;
            
        } catch (error) {
            console.error('Error uploading video file:', error);
            this.hideUploadProgress();
            this.displayError('Error processing video file: ' + error.message);
            throw error;
        }
    }

    showUploadProgress(message) {
        // Create or update progress indicator
        let progressDiv = document.getElementById('uploadProgress');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'uploadProgress';
            progressDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10001;
                text-align: center;
            `;
            document.body.appendChild(progressDiv);
        }
        progressDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
            </div>
            <div>${message}</div>
        `;
    }

    hideUploadProgress() {
        const progressDiv = document.getElementById('uploadProgress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            console.log('Starting FileReader for file:', file.name);
            
            const reader = new FileReader();
            
            reader.onloadstart = () => {
                console.log('FileReader started');
                this.showUploadProgress('Reading video file...');
            };
            
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    console.log('File reading progress:', Math.round(percentComplete) + '%');
                    this.showUploadProgress(`Reading video file... ${Math.round(percentComplete)}%`);
                }
            };
            
            reader.onload = () => {
                console.log('FileReader completed successfully');
                this.showUploadProgress('Converting to base64...');
                
                try {
                    const result = reader.result;
                    if (result && result.includes(',')) {
                        const base64 = result.split(',')[1];
                        console.log('Base64 conversion successful, length:', base64.length);
                        resolve(base64);
                    } else {
                        reject(new Error('Invalid file data received'));
                    }
                } catch (error) {
                    console.error('Error processing file data:', error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(new Error('Failed to read file: ' + error.message));
            };
            
            reader.onabort = () => {
                console.error('FileReader aborted');
                reject(new Error('File reading was aborted'));
            };
            
            try {
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error starting FileReader:', error);
                reject(error);
            }
        });
    }

    generateThumbnailUrl(videoUrl) {
        // YouTube
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(videoUrl);
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
        }
        
        // Vimeo
        if (videoUrl.includes('vimeo.com')) {
            const videoId = this.extractVimeoId(videoUrl);
            if (videoId) {
                // Vimeo requires API call for thumbnail, using placeholder for now
                return 'https://via.placeholder.com/640x360/667eea/ffffff?text=Vimeo+Video';
            }
        }
        
        // Facebook Reels
        if (videoUrl.includes('facebook.com/reel/') || videoUrl.includes('fb.watch/')) {
            return 'https://via.placeholder.com/640x360/1877f2/ffffff?text=Facebook+Reel';
        }
        
        // Instagram
        if (videoUrl.includes('instagram.com/p/') || videoUrl.includes('instagram.com/reel/')) {
            return 'https://via.placeholder.com/640x360/e4405f/ffffff?text=Instagram+Video';
        }
        
        // TikTok
        if (videoUrl.includes('tiktok.com/@')) {
            return 'https://via.placeholder.com/640x360/000000/ffffff?text=TikTok+Video';
        }
        
        // Direct video files
        if (videoUrl.match(/\.(mp4|webm|mov)$/i)) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiBmaWxsPSIjMmM1NTMwIi8+Cjx0ZXh0IHg9IjMyMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+VmlkZW8gRmlsZTwvdGV4dD4KPC9zdmc+Cg==';
        }
        
        return null;
    }

    extractVimeoId(url) {
        const regExp = /vimeo\.com\/(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    async editVideo(videoId) {
        try {
            console.log('Loading video for editing:', videoId);
            
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error) {
                console.error('Error fetching video:', error);
                throw error;
            }

            console.log('Video data loaded:', data);

            // Map form fields with fallbacks
            const fieldMappings = [
                { id: 'videoTitle', value: data.title },
                { id: 'videoTitleEn', value: data.title },
                { id: 'videoTitleAr', value: data.title_ar },
                { id: 'videoDescription', value: data.description },
                { id: 'videoDescriptionEn', value: data.description },
                { id: 'videoDescriptionAr', value: data.description_ar },
                { id: 'videoUrl', value: data.video_url },
                { id: 'videoThumbnail', value: data.thumbnail_url },
                { id: 'videoCategory', value: data.category },
                { id: 'videoDuration', value: data.duration },
                { id: 'videoStatus', value: data.status }
            ];

            // Populate form fields
            fieldMappings.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = field.value || '';
                }
            });

            // Set video source based on URL
            if (data.video_url && data.video_url.startsWith('http')) {
                const urlRadio = document.querySelector('input[name="video_source"][value="url"]');
                if (urlRadio) {
                    urlRadio.checked = true;
                    this.handleVideoSourceChange();
                }
            }

            this.currentEditingVideo = videoId;
            
            // Switch to add video tab
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => btn.classList.remove('active'));
            const addVideoTab = document.querySelector('[data-tab="add-video"]');
            if (addVideoTab) {
                addVideoTab.classList.add('active');
            }
            
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            const addVideoContent = document.getElementById('add-video');
            if (addVideoContent) {
                addVideoContent.classList.add('active');
            }
            
            this.displaySuccess('Video loaded for editing');
        } catch (error) {
            console.error('Error loading video for editing:', error);
            this.displayError('Failed to load video for editing: ' + error.message);
        }
    }

    async deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            const { error } = await supabase
                .from('videos')
                .delete()
                .eq('id', videoId);

            if (error) throw error;
            this.displaySuccess('Video deleted successfully!');
            this.loadVideos();
            this.loadVideosList();
        } catch (error) {
            console.error('Error deleting video:', error);
            this.displayError('Failed to delete video');
        }
    }

    resetVideoForm() {
        document.getElementById('videoForm').reset();
        this.currentEditingVideo = null;
        this.selectedVideoFile = null;
        
        // Reset form sections
        this.handleVideoSourceChange();
        this.removeVideoFile();
    }

    displayError(message) {
        this.showNotification(message, 'error');
    }

    displaySuccess(message) {
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

// Initialize video manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoManager = new VideoManager();
});
