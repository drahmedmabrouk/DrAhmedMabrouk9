-- Update Supabase schema to support enhanced blog functionality
-- Run this in your Supabase SQL editor

-- Add new columns to support different content types
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS content_types TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS external_link TEXT,
ADD COLUMN IF NOT EXISTS link_text VARCHAR(255);

-- Update existing posts to have content_type and content_types
UPDATE blog_posts 
SET content_type = 'text',
    content_types = 'text'
WHERE content_type IS NULL;

-- Create index for content_type for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type ON blog_posts(content_type);

-- Create index for external_link
CREATE INDEX IF NOT EXISTS idx_blog_posts_external_link ON blog_posts(external_link);

-- Update RLS policies to include new columns
-- (This assumes you already have RLS enabled)

-- Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE ON blog_posts TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN blog_posts.content_type IS 'Type of content: text, image, pdf, link (legacy single type)';
COMMENT ON COLUMN blog_posts.content_types IS 'Multiple content types: text,image,pdf,link (comma-separated)';
COMMENT ON COLUMN blog_posts.external_link IS 'External URL for link-type posts';
COMMENT ON COLUMN blog_posts.link_text IS 'Display text for external links';

-- Sample data for testing (optional)
-- INSERT INTO blog_posts (title, title_ar, content, content_ar, category, status, published, content_type, external_link, link_text)
-- VALUES 
-- ('Sample PDF Post', 'منشور PDF عينة', 'This is a sample PDF post', 'هذا منشور PDF عينة', 'research', 'published', true, 'pdf', NULL, NULL),
-- ('Sample Link Post', 'منشور رابط عينة', 'This is a sample link post', 'هذا منشور رابط عينة', 'article', 'published', true, 'link', 'https://example.com', 'Visit Example Site'),
-- ('Sample Image Post', 'منشور صورة عينة', 'This is a sample image post', 'هذا منشور صورة عينة', 'news', 'published', true, 'image', NULL, NULL);
