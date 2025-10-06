import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CottageService, Cottage } from '../services/cottage.service';

@Component({
  selector: 'app-tourist-cottages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tourist-cottages.component.html',
  styleUrls: ['./tourist-cottages.component.css'],
})
export class TouristCottagesComponent implements OnInit {
  cottages: Cottage[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  // Filter and sort options
  searchName: string = '';
  searchLocation: string = '';
  sortBy: string = 'name';
  sortOrder: string = 'asc';

  constructor(private cottageService: CottageService, private router: Router) {}

  ngOnInit(): void {
    this.loadCottages();
  }

  loadCottages(): void {
    this.isLoading = true;
    const name = this.searchName.trim() || undefined;
    const location = this.searchLocation.trim() || undefined;

    this.cottageService
      .getCottages(this.sortBy, this.sortOrder, name, location)
      .subscribe({
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

  onSearch(): void {
    this.loadCottages();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadCottages();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return '↕';
    }
    return this.sortOrder === 'asc' ? '↑' : '↓';
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

  viewDetails(cottageId: string): void {
    this.router.navigate(['/cottage-details', cottageId]);
  }
}
