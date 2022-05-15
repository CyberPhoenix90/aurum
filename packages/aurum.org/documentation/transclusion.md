Tranclusion is where you take child elements given to your functional component and you use them in a way usually rendering them in a specific spot. Transclusion is a great tool to make semantic HTML and is used in such cases like the builtin [Switch](#/getting_started/switches), [AurumRouter](#/getting_started/router) and [Suspense](#/getting_started/suspense) components

#### Basics of transclusion

```
function MyComponent(props, children) {
    return <div>{children}</div>
}
```

This takes the children given to MyComponent and renders them inside a div. This will work nicely no matter what is passed to MyComponent even null

#### Simple multi-transclusion

```
function Listify(props, children) {
    // If no children are received, default to an empty array
    children = children ?? [];

    return <ul>{children.map(c => <li>{c}</li>)}</ul>
}
```

In this example listify will wrap all children individually in a \<li> within an \<ul>. This requires to validate that children are passed at all.

#### Use transclusion to extend what aurum can render

Using transclusion you can give aurum support for new types of renderables

```
function FunctionRenderer(props, children) {
    return children.map((child) => typeof child === 'function'? child.toString() : child);
}

<div>
    <FunctionRenderer>
    {function() {
        console.log('hello world')
    }}
    </FunctionRenderer>
</div>

```
With this you can now render functions directly in JSX. Using data sources in your component you could make new types of dynamically updating objects that you can just render

#### Understanding prerender

##### 1. Lazy loaded JSX elements
In Aurum all JSX elements are rendered lazily. This means that in your functional components the children that come from a JSX notation such as \<div></div> or \<MyComponent></MyComponent> are not actually rendered yet. They are just a model containing information needed to render it.
This means it is possible to create custom components that only selectively render children but it also means that if you want to access the real rendered content inside the component you have to call api.prerender to render it on the spot.

##### 2. Using api.prerender
prerender is a function provided by the api of your component. You can pass it children and it will render them synchronously on the spot. It is important to understand the consequences of that. If you render components you will execute their logic which could lead to side effects. However since your component is not guaranteed to end up using the prerendered content you have to pass a life cycle object to prerender. The life cycle object is obtained be calling the function createLifeCycle that you can import from aurum. There are 2 ways to use a life cycle object. You can use api.synchronizeLifeCycle(lifeCycleObject). Use this if the prerendered content is going to be attached and detached together with the component that did the prerendereing. This means the object is unconditionally rendered immediately in the component. If there are conditions or the object is rendered with a delay you have to instead call lifeCycleObject.onAttach after the object did get rendered and lifeCycleObject.onDetach if you decided to not render it at all or after it was removed after being rendered

##### 3. Use cases
Reasons you might want to render the elements on the spot could be for example you want to allow new return types in components and need to render the component on the spot to handle the return value.

Note that when using the {someValue} notation (as in \<div>{someValue}\</div>). The value does not render lazily, it gets passed as is to the component in the children array and can be used to avoid needing prerender.

#### Advanced transclusion
Example of using all the above features to implement suspense:
```
export function Suspense(props, children, api) {
	const data = new DataSource(props?.fallback);

	const lc = createLifeCycle();

	api.onDetach(() => {
		lc.onDetach();
	});

	Promise.all(api.prerender(children, lc)).then(
		(res) => {
			if (!api.cancellationToken.isCanceled) {
				data.update(res);
				lc.onAttach();
			}
		},
		(e) => {
			lc.onDetach();
			return Promise.reject(e);
		}
	);

	return data;
}
```