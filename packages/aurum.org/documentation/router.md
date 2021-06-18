AurumRouter comes with 3 parts:

\<AurumRouter></AurumRouter>

\<Route></Route>

\<DefaultRoute></DefaultRoute>

You can simply import those from aurum and their purpose is to make single page applications where you render a different page based on your URL. AurumRouter works with the hash part of the URL. This may not be what you are looking for. There are 2 different ways to do URLs in single page applications: After the hash or with more natural looking urls without hash. AurumRouter only works for hash based routes. I will not go into detail here about the differences and advantages and disadvantages of both.

Simple usage example from the source code of this website:
```
<AurumRouter>
	<Route href="/documentation">
		<DocumentationPage></DocumentationPage>
	</Route>
	<Route href="/getting_started">
		<GettingStarted></GettingStarted>>
	</Route>
	<DefaultRoute>
		<div>
			<MainTitle></MainTitle>
			<Advantages></Advantages>
			<div class="container">
				<Examples></Examples>
			</div>
		</div>
	</DefaultRoute>
</AurumRouter>

```

The router will only check the part of the URL after the # sign, you can route inside the page with anchor tags like: \<a href="#/myPath"></a>
The router will also match a page if the url does not end there. 

Meaning #/getting_started/router will render the page \<Route href="/documentation"></Route>

This makes it possible to use the router in a nested way to render sub pages within pages as is done in this very documentation where the sidebar is part of /documentation but the page you are reading is part of /documentation/router