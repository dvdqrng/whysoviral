// Simple script to test the team members API endpoint
async function testTeamMembersAPI() {
  try {
    // Dynamically import node-fetch
    const { default: fetch } = await import('node-fetch');

    // Replace with your actual team ID
    const teamId = 'dedbfa49-7f25-481c-a472-47bedf69a02b';

    // Make a request to the API endpoint
    const response = await fetch(`http://localhost:3000/api/teams/${teamId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // This will include any cookies from your browser session
      credentials: 'include'
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testTeamMembersAPI(); 