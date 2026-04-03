-- Migration: Cycle Counting Tables
-- Description: Creates tables for cycle counting workflows
-- Date: 2026-04-03

-- Create cycle_count_schedules table
CREATE TABLE IF NOT EXISTS cycle_count_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  abc_classification VARCHAR(1) CHECK (abc_classification IN ('A', 'B', 'C')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  frequency VARCHAR(20) DEFAULT 'once' CHECK (frequency IN ('once', 'weekly', 'monthly', 'quarterly')),
  tolerance_percentage DECIMAL(5,2) DEFAULT 5.00 CHECK (tolerance_percentage >= 0 AND tolerance_percentage <= 100),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  product_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cycle_count_tasks table
CREATE TABLE IF NOT EXISTS cycle_count_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES cycle_count_schedules(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  expected_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  physical_count DECIMAL(10,2),
  variance DECIMAL(10,2),
  variance_percentage DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'counted', 'approved', 'rejected')),
  counted_at TIMESTAMP WITH TIME ZONE,
  counted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_cycle_count_schedules_business ON cycle_count_schedules(business_id);
CREATE INDEX idx_cycle_count_schedules_assigned ON cycle_count_schedules(assigned_to);
CREATE INDEX idx_cycle_count_schedules_status ON cycle_count_schedules(status);
CREATE INDEX idx_cycle_count_schedules_date ON cycle_count_schedules(scheduled_date);

CREATE INDEX idx_cycle_count_tasks_schedule ON cycle_count_tasks(schedule_id);
CREATE INDEX idx_cycle_count_tasks_business ON cycle_count_tasks(business_id);
CREATE INDEX idx_cycle_count_tasks_product ON cycle_count_tasks(product_id);
CREATE INDEX idx_cycle_count_tasks_status ON cycle_count_tasks(status);
CREATE INDEX idx_cycle_count_tasks_warehouse ON cycle_count_tasks(warehouse_id);

-- Create function to calculate variance
CREATE OR REPLACE FUNCTION calculate_cycle_count_variance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.physical_count IS NOT NULL THEN
    NEW.variance := NEW.physical_count - NEW.expected_quantity;
    
    IF NEW.expected_quantity > 0 THEN
      NEW.variance_percentage := (NEW.variance / NEW.expected_quantity) * 100;
    ELSE
      NEW.variance_percentage := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for variance calculation
DROP TRIGGER IF EXISTS trigger_calculate_variance ON cycle_count_tasks;
CREATE TRIGGER trigger_calculate_variance
  BEFORE INSERT OR UPDATE OF physical_count, expected_quantity
  ON cycle_count_tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_cycle_count_variance();

-- Create function to update schedule status
CREATE OR REPLACE FUNCTION update_cycle_count_schedule_status()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
BEGIN
  -- Count total and completed tasks for the schedule
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('approved', 'rejected'))
  INTO total_tasks, completed_tasks
  FROM cycle_count_tasks
  WHERE schedule_id = NEW.schedule_id;
  
  -- Update schedule status
  IF completed_tasks = total_tasks AND total_tasks > 0 THEN
    UPDATE cycle_count_schedules
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = NEW.schedule_id;
  ELSIF completed_tasks > 0 THEN
    UPDATE cycle_count_schedules
    SET status = 'in_progress'
    WHERE id = NEW.schedule_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for schedule status update
DROP TRIGGER IF EXISTS trigger_update_schedule_status ON cycle_count_tasks;
CREATE TRIGGER trigger_update_schedule_status
  AFTER UPDATE OF status
  ON cycle_count_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_count_schedule_status();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_cycle_count_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_schedule_timestamp ON cycle_count_schedules;
CREATE TRIGGER trigger_update_schedule_timestamp
  BEFORE UPDATE ON cycle_count_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_count_timestamp();

DROP TRIGGER IF EXISTS trigger_update_task_timestamp ON cycle_count_tasks;
CREATE TRIGGER trigger_update_task_timestamp
  BEFORE UPDATE ON cycle_count_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_count_timestamp();

-- Enable Row Level Security
ALTER TABLE cycle_count_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_count_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cycle_count_schedules
CREATE POLICY "Users can view schedules for their businesses"
  ON cycle_count_schedules FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create schedules for their businesses"
  ON cycle_count_schedules FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules for their businesses"
  ON cycle_count_schedules FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedules for their businesses"
  ON cycle_count_schedules FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for cycle_count_tasks
CREATE POLICY "Users can view tasks for their businesses"
  ON cycle_count_tasks FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for their businesses"
  ON cycle_count_tasks FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks for their businesses"
  ON cycle_count_tasks FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks for their businesses"
  ON cycle_count_tasks FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE cycle_count_schedules IS 'Stores cycle count schedules for inventory verification';
COMMENT ON TABLE cycle_count_tasks IS 'Stores individual cycle count tasks for products';
COMMENT ON COLUMN cycle_count_schedules.tolerance_percentage IS 'Variance tolerance percentage - variances within this threshold do not require approval';
COMMENT ON COLUMN cycle_count_tasks.variance IS 'Difference between physical count and expected quantity';
COMMENT ON COLUMN cycle_count_tasks.variance_percentage IS 'Variance as percentage of expected quantity';
