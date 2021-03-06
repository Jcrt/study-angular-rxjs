import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, from, merge, Observable, Subject, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, scan, share, shareReplay, switchMap, tap, toArray } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { Product } from './product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private supplierUrl = 'api/suppliers/';
  private productsUrl = 'api/products/';
  private productSelectedSubject = new BehaviorSubject<number>(0);
  private productInsertedSubject = new Subject<Product>();

  productSelectedAction$ = this.productSelectedSubject.asObservable();
  productInsertedAction$ = this.productInsertedSubject.asObservable();

  products$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('Products: ', JSON.stringify(data))),
      catchError(this.handleError)
    );

  productsWithCategories$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$
  ]).pipe(
    map(([products, categories]) => {
      return products.map(product => ({
        ...product,
        price: product.price * 1.3,
        category: categories.find(cat => cat.id === product.categoryId).name,
        searchKey: [product.productName]
      }) as Product);
    }),
    shareReplay(1)
  );

  selectedProduct$ = combineLatest(
    [this.productsWithCategories$, this.productSelectedAction$]
  ).pipe(
      map(([products, selectedProductId]) => products.find(product => product.id === selectedProductId)),
      shareReplay(1)
    );

  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,
  //   this.supplierService.suppliers$
  // ]).pipe(
  //   map(([selectedProduct, suppliers]) => {
  //     return suppliers.filter(supplier => selectedProduct.supplierIds.includes(supplier.id));
  //   })
  // );

  selectedProductSuppliers$ = this.selectedProduct$
    .pipe(
      filter(selectedProduct => Boolean(selectedProduct)),
      switchMap(product =>
        from(product.supplierIds)
          .pipe(
            mergeMap(supplierId => this.http.get<Supplier>(`${this.supplierUrl}/${supplierId}`)),
            tap(suppliers => console.log('product suppliers', JSON.stringify(suppliers)))
          )
      )
    );

  productsWithNew$ = merge(
    this.productsWithCategories$,
    this.productInsertedAction$
  ).pipe(
    scan((acc: Product[], value: Product) => [...acc, value])
  );

  constructor(
    private http: HttpClient,
    private supplierService: SupplierService,
    private productCategoryService: ProductCategoryService
  ) { }


  selectedProductChanged(productId: number): void{
    this.productSelectedSubject.next(productId);
  }

  addProduct(newProduct?: Product): void{
    const addedProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(addedProduct);
  }

  fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another one',
      productCode: 'TBX-003',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      quantityInStock: 30,
      searchKey: ['Another one']
    } as Product;
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

}
