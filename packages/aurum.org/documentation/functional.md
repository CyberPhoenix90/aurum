Components in aurum are just functions that return something Aurum can render, which means a string, number, bigint, promise, other components, JSX elements or an arbitrarily nested array of the previous items.

#### Simple functional component

```
function MyComponent() {
    return <div>Hello World</div>
}
```
Creating a component is as simple as that. No "hooks" attached.

This component can be used as follows:
```
<div>
    Greetings:
    <MyComponent></MyComponent>
</div>
```

#### Functional component with properties

If you want your component to accept properties you can just define an argument object with all the properties

```
function MyComponent(props) {
    return <div>Hello {props.name}</div>
}

<div>
    Greetings:
    <MyComponent name="World"></MyComponent>
</div>
```

#### Functional component child nodes

If you want to access the children of your component just pass a second argument for the child nodes

```
function MyComponent(props, children) {
    return <div>Hello {children}</div>
}

<div>
    Greetings:
    <MyComponent>World</MyComponent>
</div>
```
More info on that in [transclusion](#/getting_started/transclude)

#### Functional component api

If you want to hook into the life cycle of the component you can use the component api that is passed to your 
component as third argument

```
function MyComponent(props, children, api) {
    api.onAttach(() => console.log('I was just attached, my dom nodes if I have any are in the dom'))
    api.onDetach(() => console.log('I was just dettached, my dom nodes if I had any are gone'))

    return undefined;
}
```

This allows having a callback for when the DOM nodes are in place to for example use other libraries to interact with the rendered nodes
or have clean up callbacks after detach to free unmanaged resources. The api also provides a cancellation token that is cancelled when the component is detached.

#### Life cycle

The function is called a single time in the whole life cycle of the function. If you wish the DOM to change based on data changes just render data sources
More info on that in [DataSources](#/getting_started/datasource) and [ArrayDataSources](#/getting_started/arraydatasource)



That's really all you need to know about how to make a component. It's as simple as that.