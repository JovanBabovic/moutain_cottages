import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-tourist-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tourist-profile.component.html',
  styleUrls: ['./tourist-profile.component.css'],
})
export class TouristProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditing: boolean = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Edit form data
  editData = {
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    email: '',
    creditCard: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  cardType: string | null = null; // For displaying card type logo

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (this.currentUser) {
      this.editData = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        address: this.currentUser.address,
        phone: this.currentUser.phone,
        email: this.currentUser.email,
        creditCard: this.currentUser.creditCard || '',
      };
      this.detectCardType();
    }
  }

  getProfilePictureUrl(): string {
    if (this.currentUser?.profilePicture) {
      return `http://localhost:4000${this.currentUser.profilePicture}`;
    }
    return 'assets/default-avatar.png';
  }

  toggleEdit(): void {
    if (this.isEditing) {
      // Cancel editing
      this.isEditing = false;
      this.selectedFile = null;
      this.previewUrl = null;
      this.loadUserData();
    } else {
      // Start editing
      this.isEditing = true;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        this.errorMessage = 'Only JPG and PNG images are allowed';
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 5MB';
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          // Validate dimensions
          if (img.width < 100 || img.height < 100) {
            this.errorMessage = 'Image must be at least 100x100 pixels';
            this.selectedFile = null;
            this.previewUrl = null;
            return;
          }
          if (img.width > 300 || img.height > 300) {
            this.errorMessage = 'Image must not exceed 300x300 pixels';
            this.selectedFile = null;
            this.previewUrl = null;
            return;
          }

          this.previewUrl = e.target.result;
          this.errorMessage = '';
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  validateForm(): boolean {
    this.errorMessage = '';

    if (
      !this.editData.firstName ||
      !this.editData.lastName ||
      !this.editData.address ||
      !this.editData.phone ||
      !this.editData.email
    ) {
      this.errorMessage = 'All fields are required';
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    return true;
  }

  detectCardType(): void {
    const cleanedCard = this.editData.creditCard.replace(/[\s\-]/g, '');

    if (!/^[0-9]+$/.test(cleanedCard)) {
      this.cardType = null;
      return;
    }

    // Diners: 15 digits
    if (cleanedCard.length === 15) {
      if (/^(300|301|302|303|36|38)/.test(cleanedCard)) {
        this.cardType = 'diners';
        return;
      }
    }

    // MasterCard and Visa: 16 digits
    if (cleanedCard.length === 16) {
      // MasterCard
      if (/^(51|52|53|54|55)/.test(cleanedCard)) {
        this.cardType = 'mastercard';
        return;
      }
      // Visa
      if (/^(4539|4556|4916|4532|4929|4485|4716)/.test(cleanedCard)) {
        this.cardType = 'visa';
        return;
      }
    }

    this.cardType = null;
  }

  onCreditCardInput(): void {
    this.detectCardType();
  }

  onSubmit(): void {
    if (!this.validateForm() || !this.currentUser?.id) {
      return;
    }

    this.isLoading = true;
    const formData = new FormData();

    formData.append('firstName', this.editData.firstName);
    formData.append('lastName', this.editData.lastName);
    formData.append('address', this.editData.address);
    formData.append('phone', this.editData.phone);
    formData.append('email', this.editData.email);
    if (this.editData.creditCard) {
      formData.append('creditCard', this.editData.creditCard);
    }

    if (this.selectedFile) {
      formData.append('profilePicture', this.selectedFile);
    }

    this.authService.updateProfile(this.currentUser.id, formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        this.currentUser = response.user;
        this.isEditing = false;
        this.selectedFile = null;
        this.previewUrl = null;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Profile update failed. Please try again.';
      },
    });
  }
}
