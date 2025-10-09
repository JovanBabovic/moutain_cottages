import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CottageService, Cottage } from '../services/cottage.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-cottages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-cottages.component.html',
  styleUrls: ['./owner-cottages.component.css'],
})
export class OwnerCottagesComponent implements OnInit {
  cottages: Cottage[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // Modal states
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showJsonModal: boolean = false;

  // Form data
  cottageForm: any = {
    name: '',
    location: '',
    description: '',
    summerPrice: 0,
    winterPrice: 0,
    capacity: 0,
    amenities: '',
    phone: '',
    latitude: '',
    longitude: '',
  };

  selectedCottage: Cottage | null = null;
  selectedImages: File[] = [];
  existingImages: string[] = [];
  jsonFile: File | null = null;

  constructor(
    private cottageService: CottageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCottages();
  }

  loadCottages(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.cottageService.getOwnerCottages(currentUser.id).subscribe({
      next: (data) => {
        this.cottages = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cottages';
        this.isLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.resetForm();
    this.showAddModal = true;
  }

  openEditModal(cottage: Cottage): void {
    this.selectedCottage = cottage;
    this.cottageForm = {
      name: cottage.name,
      location: cottage.location,
      description: cottage.description || '',
      summerPrice: cottage.summerPrice || 0,
      winterPrice: cottage.winterPrice || 0,
      capacity: cottage.capacity,
      amenities: cottage.amenities ? cottage.amenities.join(', ') : '',
      phone: (cottage as any).phone || '',
      latitude: (cottage as any).latitude || '',
      longitude: (cottage as any).longitude || '',
    };
    this.existingImages = cottage.images || [];
    this.selectedImages = [];
    this.showEditModal = true;
  }

  openDeleteModal(cottage: Cottage): void {
    this.selectedCottage = cottage;
    this.showDeleteModal = true;
  }

  openJsonModal(): void {
    this.jsonFile = null;
    this.showJsonModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showJsonModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.cottageForm = {
      name: '',
      location: '',
      description: '',
      summerPrice: 0,
      winterPrice: 0,
      capacity: 0,
      amenities: '',
      phone: '',
      latitude: '',
      longitude: '',
    };
    this.selectedImages = [];
    this.existingImages = [];
    this.selectedCottage = null;
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedImages = Array.from(files);
    }
  }

  onJsonFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      this.jsonFile = file;
    } else {
      this.errorMessage = 'Please select a valid JSON file';
      setTimeout(() => (this.errorMessage = ''), 3000);
    }
  }

  removeExistingImage(image: string): void {
    this.existingImages = this.existingImages.filter((img) => img !== image);
  }

  submitAdd(): void {
    if (!this.validateForm()) {
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not found';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.cottageForm.name);
    formData.append('location', this.cottageForm.location);
    formData.append('description', this.cottageForm.description);
    formData.append('summerPrice', this.cottageForm.summerPrice.toString());
    formData.append('winterPrice', this.cottageForm.winterPrice.toString());
    formData.append('capacity', this.cottageForm.capacity.toString());
    formData.append('ownerId', currentUser.id);
    formData.append('phone', this.cottageForm.phone);
    formData.append('latitude', this.cottageForm.latitude);
    formData.append('longitude', this.cottageForm.longitude);

    // Parse amenities
    const amenitiesList = this.cottageForm.amenities
      .split(',')
      .map((a: string) => a.trim())
      .filter((a: string) => a);
    formData.append('amenities', JSON.stringify(amenitiesList));

    // Add images
    this.selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    this.cottageService.createCottage(formData).subscribe({
      next: (response) => {
        this.successMessage = 'Cottage created successfully!';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.closeModals();
        this.loadCottages();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to create cottage';
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  submitEdit(): void {
    if (!this.validateForm() || !this.selectedCottage) {
      return;
    }

    const formData = new FormData();
    formData.append('name', this.cottageForm.name);
    formData.append('location', this.cottageForm.location);
    formData.append('description', this.cottageForm.description);
    formData.append('summerPrice', this.cottageForm.summerPrice.toString());
    formData.append('winterPrice', this.cottageForm.winterPrice.toString());
    formData.append('capacity', this.cottageForm.capacity.toString());
    formData.append('phone', this.cottageForm.phone);
    formData.append('latitude', this.cottageForm.latitude);
    formData.append('longitude', this.cottageForm.longitude);

    // Parse amenities
    const amenitiesList = this.cottageForm.amenities
      .split(',')
      .map((a: string) => a.trim())
      .filter((a: string) => a);
    formData.append('amenities', JSON.stringify(amenitiesList));

    // Existing images to keep
    formData.append('existingImages', JSON.stringify(this.existingImages));

    // Add new images
    this.selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    this.cottageService
      .updateCottage(this.selectedCottage._id!, formData)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Cottage updated successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.closeModals();
          this.loadCottages();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Failed to update cottage';
          setTimeout(() => (this.errorMessage = ''), 5000);
        },
      });
  }

  submitDelete(): void {
    if (!this.selectedCottage) {
      return;
    }

    this.cottageService.deleteCottage(this.selectedCottage._id!).subscribe({
      next: (response) => {
        this.successMessage = 'Cottage deleted successfully!';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.closeModals();
        this.loadCottages();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to delete cottage';
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  submitJsonImport(): void {
    if (!this.jsonFile) {
      this.errorMessage = 'Please select a JSON file';
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not found';
      return;
    }

    const formData = new FormData();
    formData.append('jsonFile', this.jsonFile);

    this.cottageService.importFromJSON(currentUser.id, formData).subscribe({
      next: (response) => {
        this.successMessage = 'Cottage imported successfully from JSON!';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.closeModals();
        this.loadCottages();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Failed to import cottage from JSON';
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  validateForm(): boolean {
    if (
      !this.cottageForm.name ||
      !this.cottageForm.location ||
      !this.cottageForm.summerPrice ||
      !this.cottageForm.winterPrice ||
      !this.cottageForm.capacity
    ) {
      this.errorMessage =
        'Please fill in all required fields (including both summer and winter prices)';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return false;
    }

    if (this.cottageForm.summerPrice === this.cottageForm.winterPrice) {
      this.errorMessage = 'Summer and winter prices must be different';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return false;
    }

    return true;
  }

  getImageUrl(imagePath: string): string {
    // If imagePath already starts with /uploads, use it as is
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:4000${imagePath}`;
    }
    // Otherwise, assume it's just a filename and prepend the cottages path
    return `http://localhost:4000/uploads/cottages/${imagePath}`;
  }

  onImageError(event: any): void {
    // Fallback to default cottage image if the image fails to load
    event.target.src =
      'http://localhost:4000/uploads/cottages/default-cottage.jpg';
  }
}
