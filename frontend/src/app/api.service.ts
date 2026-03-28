import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  // Simple caches
  private productsCache: any[] = [];
  private warehousesCache: any[] = [];
  private ordersCache: any[] = [];

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any[]> {
    if (this.productsCache.length > 0) return of(this.productsCache);
    return this.http.get<any[]>(`${this.baseUrl}/products`).pipe(
      tap(res => this.productsCache = res),
      catchError(err => throwError(() => err))
    );
  }

  // Not cached because it's dynamic
  searchProducts(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/search?name=${name}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  addProduct(product: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/products`, product).pipe(
      tap(() => this.productsCache = []), // invalidate
      catchError(err => throwError(() => err))
    );
  }

  getWarehouses(): Observable<any[]> {
    if (this.warehousesCache.length > 0) return of(this.warehousesCache);
    return this.http.get<any[]>(`${this.baseUrl}/warehouses`).pipe(
      tap(res => this.warehousesCache = res),
      catchError(err => throwError(() => err))
    );
  }

  addWarehouse(warehouse: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/warehouses`, warehouse).pipe(
      tap(() => this.warehousesCache = []), // invalidate
      catchError(err => throwError(() => err))
    );
  }

  getOrders(): Observable<any[]> {
    if (this.ordersCache.length > 0) return of(this.ordersCache);
    return this.http.get<any[]>(`${this.baseUrl}/orders`).pipe(
      tap(res => this.ordersCache = res),
      catchError(err => throwError(() => err))
    );
  }

  addOrder(order: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders`, order).pipe(
      tap(() => this.ordersCache = []), // invalidate
      catchError(err => throwError(() => err))
    );
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/orders/${id}/status?status=${status}`, {}).pipe(
      tap(() => this.ordersCache = []), // invalidate
      catchError(err => throwError(() => err))
    );
  }

  getRouteOptimization(): Observable<any[]> {
    // Return warehouse cache if possible to save network trip - mock equivalent logic
    if (this.warehousesCache.length > 0) return of(this.warehousesCache);
    return this.http.get<any[]>(`${this.baseUrl}/optimization/route`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getForecast(productId?: number): Observable<any> {
    const url = productId ? `${this.baseUrl}/optimization/forecast?productId=${productId}` : `${this.baseUrl}/optimization/forecast`;
    return this.http.get<any>(url).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
