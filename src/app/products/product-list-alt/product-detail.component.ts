import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { Product } from '../product';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {

  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(private productService: ProductService) { }

  product$ = this.productService.selectedProduct$
  .pipe(
    catchError(err => {
      this.errorMessageSubject.next(err)
      return EMPTY;
    })
  );

  pageTitle$ = this.product$.pipe(
    map((product: Product) => product ? `Details for product: ${product.productName}` : null)
  );

  productSuppliers$ = this.productService.selectedProductSuppliers$
    .pipe(
      catchError(err => {
        this.errorMessageSubject.next(err)
        return EMPTY;
      })
    )

  dummyViewModel$ = combineLatest([
    this.product$,
    this.pageTitle$,
    this.productSuppliers$
  ]).pipe(
    filter(([product]) => Boolean(product)),
    map(([product, pageTitle, suppliers]) => {
      return {product, pageTitle, suppliers};
    })
  );
}
