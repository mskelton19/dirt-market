-- Update companies table
ALTER TABLE companies ADD COLUMN slug VARCHAR(255) UNIQUE NOT NULL;
ALTER TABLE companies ADD COLUMN description TEXT;
ALTER TABLE companies ADD COLUMN industry VARCHAR(100);
ALTER TABLE companies ADD COLUMN company_size VARCHAR(50); -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
ALTER TABLE companies ADD COLUMN founded_year INTEGER;
ALTER TABLE companies ADD COLUMN email VARCHAR(255);
ALTER TABLE companies ADD COLUMN phone VARCHAR(50);
ALTER TABLE companies ADD COLUMN website VARCHAR(255);
ALTER TABLE companies ADD COLUMN address_line1 VARCHAR(255);
ALTER TABLE companies ADD COLUMN address_line2 VARCHAR(255);
ALTER TABLE companies ADD COLUMN city VARCHAR(100);
ALTER TABLE companies ADD COLUMN state VARCHAR(100);
ALTER TABLE companies ADD COLUMN postal_code VARCHAR(20);
ALTER TABLE companies ADD COLUMN country VARCHAR(100);
ALTER TABLE companies ADD COLUMN linkedin_url VARCHAR(255);
ALTER TABLE companies ADD COLUMN twitter_url VARCHAR(255);
ALTER TABLE companies ADD COLUMN tax_id VARCHAR(50);
ALTER TABLE companies ADD COLUMN registration_number VARCHAR(100);
ALTER TABLE companies ADD COLUMN legal_structure VARCHAR(50); -- e.g., 'LLC', 'Corporation', 'Partnership'
ALTER TABLE companies ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended'));
ALTER TABLE companies ADD COLUMN logo_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better query performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
    
-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can modify these based on your auth requirements)
-- Policy to allow authenticated users to read all companies
CREATE POLICY "Allow authenticated users to read companies" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert companies
CREATE POLICY "Allow authenticated users to insert companies" ON companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow users to update companies (you might want to restrict this further)
CREATE POLICY "Allow authenticated users to update companies" ON companies
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Stores company information and business details';
COMMENT ON COLUMN companies.slug IS 'URL-friendly unique identifier for the company';
COMMENT ON COLUMN companies.company_size IS 'Employee count range (1-10, 11-50, 51-200, 201-500, 500+)';
COMMENT ON COLUMN companies.legal_structure IS 'Business legal structure (LLC, Corporation, Partnership, etc.)';
COMMENT ON COLUMN companies.is_verified IS 'Whether the company has been verified by administrators';
