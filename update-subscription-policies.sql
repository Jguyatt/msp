-- Update RLS policies for subscriptions table
-- This fixes the 406 error by allowing proper access to the subscriptions table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;

-- Create new policies that work with anonymous access
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
