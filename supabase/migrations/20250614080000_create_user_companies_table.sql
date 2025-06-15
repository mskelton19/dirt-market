-- Create user_companies junction table
CREATE TABLE IF NOT EXISTS user_companies (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX idx_user_companies_status ON user_companies(status);

-- Enable Row Level Security
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own company relationships
CREATE POLICY "Users can view their own company relationships" ON user_companies
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own company relationships
CREATE POLICY "Users can create their own company relationships" ON user_companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own company relationships
CREATE POLICY "Users can update their own company relationships" ON user_companies
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a security definer function to check if user is admin of a company
CREATE OR REPLACE FUNCTION is_company_admin(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_companies 
        WHERE user_id = auth.uid() 
        AND company_id = company_uuid 
        AND role = 'admin'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Company admins can view and update all relationships for their company
CREATE POLICY "Company admins can view company relationships" ON user_companies
    FOR SELECT USING (is_company_admin(company_id));

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_companies_updated_at
    BEFORE UPDATE ON user_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_companies IS 'Junction table for user-company relationships with roles and status';
COMMENT ON COLUMN user_companies.role IS 'User role within the company (admin, manager, member)';
COMMENT ON COLUMN user_companies.status IS 'Status of the user-company relationship (active, inactive, pending)';
COMMENT ON COLUMN user_companies.joined_at IS 'When the user joined/was added to the company'; 