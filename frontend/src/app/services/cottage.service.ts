import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cottage {
  _id?: string;
  name: string;
  location: string;
  ownerId: any;
  description?: string;
  pricePerNight: number; // Deprecated - kept for backwards compatibility
  summerPrice: number; // May, June, July, August
  winterPrice: number; // All other months
  capacity: number;
  amenities?: string[];
  images?: string[];
  averageRating?: number;
  ratingCount?: number;
  ratings?: Rating[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Rating {
  _id?: string;
  cottageId: string;
  touristId: any;
  rating: number;
  comment: string;
  createdAt?: Date;
}

export interface AvailabilityCheck {
  available: boolean;
  message: string;
  nights?: number;
  totalPrice?: number;
  summerPrice?: number;
  winterPrice?: number;
}

export interface ReservationData {
  touristId: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  totalPrice: number;
  creditCard?: string;
  note?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CottageService {
  private apiUrl = 'http://localhost:4000/api/cottages';
  private ownerApiUrl = 'http://localhost:4000/api/owner/cottages';

  constructor(private http: HttpClient) {}

  getCottages(
    sortBy?: string,
    sortOrder?: string,
    name?: string,
    location?: string
  ): Observable<Cottage[]> {
    let params = new HttpParams();
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortOrder) params = params.set('sortOrder', sortOrder);
    if (name) params = params.set('name', name);
    if (location) params = params.set('location', location);

    return this.http.get<Cottage[]>(this.apiUrl, { params });
  }

  getCottageById(id: string): Observable<Cottage> {
    return this.http.get<Cottage>(`${this.apiUrl}/${id}`);
  }

  checkAvailability(
    cottageId: string,
    checkIn: Date,
    checkOut: Date,
    adults: number,
    children: number
  ): Observable<AvailabilityCheck> {
    return this.http.post<AvailabilityCheck>(
      `${this.apiUrl}/${cottageId}/check-availability`,
      { checkIn, checkOut, adults, children }
    );
  }

  createReservation(cottageId: string, data: ReservationData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${cottageId}/reserve`, data);
  }

  addRating(
    cottageId: string,
    touristId: string,
    rating: number,
    comment: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${cottageId}/rate`, {
      touristId,
      rating,
      comment,
    });
  }

  // Owner cottage management methods
  getOwnerCottages(ownerId: string): Observable<Cottage[]> {
    return this.http.get<Cottage[]>(`${this.ownerApiUrl}/owner/${ownerId}`);
  }

  createCottage(formData: FormData): Observable<any> {
    return this.http.post(this.ownerApiUrl, formData);
  }

  updateCottage(cottageId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.ownerApiUrl}/${cottageId}`, formData);
  }

  deleteCottage(cottageId: string): Observable<any> {
    return this.http.delete(`${this.ownerApiUrl}/${cottageId}`);
  }

  importFromJSON(ownerId: string, formData: FormData): Observable<any> {
    return this.http.post(
      `${this.ownerApiUrl}/import-json/${ownerId}`,
      formData
    );
  }
}
