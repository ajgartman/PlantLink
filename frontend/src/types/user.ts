// This interface matches the UserResponse schema from your backend
export interface User {
  id: string;              // UUID from backend
  email: string;           // User's email
  full_name: string;       // Display name
  company_name: string | null;  // Optional - can be null
  company_id: string | null;    // UUID or null
  role: string;            // "user", "admin", etc.
  is_active: boolean;      // Account status
  created_at: string;      // ISO datetime string
  updated_at: string;      // ISO datetime string
}