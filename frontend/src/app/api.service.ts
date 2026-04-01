import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8080/api';

  // In-memory cache
  private warehousesCache: any[] | null = null;
  private productsCache: any[] | null = null;

  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/summary`);
  }

  getProducts(): Observable<any[]> {
    if (this.productsCache) {
      return of(this.productsCache);
    }
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      tap(data => this.productsCache = data)
    );
  }

  addProduct(product: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, product).pipe(
      tap((saved: any) => {
        if (this.productsCache) this.productsCache.push(saved);
        else this.productsCache = [saved];
      })
    );
  }

  getWarehouses(): Observable<any[]> {
    if (this.warehousesCache) {
      return of(this.warehousesCache);
    }
    return this.http.get<any[]>(`${this.apiUrl}/warehouses`).pipe(
      tap(data => this.warehousesCache = data)
    );
  }

  addWarehouse(warehouse: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/warehouses`, warehouse).pipe(
      tap((saved: any) => {
        // Only append to cache if it is already populated.
        // If cache is null (was invalidated), leave it null so the next
        // getWarehouses() call does a fresh HTTP fetch with all hubs.
        if (this.warehousesCache) {
          this.warehousesCache.push(saved);
        }
      })
    );
  }

  invalidateWarehouseCache() {
    this.warehousesCache = null;
  }

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`);
  }

  addOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, order);
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/status?status=${status}`, {});
  }

  getRouteOptimization(startHubId?: number, endHubId?: number): Observable<any> {
    let params = '';
    if (startHubId != null && endHubId != null) {
      params = `?startHubId=${startHubId}&endHubId=${endHubId}`;
    } else if (startHubId != null) {
      params = `?startHubId=${startHubId}`;
    } else if (endHubId != null) {
      params = `?endHubId=${endHubId}`;
    }
    return this.http.get<any>(`${this.apiUrl}/optimization/route${params}`);
  }

  getForecast(productId?: number): Observable<any> {
    const params = productId ? `?productId=${productId}` : '';
    return this.http.get<any>(`${this.apiUrl}/optimization/forecast${params}`);
  }

  searchProducts(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/search?name=${encodeURIComponent(name)}`);
  }
}
