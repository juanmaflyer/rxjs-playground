import * as rxjs from 'rxjs';
import * as operators from 'rxjs/operators';

// export rxjs globally to window
(<any>window).rxjs = rxjs;

let examsByNameAndTime = [{ name: 'Juan', time: 1000 }, { name: 'Facu', time: 2000 }, { name: 'Fede', time: 3000 }];

let exams_stream = rxjs.from(examsByNameAndTime).pipe(
    operators.mergeMap( examData => rxjs.of(examData).pipe(operators.delay(examData.time)) )
);

// flatMap is an alias for mergeMap.
// -- Parallel revision simulation
let score_streams = exams_stream.pipe(
    operators.tap((exam) => console.log("[ENTREGA]", `${exam.name} Entrego el parcial en ${Math.floor(exam.time/1000)} segundos`) ),
    operators.flatMap( (exam) => {
        console.log("[COMIENZO CORRECCION]", `Empezando a corregir el parcial de ${exam.name}`);
        let correction_time = exam.name === 'Facu' ? 5000 : exam.name === 'Caro' ? 5000 : 5000;
        let score = Math.floor((Math.random() * 10) + 1);
        return rxjs.of( { name: exam.name, score: score }).pipe(
            operators.delay(correction_time),
            operators.tap((exam_result) => console.log("[FINALIZACION CORRECION]", 'Se termino de corregir el examen de', exam_result.name, "en", Math.floor(correction_time/1000), "segundos y se saco un:", exam_result.score))
        )
    })
)

// --  Sequential revision simulation
// this stream represents the scenario where each exam is start being correct at the moment of delivery. This will represent
// the case where on professor is available for correcting the exams. So if an exam arrives when the professor is still correcting one
// the latter will need to wait. The mergeMap (or flatMap) scenario simulates an scenario with infinite number of professors available at the moment
// the exams are delivery. Of course the mergeMap solution is faster
let score_streams_sequential = exams_stream.pipe(
    operators.tap((exam) => console.log("[ENTREGA]", `${exam.name} Entrego el parcial en ${Math.floor(exam.time/1000)} segundos`) ),
    operators.concatMap( (exam) => {
        console.log("[COMIENZO CORRECCION]", `Empezando a corregir el parcial de ${exam.name}`);
        let correction_time = exam.name === 'Facu' ? 5000 : exam.name === 'Caro' ? 5000 : 5000;
        let score = Math.floor((Math.random() * 10) + 1);
        return rxjs.of( { name: exam.name, score: score }).pipe(
            operators.delay(correction_time),
            operators.tap((exam_result) => console.log("[FINALIZACION CORRECION]", 'Se termino de corregir el examen de', exam_result.name, "en", Math.floor(correction_time/1000), "segundos y se saco un:", exam_result.score))
        )
    })
)

// score_streams.subscribe()
// score_streams_sequential.subscribe()

// How to create a stream that emits according a defined array of times. This is useful to test and to combine with observables to emit with a desired and
// fixed amount of time

const times = [1000, 3000, 5000];

const times_stream = rxjs.from(times).pipe(
    operators.flatMap(delay => rxjs.of(delay).pipe(operators.delay(delay)))
);

const names_stream = rxjs.zip(times_stream, rxjs.of('juan','facu','fede')); // will emit juan after 1 second, facu after 3 and fede after 5

// --- flattening strategies with click examples

// with debug info
let obs = rxjs.fromEvent(document, 'click').pipe(
    operators.tap(() => console.log('Hiciste click' ) ),
    operators.flatMap( (event) => {
        console.log('inside mapping');
        return rxjs.interval(1000).pipe(operators.take(3));
    })
);

let flat = rxjs.fromEvent(document, 'click').pipe(
    operators.flatMap( (event) => {
        return rxjs.interval(1000).pipe(operators.take(3));
    })
);

let concat = rxjs.fromEvent(document, 'click').pipe(
    operators.concatMap( (event) => {
        return rxjs.interval(1000).pipe(operators.take(3));
    })
);

let switchMap = rxjs.fromEvent(document, 'click').pipe(
    operators.switchMap( (event) => {
        return rxjs.interval(1000).pipe(operators.take(3));
    })
);
let exhaust = rxjs.fromEvent(document, 'click').pipe(
    operators.exhaustMap( (event) => {
        return rxjs.interval(1000).pipe(operators.take(3));
    })
);

// concat behaviour with map followed by concatAll differs from concatMap
let concat1 = rxjs.fromEvent(document, 'click').pipe(
    operators.tap(() => console.log('Hiciste click' ) ),
    operators.map( (event) => {
        console.log('inside mapping');
        return rxjs.interval(1000).pipe(operators.take(3));
    }),
    operators.concatAll()
);

let concat2 = rxjs.fromEvent(document, 'click').pipe(
    operators.tap(() => console.log('Hiciste click' ) ),
    operators.concatMap( (event) => {
        console.log('inside mapping');
        return rxjs.interval(1000).pipe(operators.take(3));
    })
);

// don't have the same behaviour
// concat1.subscribe(console.log)
// concat2.subscribe(console.log)

document.querySelectorAll('#parallel_revision_btn')[0].addEventListener('click', (evt) => {
    score_streams.subscribe();
});

document.querySelectorAll('#sequential_revision_btn')[0].addEventListener('click', (evt) => {
    score_streams_sequential.subscribe();
});


// =============== subjects, hot & colds observables and multicasting tests


// ====== multicast observable via subject

let int = rxjs.interval(1000).pipe(operators.take(4));

let subject = new rxjs.Subject();
// let subject = new rxjs.BehaviorSubject(null); //We can also multicast using behaviorSubject or other specialized subject type
// let subject = new rxjs.ReplaySubject(2); //We can also multicast using behaviorSubject or other specialized subject type
// let subject = new rxjs.AsyncSubject(); //We can also multicast using behaviorSubject or other specialized subject type

subject.subscribe((val) => console.log('hola de observer 1', val));

setTimeout(() => {
    subject.subscribe((val) => console.log('hola de observer 2', val));
}, 2100);

int.subscribe(subject)

// ====== multicast observable using multicast operator

let source2 = rxjs.interval(1000).pipe(operators.take(4));
let subject2 = new rxjs.Subject();

let multicasted = source2.pipe(operators.multicast(subject2));

// These are, under the hood, subject2.subscribe({...})
multicasted.subscribe((val) => console.log('Hi from multicasted obs 1', val);

setTimeout(() => {
    multicasted.subscribe((val) => console.log('Hi from multicasted obs 2', val));
}, 2100);

// This is, under the hood, source2.subscribe(subject2). Connect means "subscribing the source observable with the subject as observer"
// connect returns a subscription
multicasted.connect();


// ======= multicast observable using multicast operator + refCount

let source3 = rxjs.interval(3000);
let subject3 = new rxjs.Subject();

let refCounted = source3.pipe(operators.multicast(subject3), operators.refCount());

let subscription1, subscription2;
 
// This calls `connect()`, because
// it is the first subscriber to `refCounted`
console.log('observerA subscribed');
subscription1 = refCounted.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
 
setTimeout(() => {
  console.log('observerB subscribed');
  subscription2 = refCounted.subscribe({
    next: (v) => console.log(`observerB: ${v}`)
  });
}, 600);
 
setTimeout(() => {
  console.log('observerA unsubscribed');
  subscription1.unsubscribe();
}, 1200);
 
// This is when the shared Observable execution will stop, because
// `refCounted` would have no more subscribers after this
setTimeout(() => {
  console.log('observerB unsubscribed');
  subscription2.unsubscribe();
}, 2000);

