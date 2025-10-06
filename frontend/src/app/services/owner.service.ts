import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CottageMonthStatistics {
  cottageName: string;
  cottageId: string;
  months: { [monthYear: string]: number };
}

export interface CottageWeekendWeekdayStatistics {
  cottageName: string;
  cottageId: string;
  weekendDays: number;
  weekdayDays: number;
}

export interface OwnerStatistics {
  reservationsPerMonth: CottageMonthStatistics[];
  weekendVsWeekday: CottageWeekendWeekdayStatistics[];
}

@Injectable({
  providedIn: 'root',
})
export class OwnerService {
  private apiUrl = 'http://localhost:4000/api/owner/cottages';

  constructor(private http: HttpClient) {}

  getStatistics(ownerId: string): Observable<OwnerStatistics> {
    return this.http.get<OwnerStatistics>(
      `${this.apiUrl}/statistics/${ownerId}`
    );
  }
}
