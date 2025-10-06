import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CottageService, Cottage } from '../services/cottage.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-cottage-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cottage-details.component.html',
  styleUrls: ['./cottage-details.component.css'],
})
export class CottageDetailsComponent implements OnInit, AfterViewInit {
  cottage: Cottage | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  // Map
  private map: any;

  // Reservation step
  reservationStep: number = 0; // 0 = not started, 1 = step 1, 2 = step 2

  // Step 1 data
  checkInDate: string = '';
  checkOutDate: string = '';
  adults: number = 2;
  children: number = 0;

  // Step 2 data
  creditCard: string = '';
  note: string = '';
  calculatedPrice: number = 0;
  nights: number = 0;

  availabilityMessage: string = '';
  availabilityError: string = '';
  isCheckingAvailability: boolean = false;
  isBooking: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cottageService: CottageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const cottageId = this.route.snapshot.paramMap.get('id');
    if (cottageId) {
      this.loadCottageDetails(cottageId);
    }

    // Pre-fill credit card from user profile
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.creditCard) {
      this.creditCard = currentUser.creditCard;
    }
  }

  ngAfterViewInit(): void {
    // Map will be initialized after cottage data is loaded
  }

  loadCottageDetails(id: string): void {
    this.isLoading = true;
    this.cottageService.getCottageById(id).subscribe({
      next: (cottage) => {
        this.cottage = cottage;
        this.isLoading = false;
        setTimeout(() => this.initMap(), 100);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cottage details';
        this.isLoading = false;
      },
    });
  }

  initMap(): void {
    if (!this.cottage) return;

    // Simple location mapping based on cottage location
    const locationCoords = this.getLocationCoordinates(this.cottage.location);

    this.map = L.map('map').setView(locationCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    L.marker(locationCoords)
      .addTo(this.map)
      .bindPopup(`<b>${this.cottage.name}</b><br>${this.cottage.location}`)
      .openPopup();
  }

  getLocationCoordinates(location: string): [number, number] {
    // Approximate coordinates for Serbian mountain locations
    const coords: { [key: string]: [number, number] } = {
      Zlatibor: [43.7344, 19.715],
      Kopaonik: [43.2889, 20.8161],
      Tara: [43.9167, 19.4167],
      'Tara National Park': [43.9167, 19.4167],
      'Stara Planina': [43.3833, 22.5833],
      'Fruska Gora': [45.15, 19.7833],
      Divcibare: [44.0833, 20.0167],
      Rtanj: [43.7667, 21.9],
    };

    for (const [key, coord] of Object.entries(coords)) {
      if (location.toLowerCase().includes(key.toLowerCase())) {
        return coord;
      }
    }

    // Default to Belgrade
    return [44.7866, 20.4489];
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    if (hasHalfStar) {
      stars.push('half');
    }
    while (stars.length < 5) {
      stars.push('empty');
    }
    return stars;
  }

  startReservation(): void {
    if (!this.authService.currentUserValue) {
      this.errorMessage = 'Please login to make a reservation';
      this.router.navigate(['/login']);
      return;
    }

    this.reservationStep = 1;
    this.availabilityError = '';
    this.availabilityMessage = '';
  }

  checkAvailability(): void {
    this.availabilityError = '';
    this.availabilityMessage = '';

    if (!this.checkInDate || !this.checkOutDate) {
      this.availabilityError = 'Please select check-in and check-out dates';
      return;
    }

    if (this.adults < 1) {
      this.availabilityError = 'At least one adult is required';
      return;
    }

    this.isCheckingAvailability = true;

    this.cottageService
      .checkAvailability(
        this.cottage!._id!,
        new Date(this.checkInDate),
        new Date(this.checkOutDate),
        this.adults,
        this.children
      )
      .subscribe({
        next: (result) => {
          this.isCheckingAvailability = false;
          if (result.available) {
            this.nights = result.nights || 0;
            this.calculatedPrice = result.totalPrice || 0;
            this.availabilityMessage = result.message;
            this.reservationStep = 2;
          } else {
            this.availabilityError = result.message;
          }
        },
        error: (error) => {
          this.isCheckingAvailability = false;
          this.availabilityError =
            error.error?.message || 'Failed to check availability';
        },
      });
  }

  confirmReservation(): void {
    if (!this.creditCard) {
      this.availabilityError = 'Credit card number is required';
      return;
    }

    if (this.note && this.note.length > 500) {
      this.availabilityError = 'Note must not exceed 500 characters';
      return;
    }

    this.isBooking = true;
    const currentUser = this.authService.currentUserValue;

    this.cottageService
      .createReservation(this.cottage!._id!, {
        touristId: currentUser!.id!,
        checkIn: new Date(this.checkInDate),
        checkOut: new Date(this.checkOutDate),
        adults: this.adults,
        children: this.children,
        totalPrice: this.calculatedPrice,
        creditCard: this.creditCard,
        note: this.note,
      })
      .subscribe({
        next: (response) => {
          this.isBooking = false;
          alert('Reservation confirmed! ' + response.message);
          this.cancelReservation();
        },
        error: (error) => {
          this.isBooking = false;
          this.availabilityError =
            error.error?.message || 'Failed to create reservation';
        },
      });
  }

  cancelReservation(): void {
    this.reservationStep = 0;
    this.checkInDate = '';
    this.checkOutDate = '';
    this.adults = 2;
    this.children = 0;
    this.note = '';
    this.calculatedPrice = 0;
    this.nights = 0;
    this.availabilityError = '';
    this.availabilityMessage = '';
  }

  backToStep1(): void {
    this.reservationStep = 1;
    this.availabilityError = '';
  }

  goBack(): void {
    this.router.navigate(['/tourist-cottages']);
  }
}
