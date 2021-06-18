Object datasources are wrappers for your objects with methods to update the keys in an observable way. Unlike data source and array data source you cannot bind object data sources directly to DOM. You can however use methods like pick to create a data stream from an object data stream which then can be bound.

Example:
```
const model = new ObjectDataSource({ text: 'hello'})
// Bind data to this div. It the markup will automatically be updated whenever data changes

Aurum.attach(<div>
<div>Greeting: {model.pick('text')}</div>
</div>, document.body);

setTimeout(() => {
    //simulating new model from the backend:
    const newModel = {text:'hello world'};
    model.assign(newModel)
}, 1000)
```

This will create a div that says Greeting: hello and the hello is updated whenever the key text is changed of model