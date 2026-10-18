-- Baseline market instruments required by the application on a fresh install.
INSERT INTO public.assets (symbol, name, current_price)
VALUES
  ('AAPL', 'Apple Inc.', 150.00),
  ('MSFT', 'Microsoft Corporation', 300.00),
  ('GOOGL', 'Alphabet Inc.', 140.00),
  ('TSLA', 'Tesla Inc.', 200.00)
ON CONFLICT (symbol) DO NOTHING;
