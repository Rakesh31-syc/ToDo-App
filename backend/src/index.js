import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// This file serves as the entry point for any additional backend logic
// Currently, we're using Supabase directly from the frontend, but you can add:
// - Custom API endpoints
// - Background jobs
// - Webhooks
// - Server-side validation
// - Complex business logic
// - External service integrations