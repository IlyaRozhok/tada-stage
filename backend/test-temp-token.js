const axios = require('axios');

async function testTempToken() {
  try {
    // Тестируем эндпоинт с временным токеном
    const tempToken = 'd1449bbb-e8e9-4c35-93e2-676130a77bb7';
    
    console.log('Testing temp token endpoint...');
    const response = await axios.get(`http://localhost:3000/auth/temp-token/${tempToken}`);
    console.log('Response:', response.data);
    
    console.log('\nTesting select-role endpoint...');
    const selectRoleResponse = await axios.get(`http://localhost:3000/auth/select-role?tempToken=${tempToken}`);
    console.log('Select role response:', selectRoleResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testTempToken();
