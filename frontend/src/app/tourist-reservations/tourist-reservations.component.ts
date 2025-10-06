import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReservationService,
  Reservation,
} from '../services/reservation.service';
import { CottageService } from '../services/cottage.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tourist-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tourist-reservations.component.html',
  styleUrls: ['./tourist-reservations.component.css'],
})
export class TouristReservationsComponent implements OnInit {
  currentReservations: Reservation[] = [];
  pastReservations: Reservation[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // Rating modal
  showRatingModal: boolean = false;
  selectedReservation: Reservation | null = null;
  ratingValue: number = 0;
  ratingComment: string = '';
  hoverRating: number = 0;

  constructor(
    private reservationService: ReservationService,
    private cottageService: CottageService,
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
    this.reservationService.getTouristReservations(currentUser.id).subscribe({
      next: (data) => {
        this.currentReservations = data.currentReservations;
        this.pastReservations = data.pastReservations;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load reservations';
        this.isLoading = false;
      },
    });
  }

  canCancelReservation(reservation: Reservation): boolean {
    const checkInDate = new Date(reservation.checkIn);
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return checkInDate > oneDayFromNow && reservation.status !== 'cancelled';
  }

  cancelReservation(reservation: Reservation): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    this.reservationService.cancelReservation(reservation._id!).subscribe({
      next: (response) => {
        this.successMessage = 'Reservation cancelled successfully';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadReservations();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Failed to cancel reservation';
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  hasRating(reservation: Reservation): boolean {
    // Check if reservation has been rated (backend sets hasRated property)
    return reservation.hasRated || false;
  }

  openRatingModal(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.ratingValue = 0;
    this.ratingComment = '';
    this.hoverRating = 0;
    this.showRatingModal = true;
  }

  closeRatingModal(): void {
    this.showRatingModal = false;
    this.selectedReservation = null;
    this.ratingValue = 0;
    this.ratingComment = '';
    this.hoverRating = 0;
  }

  setRating(rating: number): void {
    this.ratingValue = rating;
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  submitRating(): void {
    if (!this.selectedReservation) return;

    if (this.ratingValue === 0) {
      this.errorMessage = 'Please select a rating';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return;
    }

    if (!this.ratingComment.trim()) {
      this.errorMessage = 'Please enter a comment';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return;
    }

    const currentUser = this.authService.currentUserValue;
    const cottageId =
      typeof this.selectedReservation.cottageId === 'string'
        ? this.selectedReservation.cottageId
        : this.selectedReservation.cottageId._id;

    this.cottageService
      .addRating(
        cottageId,
        currentUser!.id!,
        this.ratingValue,
        this.ratingComment
      )
      .subscribe({
        next: (response) => {
          this.successMessage = 'Rating submitted successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.closeRatingModal();
          this.loadReservations();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to submit rating';
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

  getCottageLocation(reservation: Reservation): string {
    return typeof reservation.cottageId === 'string'
      ? 'Unknown'
      : reservation.cottageId.location;
  }
}
