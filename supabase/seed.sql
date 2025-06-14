-- Insert sample companies for onboarding
INSERT INTO companies (
    name,
    slug,
    industry,
    company_size,
    address_line1,
    city,
    state,
    postal_code,
    description,
    status
) VALUES 
(
    'Dunder Mifflin',
    'dunder-mifflin',
    'General Construction',
    '51-200',
    '1234 Paper Rd.',
    'Scranton',
    'PA',
    '18503',
    'A leading construction company specializing in commercial and residential projects.',
    'active'
),
(
    'Acme, Inc.',
    'acme-inc',
    'Heavy Civil Construction',
    '201-500',
    '1000 Rocket Ave.',
    'Phoenix',
    'AZ',
    '85004',
    'Heavy construction and infrastructure development company with decades of experience.',
    'active'
),
(
    'Scoops Ahoy',
    'scoops-ahoy',
    'Commercial Construction',
    '11-50',
    '453 Starcourt Rd.',
    'Hawkins',
    'IN',
    '46703',
    'Commercial construction specialists focusing on retail and entertainment venues.',
    'active'
);

-- Add additional companies for variety
INSERT INTO companies (
    name,
    slug,
    industry,
    company_size,
    description,
    status
) VALUES 
(
    'Sterling Construction',
    'sterling-construction',
    'General Construction',
    '51-200',
    'Full-service construction company serving the tri-state area.',
    'active'
),
(
    'BuildCorp Solutions',
    'buildcorp-solutions',
    'Infrastructure',
    '500+',
    'Large-scale infrastructure and civil engineering projects.',
    'active'
),
(
    'Mountain View Builders',
    'mountain-view-builders',
    'Residential Construction',
    '11-50',
    'Custom home builders and residential renovation specialists.',
    'active'
),
(
    'Metro Demolition Co.',
    'metro-demolition-co',
    'Demolition',
    '1-10',
    'Professional demolition and site preparation services.',
    'active'
),
(
    'Pioneer Excavation',
    'pioneer-excavation',
    'Excavation',
    '11-50',
    'Excavation, grading, and earthwork specialists.',
    'active'
); 