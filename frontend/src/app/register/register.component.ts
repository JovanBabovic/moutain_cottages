import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RegistrationRequest } from '../../models/registration-request.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  formData: RegistrationRequest = {
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'M',
    address: '',
    phone: '',
    email: '',
    creditCard: '',
    userType: 'tourist',
  };

  confirmPassword: string = '';
  errorMessage: string = '';
  errorMessages: string[] = []; // Array for multiple validation errors
  successMessage: string = '';
  isLoading: boolean = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  cardType: string | null = null; // For displaying card type icon

  // Real-time password validation feedback
  passwordErrors: string[] = [];
  showPasswordErrors: boolean = false;
  showPasswordMismatch: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  validateForm(): boolean {
    // Reset messages
    this.errorMessage = '';
    this.errorMessages = [];
    this.successMessage = '';

    // Check all required fields
    if (
      !this.formData.username ||
      !this.formData.password ||
      !this.formData.firstName ||
      !this.formData.lastName ||
      !this.formData.address ||
      !this.formData.phone ||
      !this.formData.email ||
      !this.formData.creditCard
    ) {
      this.errorMessage = 'All fields are required';
      return false;
    }

    // Validate username (minimum 3 characters)
    if (this.formData.username.length < 3) {
      this.errorMessage = 'Username must be at least 3 characters long';
      return false;
    }

    // Validate password with specific requirements
    if (
      this.formData.password.length < 6 ||
      this.formData.password.length > 10
    ) {
      this.errorMessage = 'Password must be 6-10 characters long';
      return false;
    }

    // Must begin with a letter
    if (!/^[a-zA-Z]/.test(this.formData.password)) {
      this.errorMessage = 'Password must begin with a letter';
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(this.formData.password)) {
      this.errorMessage = 'Password must contain at least one uppercase letter';
      return false;
    }

    // At least three lowercase letters
    const lowercaseCount = (this.formData.password.match(/[a-z]/g) || [])
      .length;
    if (lowercaseCount < 3) {
      this.errorMessage =
        'Password must contain at least three lowercase letters';
      return false;
    }

    // At least one digit
    if (!/[0-9]/.test(this.formData.password)) {
      this.errorMessage = 'Password must contain at least one digit';
      return false;
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.formData.password)) {
      this.errorMessage =
        'Password must contain at least one special character';
      return false;
    }

    // Check password confirmation
    if (this.formData.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    // Validate phone (simple check for numbers)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(this.formData.phone)) {
      this.errorMessage = 'Please enter a valid phone number';
      return false;
    }

    // Validate credit card (Diners, MasterCard, or Visa)
    const cleanedCard = this.formData.creditCard.replace(/[\s\-]/g, '');

    if (!/^[0-9]+$/.test(cleanedCard)) {
      this.errorMessage = 'Credit card must contain only digits';
      return false;
    }

    let isValidCard = false;

    // Diners: 15 digits, starts with 300-303, 36, or 38
    if (cleanedCard.length === 15) {
      if (/^(300|301|302|303|36|38)/.test(cleanedCard)) {
        isValidCard = true;
      }
    }

    // MasterCard or Visa: 16 digits
    if (cleanedCard.length === 16) {
      // MasterCard: starts with 51-55
      if (/^(51|52|53|54|55)/.test(cleanedCard)) {
        isValidCard = true;
      }
      // Visa: starts with 4539, 4556, 4916, 4532, 4929, 4485, or 4716
      if (/^(4539|4556|4916|4532|4929|4485|4716)/.test(cleanedCard)) {
        isValidCard = true;
      }
    }

    if (!isValidCard) {
      this.errorMessage =
        'Invalid credit card. Must be Diners (15 digits, starts with 300-303/36/38), MasterCard (16 digits, starts with 51-55), or Visa (16 digits, starts with 4539/4556/4916/4532/4929/4485/4716)';
      return false;
    }

    return true;
  }

  detectCardType(): void {
    const cleanedCard = this.formData.creditCard.replace(/[\s\-]/g, '');

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

  onPasswordInput(): void {
    this.validatePasswordRealtime();
    this.checkPasswordMatch();
  }

  onConfirmPasswordInput(): void {
    this.checkPasswordMatch();
  }

  checkPasswordMatch(): void {
    // Only show mismatch if both fields have values
    if (this.formData.password && this.confirmPassword) {
      this.showPasswordMismatch =
        this.formData.password !== this.confirmPassword;
    } else {
      this.showPasswordMismatch = false;
    }
  }

  validatePasswordRealtime(): void {
    this.passwordErrors = [];
    const password = this.formData.password;

    // Only show errors if user has started typing
    if (!password) {
      this.showPasswordErrors = false;
      return;
    }

    this.showPasswordErrors = true;

    // Check length
    if (password.length < 6 || password.length > 10) {
      this.passwordErrors.push('Must be 6-10 characters long');
    }

    // Must begin with a letter
    if (!/^[a-zA-Z]/.test(password)) {
      this.passwordErrors.push('Must begin with a letter');
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      this.passwordErrors.push('Must contain at least 1 uppercase letter');
    }

    // At least three lowercase letters
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount < 3) {
      this.passwordErrors.push('Must contain at least 3 lowercase letters');
    }

    // At least one digit
    if (!/[0-9]/.test(password)) {
      this.passwordErrors.push('Must contain at least 1 digit');
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      this.passwordErrors.push('Must contain at least 1 special character');
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

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    // Check if owner must upload profile picture
    if (this.formData.userType === 'owner' && !this.selectedFile) {
      // Owner can proceed without picture (will get default)
      // But we show a message
      if (
        !confirm(
          'You have not uploaded a profile picture. A default picture will be used. Continue?'
        )
      ) {
        return;
      }
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('username', this.formData.username);
    formData.append('password', this.formData.password);
    formData.append('firstName', this.formData.firstName);
    formData.append('lastName', this.formData.lastName);
    formData.append('gender', this.formData.gender);
    formData.append('address', this.formData.address);
    formData.append('phone', this.formData.phone);
    formData.append('email', this.formData.email);
    formData.append('creditCard', this.formData.creditCard);
    formData.append('userType', this.formData.userType);

    if (this.selectedFile) {
      formData.append('profilePicture', this.selectedFile);
    }

    this.authService.registerWithFile(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;

        // Check if backend returned specific validation errors
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          this.errorMessages = error.error.errors;
          this.errorMessage = ''; // Clear single error message
        } else {
          // Fallback to single error message
          this.errorMessage =
            error.error?.message || 'Registration failed. Please try again.';
          this.errorMessages = [];
        }
      },
    });
  }
}
