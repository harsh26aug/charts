import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedSensexStockResponse, StockQueryParams } from '@core/models/stock.models';
import { environment } from '@env/environment';

@Injectable()
export class SensexService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stocks/sensex`;

  getSensexStockHistory(params: StockQueryParams): Observable<PaginatedSensexStockResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit);

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<PaginatedSensexStockResponse>(this.baseUrl, { params: httpParams });
  }
}
