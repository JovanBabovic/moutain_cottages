import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-owner-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-profile.component.html',
  styleUrls: ['./owner-profile.component.css'],
})
export class OwnerProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditMode: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Edit form data
  editData = {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    phone: '',
    creditCard: '',
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.editData = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        address: this.currentUser.address,
        phone: this.currentUser.phone,
        creditCard: this.currentUser.creditCard || '',
      };
    }
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedFile = null;
    this.previewUrl = null;

    if (!this.isEditMode && this.currentUser) {
      // Reset form data if canceling edit
      this.editData = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        address: this.currentUser.address,
        phone: this.currentUser.phone,
        creditCard: this.currentUser.creditCard || '',
      };
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      this.errorMessage = 'Only JPG and PNG images are allowed';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 5MB';
      return;
    }

    // Client-side dimension validation
    const img = new Image();
    img.onload = () => {
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

      this.errorMessage = '';
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    };

    const reader = new FileReader();
    reader.onload = (e: any) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (
      !this.editData.firstName ||
      !this.editData.lastName ||
      !this.editData.email ||
      !this.editData.address ||
      !this.editData.phone
    ) {
      this.errorMessage = 'All fields are required';
      return;
    }

    const formData = new FormData();
    formData.append('firstName', this.editData.firstName);
    formData.append('lastName', this.editData.lastName);
    formData.append('email', this.editData.email);
    formData.append('address', this.editData.address);
    formData.append('phone', this.editData.phone);
    formData.append('creditCard', this.editData.creditCard);

    if (this.selectedFile) {
      formData.append('profilePicture', this.selectedFile);
    }

    this.authService.updateProfile(this.currentUser!.id!, formData).subscribe({
      next: (response) => {
        this.successMessage = 'Profile updated successfully!';
        this.currentUser = this.authService.currentUserValue;
        this.isEditMode = false;
        this.selectedFile = null;
        this.previewUrl = null;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update profile';
      },
    });
  }

  getProfilePictureUrl(): string {
    if (this.currentUser?.profilePicture) {
      return `http://localhost:4000${this.currentUser.profilePicture}`;
    }
    return 'http://localhost:4000/uploads/profiles/defaultphoto.jpg';
  }

  onImageError(event: any): void {
    // Fallback to default image if profile image fails to load
    event.target.src =
      'http://localhost:4000/uploads/profiles/defaultphoto.jpg';
  }
}
