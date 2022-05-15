You might be wondering what's the point of Aurum when there are many great choices for DOM rendering already. 
Aurum tackles the 2 biggest pain points in modern UI development
1. Syncronization between view and model
2. Slow performance caused due to existing libraries performing a lot of unnecessary work just to decide what to rerender if anything

### 1. State management made easy
Most dom rendering libraries shy away from using proprietary objects for state management. They try to accept whatever anyone throws at the library and somehow make it work. Aurum takes the oposite approach. You have to use Aurum's internal state management objects if you want to synchronize the view to model changes. This ensures that Aurum has full understanding of your state objects and what changes where and how. The state management objects of Aurum (DataSource, ArrayDataSource, ObjectDataSource) come packed with features that help you adapt data from the backend through your business logic all the way into your view in a way where all changes at any level are observable and trigger automatic rerenders whenever something that is bound to the view changes.

### 2. Linear performance curve in the face of complexity
Unlike solutions based on the virtual DOM, a change at the root of a component does not trigger a whole sub tree of components to be evaluated for rerendering.
And unlike solutions based on dirty checking the complexity of your model doesn't affect performance and there is no guesswork involved on whether something will rerender or not. There's no scope applies, no change detectors, no restrictive proxy based checks not even memoize.

In React for example you have to use memoization or shouldComponentUpdate and manually decide a strategy to avoid rerendering (or brute force it by hashing the whole model each time and wasting performance) and failing to do so penalizes you with a big performance hit on large DOM trees.
You can view Aurum's rendering strategy as react with a perfect shouldComponentUpdate that you don't even need to write yourself, because Aurum always knows what changed and where it changed there is no diffing, no guesswork, no dirty checking, the model is always bound directly to the area of the DOM it is responsible for.

### Bonus: Stateful functional components without hooks!
In Aurum you are expected to write functional components but there are no hooks. This is intentional as hooks are unecessary in Aurum. During the whole lifetime of a component the body of the function is only ever run once. No need to worry about running logic twice, no need to worry about the order of hooks or other arbitrary pitfalls. All updating of rendered content is handled by data sources, all interaction is handled by event callbacks. Stateful components in aurum is just functions with local variables