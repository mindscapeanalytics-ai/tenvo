-- ============================================
-- Migration 012: Intelligent Business Setup RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.create_my_business(
  p_business_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_country TEXT DEFAULT 'Pakistan',
  p_domain TEXT DEFAULT 'retail-shop',
  p_category TEXT DEFAULT 'retail'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Get current user
  v_user_id := auth.uid();
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
  -- Note: Migration 007 seeds existing owners, but for new ones we do it here.
  -- business_users table exists from 007.
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

  -- 4. Seed Standard Chart of Accounts (Pakistani ERP Standard)
  -- gl_accounts table exists from 009.
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

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_my_business TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_my_business TO service_role;
