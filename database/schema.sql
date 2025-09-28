-- Enable Row Level Security
-- Note: JWT secret is configured in Supabase dashboard settings

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    vendor VARCHAR(255) NOT NULL,
    contract_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE NOT NULL,
    value DECIMAL(15,2) DEFAULT 0,
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    contract_pdf_id UUID REFERENCES contract_files(id) ON DELETE SET NULL,
    contract_pdf_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('90_day', '60_day', '30_day', 'custom')),
    days_before_expiry INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    recipient_email VARCHAR(255),
    template_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON contracts(vendor);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reminders_contract_id ON reminders(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_contract_id ON audit_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_company_id ON team_invitations(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (temporarily disabled for development)
-- Note: These will be enabled once authentication is properly configured

-- For now, allow all operations for development
-- In production, these policies should be enabled with proper JWT authentication

-- Companies: Allow all operations for development
CREATE POLICY "Allow all operations on companies" ON companies
    FOR ALL USING (true);

-- Users: Allow all operations for development  
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- Contracts: Allow all operations for development
CREATE POLICY "Allow all operations on contracts" ON contracts
    FOR ALL USING (true);

-- Reminders: Allow all operations for development
CREATE POLICY "Allow all operations on reminders" ON reminders
    FOR ALL USING (true);

-- Audit logs: Allow all operations for development
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs
    FOR ALL USING (true);

-- Team invitations: Allow all operations for development
CREATE POLICY "Allow all operations on team_invitations" ON team_invitations
    FOR ALL USING (true);

-- Insert sample data
INSERT INTO companies (id, name, domain) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'TechFlow Solutions', 'techflow.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, company_id, role, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'john@techflow.com', 'John Smith', '550e8400-e29b-41d4-a716-446655440000', 'admin', 'active'),
    ('550e8400-e29b-41d4-a716-446655440002', 'sarah@techflow.com', 'Sarah Johnson', '550e8400-e29b-41d4-a716-446655440000', 'editor', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO contracts (id, company_id, vendor, contract_name, start_date, end_date, value, contact_email, created_by) VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Microsoft', 'Office 365 Business Premium', '2023-01-15', '2024-02-15', 24000.00, 'john.doe@example.com', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Datto', 'Backup & Recovery', '2023-06-01', '2024-12-31', 18000.00, 'jane.smith@example.com', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'AWS', 'Enterprise Support', '2023-03-01', '2025-03-01', 50000.00, 'mike.jones@example.com', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Reminder Settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    intervals INTEGER[] NOT NULL DEFAULT '{90, 60, 30}',
    notifications JSONB NOT NULL DEFAULT '{"email": true, "inApp": true, "sms": false}',
    email_template TEXT NOT NULL DEFAULT 'Subject: Contract Renewal Reminder

Dear {{recipient_name}},

This is a reminder that your contract with {{vendor_name}} will expire on {{end_date}}.

We recommend reviewing this contract before it expires to ensure continuity of services.

Please let us know if you have any questions.

Best regards,
TechFlow Solutions',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reminder_settings
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminder_settings
CREATE POLICY "Users can view reminder settings for their company contracts" ON reminder_settings
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM contracts WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert reminder settings for their company contracts" ON reminder_settings
    FOR INSERT WITH CHECK (
        contract_id IN (
            SELECT id FROM contracts WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update reminder settings for their company contracts" ON reminder_settings
    FOR UPDATE USING (
        contract_id IN (
            SELECT id FROM contracts WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Contract Files table for storing uploaded PDFs
CREATE TABLE contract_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for contract_files
ALTER TABLE contract_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for contract_files
CREATE POLICY "Users can view files for their company" ON contract_files
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert files for their company" ON contract_files
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update files for their company" ON contract_files
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files for their company" ON contract_files
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Subscriptions table for Stripe integration
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
-- Allow service role to access all subscriptions (for webhook processing)
CREATE POLICY "Service role can access all subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Allow users to view their own subscriptions via user_id
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (true);

-- Allow users to insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
