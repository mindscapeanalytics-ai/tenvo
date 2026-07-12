SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('product_serials', 'product_batches', 'product_variants');
