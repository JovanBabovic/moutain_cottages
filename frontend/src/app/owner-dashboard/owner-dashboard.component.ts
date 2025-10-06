import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css'],
})
export class OwnerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'profile';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
  }

  navigateTo(section: string): void {
    this.activeSection = section;
    if (section === 'profile') {
      this.router.navigate(['/owner-dashboard/profile']);
    } else if (section === 'cottages') {
      this.router.navigate(['/owner-dashboard/cottages']);
    } else if (section === 'reservations') {
      this.router.navigate(['/owner-dashboard/reservations']);
    } else if (section === 'statistics') {
      this.router.navigate(['/owner-dashboard/statistics']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
