import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { RegisterComponent } from './register/register.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { TouristDashboardComponent } from './tourist-dashboard/tourist-dashboard.component';
import { TouristProfileComponent } from './tourist-profile/tourist-profile.component';
import { TouristCottagesComponent } from './tourist-cottages/tourist-cottages.component';
import { TouristReservationsComponent } from './tourist-reservations/tourist-reservations.component';
import { CottageDetailsComponent } from './cottage-details/cottage-details.component';
import { OwnerDashboardComponent } from './owner-dashboard/owner-dashboard.component';
import { OwnerProfileComponent } from './owner-profile/owner-profile.component';
import { OwnerReservationsComponent } from './owner-reservations/owner-reservations.component';
import { OwnerCottagesComponent } from './owner-cottages/owner-cottages.component';
import { OwnerStatisticsComponent } from './owner-statistics/owner-statistics.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'admin', component: AdminLoginComponent },
  {
    path: 'tourist-dashboard',
    component: TouristDashboardComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: TouristProfileComponent },
      { path: 'cottages', component: TouristCottagesComponent },
      { path: 'reservations', component: TouristReservationsComponent },
    ],
  },
  // Redirect old standalone routes to dashboard child routes
  { path: 'tourist-profile', redirectTo: '/tourist-dashboard/profile' },
  { path: 'tourist-cottages', redirectTo: '/tourist-dashboard/cottages' },
  {
    path: 'tourist-reservations',
    redirectTo: '/tourist-dashboard/reservations',
  },
  { path: 'cottage-details/:id', component: CottageDetailsComponent },
  {
    path: 'owner-dashboard',
    component: OwnerDashboardComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: OwnerProfileComponent },
      { path: 'cottages', component: OwnerCottagesComponent },
      { path: 'reservations', component: OwnerReservationsComponent },
      { path: 'statistics', component: OwnerStatisticsComponent },
    ],
  },
  // Redirect old standalone routes to dashboard child routes
  { path: 'owner-profile', redirectTo: '/owner-dashboard/profile' },
  { path: 'owner-cottages', redirectTo: '/owner-dashboard/cottages' },
  { path: 'owner-reservations', redirectTo: '/owner-dashboard/reservations' },
  { path: 'owner-statistics', redirectTo: '/owner-dashboard/statistics' },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: '**', redirectTo: '/' },
];
