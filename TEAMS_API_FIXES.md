# Teams API Fixes

## Issues Identified

1. **Authentication Issues**: The API endpoints were experiencing JWSError JWSInvalidSignature errors when trying to authenticate users.
2. **Client vs Server Supabase Usage**: The TeamService was using client-side Supabase client in server-side API routes.
3. **Cookie Handling**: The createRouteHandlerClient was not being called correctly with the cookies function.

## Changes Made

### 1. Fixed Cookie Handling in Route Handler Client

Updated all API routes to correctly pass the cookies function to the createRouteHandlerClient:

```javascript
const cookieStore = cookies()
const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
```

### 2. Created Helper Functions for Team Membership Checks

Added helper functions directly in the API route files to check team membership and admin status:

```javascript
async function isUserTeamMember(userId: string, teamId: string, supabaseClient: any): Promise<boolean> {
  // Implementation using route handler client
}

async function isUserTeamAdmin(userId: string, teamId: string, supabaseClient: any): Promise<boolean> {
  // Implementation using route handler client
}
```

### 3. Updated API Routes to Use Direct Database Access

Modified all API routes to directly use the route handler client for database operations instead of relying on the TeamService:

- GET /api/teams/[team_id]/members
- POST /api/teams/[team_id]/members
- PATCH /api/teams/[team_id]/members
- DELETE /api/teams/[team_id]/members
- GET /api/teams/[team_id]/invitations
- POST /api/teams/[team_id]/invitations
- DELETE /api/teams/[team_id]/invitations

### 4. Created Test Pages

Created HTML test pages to test the API endpoints in the browser:

- test-teams-api.html - For testing team members API
- test-invitations-api.html - For testing team invitations API

## Testing

To test the changes:

1. Ensure the Next.js server is running with `npm run dev`
2. Open the test pages in your browser:
   - http://localhost:3000/test-teams-api.html
   - http://localhost:3000/test-invitations-api.html
3. Use the forms to test the various API endpoints

## Next Steps

1. Consider updating the TeamService to have separate client-side and server-side implementations
2. Review and update the TeamInvitationService to follow the same pattern
3. Add proper error handling for invitation emails
4. Implement proper Row Level Security (RLS) policies in the database 