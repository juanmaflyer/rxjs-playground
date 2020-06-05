function instrument<T>(source: Observable<T>) {
  return new Observable<T>((observer) => {
    console.log("source: subscribing");
    const subscription = source
      .pipe(tap((value) => console.log(`source: ${value}`)))
      .subscribe(observer);
    return () => {
      subscription.unsubscribe();
      console.log("source: unsubscribed");
    };
  });
}

function observer<T>(name: string) {
  return {
    next: (value: T) => console.log(`observer ${name}: ${value}`),
    complete: () => console.log(`observer ${name}: complete`)
  };
}
