import * as rxjs from 'rxjs';

console.log(rxjs);
const obs$ = rxjs.of(1,2,3,4);
(<any>window).obs = obs$;

obs$.subscribe(no => console.log(no));