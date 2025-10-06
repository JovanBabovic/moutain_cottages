import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { RegistrationRequest } from '../../models/registration-request.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (response && response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  adminLogin(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/admin-login`, { username, password })
      .pipe(
        tap((response) => {
          if (response && response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  register(request: RegistrationRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, request);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getRegistrationRequests(): Observable<RegistrationRequest[]> {
    return this.http.get<RegistrationRequest[]>(
      `${this.apiUrl}/registration-requests`
    );
  }

  approveRequest(id: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/registration-requests/${id}/approve`,
      {}
    );
  }

  rejectRequest(id: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/registration-requests/${id}/reject`,
      {}
    );
  }

  changePassword(
    username: string,
    oldPassword: string,
    newPassword: string
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, {
      username,
      oldPassword,
      newPassword,
    });
  }

  updateProfile(userId: string, formData: FormData): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/profile/${userId}`, formData)
      .pipe(
        tap((response) => {
          if (response && response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  registerWithFile(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, formData);
  }
}
