import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AdminService, AdminCottage } from '../services/admin.service';
import { RegistrationRequest } from '../../models/registration-request.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'requests' | 'users' | 'cottages' = 'requests';

  // Registration requests
  requests: RegistrationRequest[] = [];

  // Users
  users: User[] = [];
  editingUser: User | null = null;
  editForm: Partial<User> = {};

  // Cottages
  cottages: AdminCottage[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  switchTab(tab: 'requests' | 'users' | 'cottages'): void {
    this.activeTab = tab;
    this.clearMessages();

    if (tab === 'requests') {
      this.loadRequests();
    } else if (tab === 'users') {
      this.loadUsers();
    } else if (tab === 'cottages') {
      this.loadCottages();
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Registration Requests Methods
  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.getRegistrationRequests().subscribe({
      next: (requests) => {
        // Map _id to id for each request
        this.requests = requests.map((req: any) => ({
          ...req,
          id: req._id || req.id,
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load registration requests';
        this.isLoading = false;
      },
    });
  }

  approveRequest(id: string): void {
    if (!id) {
      console.error('No ID provided for approval');
      this.errorMessage = 'Invalid request ID';
      return;
    }

    console.log('Approving request with ID:', id);
    this.authService.approveRequest(id).subscribe({
      next: (response) => {
        console.log('Request approved successfully:', response);
        this.successMessage = 'Registration request approved successfully';
        this.loadRequests();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        console.error('Failed to approve request:', error);
        this.errorMessage = error.error?.message || 'Failed to approve request';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  rejectRequest(id: string): void {
    if (!id) {
      console.error('No ID provided for rejection');
      this.errorMessage = 'Invalid request ID';
      return;
    }

    if (
      !confirm(
        'Are you sure you want to reject this request? The username and email will be permanently blocked.'
      )
    ) {
      return;
    }

    console.log('Rejecting request with ID:', id);
    this.authService.rejectRequest(id).subscribe({
      next: (response) => {
        console.log('Request rejected successfully:', response);
        this.successMessage = 'Registration request rejected';
        this.loadRequests();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        console.error('Failed to reject request:', error);
        this.errorMessage = error.error?.message || 'Failed to reject request';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  // User Management Methods
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        // Map _id to id for each user
        this.users = users.map((user: any) => ({
          ...user,
          id: user._id || user.id,
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
      },
    });
  }

  startEditUser(user: User): void {
    this.editingUser = user;
    this.editForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };
  }

  cancelEditUser(): void {
    this.editingUser = null;
    this.editForm = {};
  }

  saveUser(): void {
    if (!this.editingUser || !this.editingUser.id) return;

    this.adminService.updateUser(this.editingUser.id, this.editForm).subscribe({
      next: (response) => {
        this.successMessage = 'User updated successfully';
        this.editingUser = null;
        this.editForm = {};
        this.loadUsers();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update user';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  toggleUserStatus(user: User): void {
    if (!user.id) return;

    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmMsg = user.isActive
      ? 'Are you sure you want to deactivate this user?'
      : 'Are you sure you want to activate this user?';

    if (!confirm(confirmMsg)) return;

    const observable = user.isActive
      ? this.adminService.deactivateUser(user.id)
      : this.adminService.activateUser(user.id);

    observable.subscribe({
      next: (response) => {
        this.successMessage = `User ${action}d successfully`;
        this.loadUsers();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || `Failed to ${action} user`;
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  deleteUser(user: User): void {
    if (!user.id) return;

    if (
      !confirm(
        `Are you sure you want to permanently delete user "${user.username}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: (response) => {
        this.successMessage = 'User deleted successfully';
        this.loadUsers();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to delete user';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  // Cottage Management Methods
  loadCottages(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getAllCottages().subscribe({
      next: (cottages) => {
        this.cottages = cottages;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cottages';
        this.isLoading = false;
      },
    });
  }

  blockCottage(cottage: AdminCottage): void {
    if (!cottage._id) return;

    if (
      !confirm(
        `Are you sure you want to block "${cottage.name}" for 48 hours? No reservations will be allowed during this period.`
      )
    ) {
      return;
    }

    this.adminService.blockCottage(cottage._id).subscribe({
      next: (response) => {
        this.successMessage = 'Cottage blocked for 48 hours';
        this.loadCottages();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to block cottage';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  unblockCottage(cottage: AdminCottage): void {
    if (!cottage._id) return;

    if (!confirm(`Are you sure you want to unblock "${cottage.name}"?`)) {
      return;
    }

    this.adminService.unblockCottage(cottage._id).subscribe({
      next: (response) => {
        this.successMessage = 'Cottage unblocked successfully';
        this.loadCottages();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to unblock cottage';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  getBlockedTimeRemaining(cottage: AdminCottage): string {
    if (!cottage.blockedUntil) return '';

    const now = new Date();
    const blockedUntil = new Date(cottage.blockedUntil);
    const diff = blockedUntil.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin-login']);
  }
}
