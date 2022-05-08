To use aurum with typescript all you have to do is go to your tsconfig and set the jsxFactory option as follows:

```
    "compilerOptions": {
        "jsxFactory": "Aurum.factory"
    }
```

Aurum is fully written in typescript and ships with declaration files for a comfortable auto complete and type checking experience