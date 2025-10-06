import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PopulatedTourist {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PopulatedCottage {
  _id: string;
  name: string;
  location: string;
}

export interface Reservation {
  _id?: string;
  cottageId: PopulatedCottage | string;
  touristId: PopulatedTourist | string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  adults?: number;
  children?: number;
  creditCard?: string;
  note?: string;
  createdAt?: Date;
  hasRated?: boolean; // For past reservations
  rating?: number;
  comment?: string;
}

export interface ReservationsResponse {
  currentReservations: Reservation[];
  pastReservations: Reservation[];
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private apiUrl = 'http://localhost:4000/api/reservations';

  constructor(private http: HttpClient) {}

  getTouristReservations(touristId: string): Observable<ReservationsResponse> {
    return this.http.get<ReservationsResponse>(
      `${this.apiUrl}/tourist/${touristId}`
    );
  }

  getOwnerReservations(ownerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/owner/${ownerId}`);
  }

  cancelReservation(reservationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${reservationId}/cancel`, {});
  }

  confirmReservation(reservationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${reservationId}/confirm`, {});
  }

  rejectReservation(
    reservationId: string,
    rejectionReason: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${reservationId}/reject`, {
      rejectionReason,
    });
  }
}
