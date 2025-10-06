import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
})
export class ChangePasswordComponent {
  username: string = '';
  oldPassword: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // Real-time password validation feedback
  passwordErrors: string[] = [];
  showPasswordErrors: boolean = false;
  showPasswordMismatch: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  validateForm(): boolean {
    this.errorMessage = '';

    if (
      !this.username ||
      !this.oldPassword ||
      !this.newPassword ||
      !this.confirmNewPassword
    ) {
      this.errorMessage = 'All fields are required';
      return false;
    }

    if (this.oldPassword === this.newPassword) {
      this.errorMessage = 'New password must be different from old password';
      return false;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters long';
      return false;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'New passwords do not match';
      return false;
    }

    return true;
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
    if (this.newPassword && this.confirmNewPassword) {
      this.showPasswordMismatch = this.newPassword !== this.confirmNewPassword;
    } else {
      this.showPasswordMismatch = false;
    }
  }

  validatePasswordRealtime(): void {
    this.passwordErrors = [];
    const password = this.newPassword;

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

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.authService
      .changePassword(this.username, this.oldPassword, this.newPassword)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message || 'Password change failed. Please try again.';
        },
      });
  }
}
