// Debug script to check template saving
// Run this with: node debug-template.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkInvoiceSchema() {
  console.log('🔍 Checking invoice table schema...');
  
  try {
    // Try to get the first invoice to see what columns exist
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Error fetching invoices:', error.message);
      return;
    }
    
    if (invoices && invoices.length > 0) {
      console.log('✅ Sample invoice columns:', Object.keys(invoices[0]));
      console.log('🎨 Template name value:', invoices[0].template_name);
    } else {
      console.log('📝 No invoices found in database');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function testTemplateInsertion() {
  console.log('\n🧪 Testing template insertion...');
  
  try {
    // Create a test invoice with template
    const testInvoice = {
      invoice_number: 'TEST-' + Date.now(),
      customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 100,
      tax_amount: 10,
      total: 110,
      status: 'draft',
      currency: 'USD',
      template_name: 'modern', // This is what we're testing
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
    };
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(testInvoice)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error inserting test invoice:', error.message);
      console.error('💡 This might indicate the template_name column doesn\'t exist');
      return;
    }
    
    console.log('✅ Test invoice created successfully');
    console.log('🎨 Saved template name:', data.template_name);
    
    // Clean up - delete the test invoice
    await supabase
      .from('invoices')
      .delete()
      .eq('id', data.id);
    console.log('🧹 Test invoice cleaned up');
    
  } catch (err) {
    console.error('❌ Unexpected error during test:', err);
  }
}

// Run the checks
checkInvoiceSchema().then(() => testTemplateInsertion());