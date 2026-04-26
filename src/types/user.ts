import { UserRole, UserStatus } from '../constants/roles';

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: Date;
}

export interface IProvider {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  country: string;
  stripe_account_id?: string;
  verified: boolean;
}

export interface ICreator {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  phone?: string;
  stripe_account_id?: string;
  verified: boolean;
}

export interface ICustomer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface IAddress {
  id: string;
  customer_id: string;
  label?: string;
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  is_default: boolean;
}

export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface IRegisterInput {
  email: string;
  password: string;
  role: UserRole.PROVIDER | UserRole.CREATOR | UserRole.CUSTOMER;
}

export interface ILoginInput {
  email: string;
  password: string;
}
