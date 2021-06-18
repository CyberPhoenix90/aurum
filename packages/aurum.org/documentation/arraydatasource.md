Array data sources are wrappers for your changable arrays that you want to render to DOM.
Array data sources are useful whenever you want to render a list of items based on data that can change.

Example:
```
const items = new ArrayDataSource(['item one', 'item two'])

Aurum.attach(<div>{items.map(i => <p>{i}</p>)}
<button onClick={() => items.push('More')}>Add more</button>
</div>, document.body)
```

This would render 2 paragraphs with item one and item two and a button that if clicked will append a new paragraph each time that says "More"

Array data sources have a lot of regular array methods to change the data and all changes will be applied to the DOM directly. It is very fast because it does not rebuild the DOM but only makes the smallest amount of changes needed to sync the DOM with the array.

Array data sources have another major feautre: Array views. Those are modified views of the original data without changing the data in question.

Example:
```
	const inputSource = new DataSource(props.initialFilter ?? '');
	const filteredItems = new ArrayDataSource(['lorem','ipsum','dolor','sit','amet]).filter(() => true);

	inputSource.listen((value) => {
		filteredItems.updateFilter((e) => e.toLowerCase().includes(value.toLowerCase())));
	});

Aurum.attach(<div>
    <input maxLength="20" placeholder="Search..." inputValueSource={inputSource}></input>
    {filteredItems}
</div>, document.body)

```

This renders a list of items that you can search and filter through. As you type the items change based on what is matched by the text. If you keep a reference to the original array data source from before filtering you can modify the list and if the new items pass the current filter they are automatically added to the DOM.

There are other methods for array views like map and sort which work on the same idea: The view is generated from the original data and is kept up to date at all times