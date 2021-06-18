Datasources are a wrapper for your changable primitives that you want to bind to DOM. It is possible to wrap objects or arrays in a datasource but it is not recomended as Aurum does not do dirty checking changes within the object will not be detected and changes of the reference will assume everything changed.
If you wish to wrap an array or an object see [Array data source](#/getting_started/arraydatasource) and [Object data source](#/getting_started/objectdatasource) instead

Usage example:
```
const data = new DataSource('hello')
// Bind data to this div. It the markup will automatically be updated whenever data changes
Aurum.attach(<div>{data}</div>, document.body);

setTimeout(() => {
    data.update('hello world')
}, 1000)
```
This would render \<div>hello\</div> and after a second it would switch to \<div>hello world\</div>

Data sources also serve as data streams. This can help map data from the backend to the front end or from events to the form you like to have

Example:
```
const inputText = new DataSource('')
// Bind data to this div. It the markup will automatically be updated whenever data changes
Aurum.attach(<div>
<input inputValueSource={inputText}></input>
<div>Characters: {inputText.transform(dsMap(text => text.length))}</div>
</div>, document.body);
```

This would render an input field with an empty starting text and a character count that starts at 0 and each time the input value changes it will refresh the character count with the length of the text, effectively creating a character counter just like that.
Data sources have more methods like filter, reduce, etc. They allow you to manage changes like a stream.

It is also possible to put aurum elements into a datasource to completely change sections of your page with an update call. Remmeber that this means that part of the page is rebuilt on each change.

Example:
```
const tabContent = new DataSource(<span>hello Tab 1</span>);

Aurum.attach(<div>
	<button onClick={() => tabContent.update(<span>hello Tab 1</span>)}>Tab 1</button>
	<button onClick={() => tabContent.update(<span>hello Tab 2</span>)}>Tab 2</button>
	<button onClick={() => tabContent.update(<span>hello Tab 3</span>)}>Tab 3</button>
	{tabContent}
	</div>, document.body)

```
This will reder the tab that is currently active by putting it in the tabContent data source. Using map you can also turn primitive values into Aurum elements through the mapping function.