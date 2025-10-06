import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-tourist-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tourist-dashboard.component.html',
  styleUrls: ['./tourist-dashboard.component.css'],
})
export class TouristDashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'profile';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
  }

  navigateTo(section: string): void {
    this.activeSection = section;
    if (section === 'profile') {
      this.router.navigate(['/tourist-dashboard/profile']);
    } else if (section === 'cottages') {
      this.router.navigate(['/tourist-dashboard/cottages']);
    } else if (section === 'reservations') {
      this.router.navigate(['/tourist-dashboard/reservations']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
