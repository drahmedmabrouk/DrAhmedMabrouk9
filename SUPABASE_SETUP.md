# Supabase Setup Guide for Blog System

## 🚀 Quick Setup Instructions

### 1. Create the Database Table

Go to your Supabase dashboard at https://supabase.com/dashboard and follow these steps:

1. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Create the Blog Posts Table**
   Copy and paste this SQL code:

```sql
-- Create blog_posts table
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    content TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    featured_image_url TEXT,
    pdf_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('research', 'article', 'news', 'case-study')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for better performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to published posts
CREATE POLICY "Published posts are viewable by everyone" ON blog_posts
    FOR SELECT USING (status = 'published');

-- Create policies for authenticated users to manage posts
-- Note: You'll need to set up authentication for full admin access
-- For now, we'll allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations for authenticated users" ON blog_posts
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

3. **Execute the Query**
   - Click "Run" to execute the SQL

### 2. Set Up Storage (Optional - for file uploads)

If you want to upload images and PDFs directly to Supabase:

1. **Go to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

2. **Create Buckets**
   - Create a bucket named `blog-images` for images
   - Create a bucket named `blog-pdfs` for PDF files
   - Set both buckets to public

3. **Set Storage Policies**
   - Go to "Policies" tab in each bucket
   - Add policy: "Public read access" with `bucket_id = 'blog-images'` and `true` for SELECT
   - Add policy: "Authenticated users can upload" with `bucket_id = 'blog-images'` and `auth.role() = 'authenticated'` for INSERT/UPDATE

### 3. Test the Connection

1. **Go to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - You should see your `blog_posts` table

2. **Insert a Test Post**
   - Click "Insert" → "Insert row"
   - Fill in the fields:
     - title_en: "Welcome to Our Blog"
     - title_ar: "مرحباً بكم في مدونتنا"
     - content_en: "This is our first blog post..."
     - content_ar: "هذا هو أول مقال في مدونتنا..."
     - category: "article"
     - status: "published"
   - Click "Save"

### 4. Configure API Access

1. **Go to Settings → API**
   - Copy your Project URL (should be: https://ukdjiptolebhuolvcbzj.supabase.co)
   - Copy your anon/public key (should be: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

2. **Verify the keys in your code**
   - Check that the keys in `supabase-config.js` match your Supabase project

## 🔧 Advanced Configuration (Optional)

### Enable Authentication (Recommended for Production)

1. **Go to Authentication → Settings**
   - Enable email authentication
   - Configure your site URL
   - Set up email templates

2. **Update the JavaScript code**
   - Add authentication checks in the admin panel
   - Only allow authenticated users to access admin functions

### Set Up Real-time Subscriptions

Add this to your Supabase setup if you want real-time updates:

```sql
-- Enable real-time for blog_posts table
ALTER PUBLICATION supabase_realtime ADD TABLE blog_posts;
```

## 🎯 How to Use the Admin Panel

### Accessing the Admin Panel

1. **Secret Key Combination**: Press `Ctrl + Shift + A` on your website
2. **Admin Button**: A gear icon will appear in the bottom right for 5 seconds
3. **Click the gear icon** to open the admin panel

### Managing Blog Posts

1. **View All Posts**: Click "Manage Posts" tab
2. **Add New Post**: Click "Add New Post" tab
3. **Edit Post**: Click "Edit" button next to any post
4. **Delete Post**: Click "Delete" button next to any post

### Post Fields Explained

- **Title (English/Arabic)**: The main title of your blog post
- **Content (English/Arabic)**: The main content/body of the post
- **Featured Image URL**: Link to an image (can be from Supabase Storage or external)
- **PDF URL**: Link to a PDF file (can be from Supabase Storage or external)
- **Category**: Type of content (Research Paper, Article, News, Case Study)
- **Status**: Published (visible to public) or Draft (hidden from public)

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to load blog posts"**
   - Check your Supabase URL and API key
   - Verify the table exists and has data
   - Check browser console for detailed error messages

2. **"Permission denied"**
   - Check your RLS policies
   - Make sure the table is accessible
   - Verify your API key has the correct permissions

3. **Admin panel not working**
   - Make sure you're using the correct key combination (Ctrl + Shift + A)
   - Check browser console for JavaScript errors
   - Verify all files are loaded correctly

### Testing the Setup

1. **Open your website**
2. **Press Ctrl + Shift + A** to show admin access
3. **Click the gear icon** to open admin panel
4. **Try adding a test post**
5. **Check if it appears on the main blog section**

## 📱 Mobile Responsiveness

The admin panel is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security Notes

- The current setup allows public access to create/edit posts
- For production use, consider adding authentication
- Regularly backup your Supabase database
- Monitor your API usage in the Supabase dashboard

## 🎨 Customization

You can customize:
- Blog post categories in the SQL table definition
- Admin panel styling in the CSS
- Form fields in the HTML
- JavaScript functionality in the config file

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase setup matches this guide
3. Test with a simple post first
4. Check your internet connection and Supabase service status



