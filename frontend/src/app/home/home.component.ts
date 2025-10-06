import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PublicService, Statistics, Cottage } from '../services/public.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  statistics: Statistics | null = null;
  cottages: Cottage[] = [];
  isLoadingStats: boolean = true;
  isLoadingCottages: boolean = true;
  errorMessage: string = '';

  // Filter and sort options
  searchName: string = '';
  searchLocation: string = '';
  sortBy: string = 'name';
  sortOrder: string = 'asc';

  constructor(private publicService: PublicService) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadCottages();
  }

  loadStatistics(): void {
    this.isLoadingStats = true;
    this.publicService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.isLoadingStats = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load statistics';
        this.isLoadingStats = false;
      },
    });
  }

  loadCottages(): void {
    this.isLoadingCottages = true;
    const name = this.searchName.trim() || undefined;
    const location = this.searchLocation.trim() || undefined;

    this.publicService
      .getCottages(this.sortBy, this.sortOrder, name, location)
      .subscribe({
        next: (cottages) => {
          this.cottages = cottages;
          this.isLoadingCottages = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load cottages';
          this.isLoadingCottages = false;
        },
      });
  }

  onSearch(): void {
    this.loadCottages();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      // Toggle sort order
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
}
