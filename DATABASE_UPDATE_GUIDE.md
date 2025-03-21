# Database Structure Update Guide

## Current Database Structure

The Supabase database has been simplified to contain only three tables:
1. `tiktok_accounts` (renamed from `tiktok_users`)
2. `tiktok_posts`
3. `users`

All other tables have been dropped from the database.

## Required Code Updates

The following changes need to be made to the codebase to reflect the new database structure:

### 1. Update `lib/db/supabase.ts`

#### A. Remove or modify the `trackUserSearch` function

The `trackUserSearch` function refers to the `tiktok_user_searches` table which no longer exists. Either:

- Remove the function completely, or
- Modify it to use a different tracking mechanism.

**Location**: Around line 300 in `lib/db/supabase.ts`

```typescript
// REMOVE or replace this function
export async function trackUserSearch(userId: string, searchedByUid: string) {
  // Function code removed or replaced
}
```

#### B. Update the reference to user search tracking

Remove the call to `trackUserSearch` in the `upsertTikTokUser` function.

**Location**: Around line 134 in `lib/db/supabase.ts`

```typescript
// Remove these lines
// If we have a searchedByUid, track the search in the tiktok_user_searches table
if (searchedByUid && typeof searchedByUid === 'string' && data) {
  await trackUserSearch(data.user_id, searchedByUid)
}
```

### 2. Ensure proper interface definitions

Make sure the interface definitions match the current database structure:

- `TikTokAccount` (formerly `TikTokUser`)
- `TikTokPost`
- Add `User` interface if it doesn't exist

### 3. Update any API routes

Check all API routes and functions that interact with the database to ensure they only reference the existing tables.

### 4. Update any components or pages that display data

Make sure any components or pages that display data from the database are updated to reflect the current table structure.

## Testing

After making these changes, thoroughly test the application to ensure:

1. Data can be retrieved from all three tables
2. User search and profile display still work
3. No errors appear in the console related to missing tables

## Additional Notes

The script `scripts/apply-rename-changes.js` has already been run to update references from `tiktok_users` to `tiktok_accounts`, but manual changes may still be needed in some places. 