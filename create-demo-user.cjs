const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://164.68.116.21:8000';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODI2NjM1NDIsImV4cCI6MjA5ODAyMzU0Mn0.t6gdHirxLMnSFNhoRtsDxJp9hc9XdxaKTI0fWfizV-Y';

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
