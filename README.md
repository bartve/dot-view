## About

`dot-view` is an easy to use [Node.js](http://www.nodejs.org) view class wrapper around the fast [doT](https://www.npmjs.org/package/dot) templating engine.

[![Dependency Status](https://david-dm.org/bartve/dot-view.png)](https://david-dm.org/bartve/dot-view)

## Features

  * Supports layouts, partials and custom view helper functions
  * Implements caching of compiled template functions (enabled by default)
  * Basic [Express](http://expressjs.com/) integration with `__express()` or `display()`

## Installation

[![NPM](https://nodei.co/npm/dot-view.png?downloads=true)](https://nodei.co/npm/dot-view/)

## Usage

### Quick start
Here are some basic usage examples that connect with the public API. Error handling has been left out for demonstrational purposes.

#### Init

```javascript
var View = require('dot-view').View;
```

#### Simple template

```javascript
var html = new View('/tpl/path', 'template.dot', {text: 'Hello!'}).render();
```

Or

```javascript
var html = new View('/tpl/path', 'template.dot').assign({text: 'Hello!'}).render();
```

Re-use the view object for rendering multiple templates in the same path
```javascript
var view = new View('/tpl/path');
var html1 = view.assign({greet: 'Hello!'}).render('template.dot');
var html2 = view.assign({greet: 'Hello again!'}).render('another_template.dot');
```

#### Layout
Add a layout to the template and assign variables to the layout. In `layout.dot` the content of `template.dot` is included with `{{#def._content}}`.
```javascript
var view = new View('/tpl/path', 'template.dot', {greet: 'Hello!'});
view.layout(new View('/layouts', 'layout.dot', {title: 'My title'}));
var html = view.render();
```

`layout.dot` could look like:

```html
<!DOCTYPE html>
<html>
	<head>
		<title>{{=it.title}}</title>
	</head>
	<body>
		<div>{{#def._content}}</div>
	</body>
</html>
```

#### Partials

In doT partials are included with `#def`. To add literal partials or partials from other template files simply:
```javascript
var view = new View('/tpl/path', 'template.dot', {greet: 'Hello!'});
view.define({
	// From file
	file_partial: fs.readFileSync('/partials/partial.dot', {encoding: 'utf8'}),
	// Literal string
	string_partial: '<div>{{=it.greet}} I\'m a partial.</div>'
});
var html = view.render();
```

Where `template.dot` could look like:

```html
<!-- Output the file partial -->
<div>{{#def.file_partial}}</div>
<!-- Output the literal string partial -->
<div>{{#def.string_partial}}</div>
```

See the doT [advanced examples](https://github.com/olado/doT/blob/master/examples/advancedsnippet.txt) for more information on how to use partials in doT directly.

#### View helpers

`dot-view` comes with two default view helpers `truncate()` (truncate a string) and `currency()` (format currency). Take a look at `View.prototype.helpers` for their parameters. View helpers are located in the `helpers` variable inside a template.

```html
<!-- Truncate a string (it.someString) to 60 characters -->
<div>{{!helpers.truncate(it.someString, 60)}}</div>
```

You can add your own helper functions by simply adding them to the `helpers` property of your `View` instance.

```javascript
var view = new View('/tpl/path', 'template.dot', {greet: 'hello'});
view.helpers.greet = function(greet){ return 'Well '+greet+' there!'; };
var html = view.render();
```

In your `template.dot`

```html
<div>{{!helpers.greet(it.greet)}}</div>
```

Will output

```html
<div>Well hello there!</div>
```

### Express

You can easily integrate `dot-view` in your [Express](http://expressjs.com/) app in two ways.

#### __express()
`dot-view` exposes an `__express()` function that can be [registered](http://expressjs.com/api.html#app.engine) as the template engine for Express.
```javascript
// Tell Express to use the dot-view engine for .dot templates
app.engine('dot', require('dot-view').__express);

app.get('/', function(req, res){
	res.render('/full/path/to/template.dot', {greet: 'Hello!'}, function(err, html){
		if(!err){ res.send(html); }
	});
});
```

Passing a layout, partial and helper
```javascript
var options = {
	layout: new View('/layouts', 'layout.dot', {title: 'My title'}),
	defines: { partial: '<div>{{=it.greet}} I\'m a partial.</div>'},
	helpers: { greet: function(greet){ return 'Well '+greet+' there!'; } },
	greet: 'hello'
};
res.render('/full/path/to/template.dot', options, function(err, html){
	if(!err){ res.send(html); }
});
```

#### display()
You can also bypass Express's template facilities completely and simply pass Express's `res` to `view.display()` along with an optional template file and optional HTTP status code.

```javascript
app.get('/', function(req, res){
	var view = new View('/tpl/path', 'template.dot', {greet: 'Hello!'});
	view.display(res);
});
```

## Reserved template variable names
The following object keys have a special meaning in `dot-view` and should not be used for passing normal values or partials to templates:
  * A partial with the name `_content` is used by the layout view to include the content of the template.

When passing variables in the `options` parameter of `res.render()` when using `__express()`:
  * `layout` is reserved for passing the layout template or `View` instance
  * `defines` is reserved for passing partials
  * `helpers` is reserved for passing additional view helpers

## Resources

  * [doT manual](http://olado.github.io/doT/)

## License

MIT