Switch comes with 3 parts:

\<Switch></Switch>

\<SwitchCase></SwitchCase>

\<DefaultSwitchCase></DefaultSwitchCase>

You can simply import those from aurum and their purpose is to make it easier to write branching HTML code without having to manually create it yourself each time.

Simple usage example:

```
// articles here would be an array data source of all your articles

<div>
    <Switch state={articles.length}>
        <SwitchCase when={0}>
            No articles found.
        </SwitchCase>
        <DefaultSwitchCase>
            {articles.map(a => <Article model={a}></Article>)}
        </DefaultSwitchCase>
    </Switch>
</div>

```
This would render all articles when there is at least 1 and show a message when there are none

This already covers the whole API of switch: state is a data source and in each case you set a "when" with a specific value to render that branch in case the datasource matches that value
You can optionally have a default case that will be rendered for every other value