import { supabase } from './supabase';
import { User } from './models';

/**
 * Get a user by their username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    console.log(`=== Fetching User by username: ${username} ===`);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('User not found in database');
        return null;
      }
      console.error('Database error fetching user:', error);
      throw error;
    }

    return data as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Get a user by their ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log(`=== Fetching User by ID: ${id} ===`);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('User not found in database');
        return null;
      }
      console.error('Database error fetching user:', error);
      throw error;
    }

    return data as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Create or update a user
 */
export async function upsertUser(userData: Partial<User>): Promise<User | null> {
  try {
    console.log('=== Upserting User ===');
    console.log('User data:', userData);

    if (!userData.username) {
      throw new Error('Username is required for user creation');
    }

    const { data, error } = await supabase
      .from('users')
      .upsert({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error during user upsert:', error);
      throw error;
    }

    console.log('Successfully upserted user');
    return data as User;
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
} 