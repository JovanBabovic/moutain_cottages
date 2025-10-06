import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Statistics {
  totalCottages: number;
  totalOwners: number;
  totalTourists: number;
  reservations: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}

export interface Cottage {
  _id?: string;
  name: string;
  location: string;
  ownerId: any;
  description?: string;
  pricePerNight: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PublicService {
  private apiUrl = 'http://localhost:4000/api/public';

  constructor(private http: HttpClient) {}

  getStatistics(): Observable<Statistics> {
    return this.http.get<Statistics>(`${this.apiUrl}/statistics`);
  }

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

    return this.http.get<Cottage[]>(`${this.apiUrl}/cottages`, { params });
  }

  getCottageById(id: string): Observable<Cottage> {
    return this.http.get<Cottage>(`${this.apiUrl}/cottages/${id}`);
  }
}
