To use Aurum you will need babel to transpile jsx files into js
To configure babel set your .babelrc file to look like the following:

```
{
  "presets": [
    "@babel/preset-env",
  ],
  "plugins": [
    [
      "@babel/transform-react-jsx",
      {
        "pragma": "Aurum.factory"
      }
    ]
  ]
}
```

Aurum is written in typescript and provides declaration files that can be used in javascript to get good autocomplete.