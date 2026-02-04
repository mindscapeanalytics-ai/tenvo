-- Create bom_materials table
CREATE TABLE IF NOT EXISTS bom_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bom_materials_bom_id ON bom_materials(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_materials_material_id ON bom_materials(material_id);
