/**
 * @file Authentication type definitions
 * @dev Type definitions for auth models (User, Session, Nonce)
 */

export interface User {
  id: string;
  address: string;
  lastLogin: Date;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Nonce {
  id: string;
  nonce: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
