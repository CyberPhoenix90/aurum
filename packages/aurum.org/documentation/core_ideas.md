The core concepts in aurum is binding to observable data sources and never running render logic twice.

When you are writing HTML through JSX you can bind datasources straight into your HTML (including tag attributes)

```
import {DataSource, Aurum} from 'aurumjs'
const myDataSource = new DataSource('hello')

Aurum.attach(<div>{myDataSource}</div>, document.body);
```

Result:
```
 <div>hello</div>
```

The advantage of this system is that when the datasource updates the HTML is directly synchronized without any diffing, dirty checking or virtual dom overhead

```
myDataSource.update('world')
```

Result:
```
 <div>world</div>
```

This works for array data sources as well

```
import {ArrayDataSource, Aurum} from 'aurumjs'
const myList = new ArrayDataSource(['task 1','task 2','task 3'])

Aurum.attach(
  <ul>{myList.map((text) => <li>{text}</li>)}</ul>, 
  document.body
);
```

Result:
```
<ul>
  <li>task 1</li>
  <li>task 2</li>
  <li>task 3</li>
</ul>
```
And that too will synchronize with changes done to the array data source.
As a result in aurum, all variables that are shown to the user and are not static need to be wrapped in data sources. You can read all about it in the Data management section of the guide.

