\<Suspense> can simply be imported from aurum.
Aurum can already bind promises directly into the HTML as follows:

```
<div>{myPromise}</div>

```
which would render once the promise is resolved. However it will not display anything while the promise is pending. This is where suspense comes in

```
		<Suspense fallback={<div>Loading...</div>}>
			<Documentation></Documentation>
		</Suspense>

```

Documentation is an async component that will fetch data from the server and only return a promise. With suspense in fallback you can have text or HTML to render while the promise is pending