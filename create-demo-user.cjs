const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY apenas no ambiente local/seguro.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createDemoUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'demo@demo.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
       console.log('User already exists. Attempting to update password and confirm email...');
       const { data: listData } = await supabase.auth.admin.listUsers();
       const user = listData.users.find(u => u.email === 'demo@demo.com');
       if (user) {
         await supabase.auth.admin.updateUserById(user.id, { password: 'password123', email_confirm: true });
         console.log('User reset successfully');
       }
    } else {
       console.error('Erro:', error.message);
    }
  } else {
    console.log('User created successfully:', data.user.id);
  }
}

createDemoUser();
