import { ThrowStmt } from '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BehaviorSubject, combineLatest, EMPTY, Subject, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';

import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  private categorySelectedSubject = new BehaviorSubject<number>(0);

  pageTitle = 'Product List';
  errorMessage = '';

  categories$ = this.productCategoryService.productCategories$;
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();
  products$ = combineLatest([this.productService.productsWithNew$, this.categorySelectedAction$])
  .pipe(
    map(([products, selectedCategoryId]) =>
      products.filter(product => selectedCategoryId ? product.categoryId === selectedCategoryId : true)
    ),
    catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    })
  );


  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) { }

  onAdd(): void {
    this.productService.addProduct();
  }

  onSelected(categoryId: string): void {
    this.categorySelectedSubject.next(+categoryId);
  }
}
