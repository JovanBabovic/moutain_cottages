import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';

export interface AdminCottage {
  _id?: string;
  name: string;
  location: string;
  ownerId: any;
  description?: string;
  pricePerNight: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
  lastThreeRatings?: number[];
  needsAttention?: boolean;
  averageRating?: number;
  totalRatings?: number;
  isBlocked?: boolean;
  blockedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:4000/api/admin';

  constructor(private http: HttpClient) {}

  // User management
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, userData: Partial<User>): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, userData);
  }

  deactivateUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/deactivate`, {});
  }

  activateUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/activate`, {});
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // Cottage management
  getAllCottages(): Observable<AdminCottage[]> {
    return this.http.get<AdminCottage[]>(`${this.apiUrl}/cottages`);
  }

  blockCottage(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cottages/${id}/block`, {});
  }

  unblockCottage(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cottages/${id}/unblock`, {});
  }
}
