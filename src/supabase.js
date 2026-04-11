import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://braxtvlrbmwtiduspsyl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYXh0dmxyYm13dGlkdXNwc3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDI2NzIsImV4cCI6MjA5MTQxODY3Mn0.Eao1G46luDHkKJurcd5UfCezWyR5GkNRa-brTttMGgI'
)