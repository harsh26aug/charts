import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedNiftyStockResponse, StockQueryParams } from '@core/models/stock.models';
import { environment } from '@env/environment';

@Injectable()
export class Nifty50Service {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stocks/nifty50`;

  getNiftyStockHistory(params: StockQueryParams): Observable<PaginatedNiftyStockResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit);

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<PaginatedNiftyStockResponse>(this.baseUrl, { params: httpParams });
  }
}
