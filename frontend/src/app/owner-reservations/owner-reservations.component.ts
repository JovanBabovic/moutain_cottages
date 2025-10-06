import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReservationService,
  Reservation,
} from '../services/reservation.service';
import { AuthService } from '../services/auth.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-owner-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './owner-reservations.component.html',
  styleUrls: ['./owner-reservations.component.css'],
})
export class OwnerReservationsComponent implements OnInit {
  pendingReservations: Reservation[] = [];
  allReservations: Reservation[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  viewMode: 'table' | 'calendar' = 'table';

  // Reject modal
  showRejectModal: boolean = false;
  selectedReservation: Reservation | null = null;
  rejectionReason: string = '';

  // Calendar
  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    weekends: true,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
  });

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.reservationService.getOwnerReservations(currentUser.id).subscribe({
      next: (data) => {
        this.pendingReservations = data.pending;
        this.allReservations = data.all;
        this.updateCalendarEvents();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load reservations';
        this.isLoading = false;
      },
    });
  }

  updateCalendarEvents(): void {
    const events: EventInput[] = this.allReservations.map((reservation) => {
      let color = '#808080'; // Default gray
      if (reservation.status === 'pending') {
        color = '#FFA500'; // Yellow/Orange for pending
      } else if (reservation.status === 'confirmed') {
        color = '#4CAF50'; // Green for confirmed
      }

      const cottage =
        typeof reservation.cottageId === 'string'
          ? { name: 'Unknown' }
          : reservation.cottageId;
      const tourist =
        typeof reservation.touristId === 'string'
          ? { firstName: 'Unknown', lastName: '' }
          : reservation.touristId;

      return {
        id: reservation._id,
        title: `${cottage.name} - ${tourist.firstName} ${tourist.lastName}`,
        start: reservation.checkIn,
        end: reservation.checkOut,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          reservation: reservation,
        },
      };
    });

    this.calendarOptions.update((options) => ({
      ...options,
      events: events,
    }));
  }

  handleEventClick(info: any): void {
    const reservation = info.event.extendedProps.reservation;
    this.selectedReservation = reservation;

    const cottage =
      typeof reservation.cottageId === 'string'
        ? { name: 'Unknown' }
        : reservation.cottageId;
    const tourist =
      typeof reservation.touristId === 'string'
        ? { firstName: 'Unknown', lastName: '' }
        : reservation.touristId;

    if (reservation.status === 'pending') {
      const action = confirm(
        `Reservation Details:\nCottage: ${cottage.name}\nGuest: ${
          tourist.firstName
        } ${tourist.lastName}\nCheck-in: ${this.formatDate(
          reservation.checkIn
        )}\nCheck-out: ${this.formatDate(
          reservation.checkOut
        )}\n\nClick OK to Confirm, Cancel to Reject`
      );

      if (action) {
        this.confirmReservation(reservation);
      } else {
        this.openRejectModal(reservation);
      }
    } else {
      alert(
        `Reservation Status: ${reservation.status}\nCottage: ${
          cottage.name
        }\nGuest: ${tourist.firstName} ${
          tourist.lastName
        }\nCheck-in: ${this.formatDate(
          reservation.checkIn
        )}\nCheck-out: ${this.formatDate(reservation.checkOut)}`
      );
    }
  }

  switchView(mode: 'table' | 'calendar'): void {
    this.viewMode = mode;
  }

  confirmReservation(reservation: Reservation): void {
    this.reservationService.confirmReservation(reservation._id!).subscribe({
      next: (response) => {
        this.successMessage = 'Reservation confirmed successfully!';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadReservations();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Failed to confirm reservation';
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  openRejectModal(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedReservation = null;
    this.rejectionReason = '';
  }

  submitRejection(): void {
    if (!this.selectedReservation) return;

    if (!this.rejectionReason.trim()) {
      this.errorMessage = 'Please provide a reason for rejection';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return;
    }

    this.reservationService
      .rejectReservation(this.selectedReservation._id!, this.rejectionReason)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Reservation rejected successfully';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.closeRejectModal();
          this.loadReservations();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Failed to reject reservation';
          setTimeout(() => (this.errorMessage = ''), 5000);
        },
      });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Type-safe helper methods for accessing populated fields
  getCottageName(reservation: Reservation): string {
    return typeof reservation.cottageId === 'string'
      ? 'Unknown'
      : reservation.cottageId.name;
  }

  getTouristFirstName(reservation: Reservation): string {
    return typeof reservation.touristId === 'string'
      ? 'Unknown'
      : reservation.touristId.firstName;
  }

  getTouristLastName(reservation: Reservation): string {
    return typeof reservation.touristId === 'string'
      ? ''
      : reservation.touristId.lastName;
  }

  getTouristEmail(reservation: Reservation): string {
    return typeof reservation.touristId === 'string'
      ? 'Unknown'
      : reservation.touristId.email;
  }

  getTouristPhone(reservation: Reservation): string {
    return typeof reservation.touristId === 'string'
      ? 'Unknown'
      : reservation.touristId.phone;
  }
}
