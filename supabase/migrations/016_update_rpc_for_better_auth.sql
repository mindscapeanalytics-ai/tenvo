-- ============================================
-- Migration 016: Update RPC for Better Auth
-- Updates create_my_business to accept TEXT user_id
-- ============================================

CREATE OR REPLACE FUNCTION public.create_my_business(
  p_business_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_country TEXT DEFAULT 'Pakistan',
  p_domain TEXT DEFAULT 'retail-shop',
  p_category TEXT DEFAULT 'retail',
  p_user_id TEXT DEFAULT NULL -- Added for Better Auth
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
  v_user_id TEXT;
  v_result JSONB;
BEGIN
  -- 1. Get user ID from parameter OR auth.uid() (for backward compatibility)
  v_user_id := COALESCE(p_user_id, auth.uid()::TEXT);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Create the business
  INSERT INTO public.businesses (
    user_id,
    business_name,
    email,
    phone,
    country,
    domain,
    category
  ) VALUES (
    v_user_id,
    p_business_name,
    p_email,
    p_phone,
    p_country,
    p_domain,
    p_category
  ) RETURNING id INTO v_business_id;

  -- 3. Create the business_user record (Owner)
  INSERT INTO public.business_users (
    business_id,
    user_id,
    role,
    status
  ) VALUES (
    v_business_id,
    v_user_id,
    'owner',
    'active'
  );

  -- 4. Seed Standard Chart of Accounts
  INSERT INTO public.gl_accounts (business_id, code, name, type) VALUES
  (v_business_id, '1000', 'Assets', 'Asset'),
  (v_business_id, '1010', 'Cash on Hand', 'Asset'),
  (v_business_id, '1020', 'Bank Balance', 'Asset'),
  (v_business_id, '1030', 'Accounts Receivable', 'Asset'),
  (v_business_id, '1040', 'Stock/Inventory', 'Asset'),
  (v_business_id, '2000', 'Liabilities', 'Liability'),
  (v_business_id, '2010', 'Accounts Payable', 'Liability'),
  (v_business_id, '2020', 'Salaries Payable', 'Liability'),
  (v_business_id, '3000', 'Equity', 'Equity'),
  (v_business_id, '3010', 'Owner Capital', 'Equity'),
  (v_business_id, '4000', 'Income', 'Income'),
  (v_business_id, '4010', 'Sales Revenue', 'Income'),
  (v_business_id, '4020', 'Service Revenue', 'Income'),
  (v_business_id, '5000', 'Expenses', 'Expense'),
  (v_business_id, '5010', 'Cost of Goods Sold', 'Expense'),
  (v_business_id, '5020', 'Rent Expense', 'Expense'),
  (v_business_id, '5030', 'Utility Bills', 'Expense');

  -- 5. Prepare success result
  v_result := jsonb_build_object(
    'id', v_business_id,
    'name', p_business_name,
    'status', 'success',
    'message', 'Enterprise infrastructure provisioned successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM
  );
END;
$$;

-- Grant execution to all for now as we handle auth in function
GRANT EXECUTE ON FUNCTION public.create_my_business TO anon;
GRANT EXECUTE ON FUNCTION public.create_my_business TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_my_business TO service_role;
