## About

`dot-view` is an easy to use [Node.js](http://www.nodejs.org) view class wrapper around the fast [doT](https://www.npmjs.org/package/dot) templating engine.

[![Dependency Status](https://david-dm.org/bartve/dot-view.png)](https://david-dm.org/bartve/dot-view)

## Features

  * Supports layouts, partials and view helper functions
  * Supports caching of compiled template functions (enabled by default)
  * Incluses `__express()` function for basic [Express](http://expressjs.com/) integration

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
Add a layout to the template and assign variables to the layout. In `layout.dot` the content of `tempplate.dot` is rendered with `{{=it.content}}`.
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
		<div>{{=it.content}}</div>
	</body>
</html>
```

#### Partials

In doT partials are called `defines`. To add literal partials or partials from other `.dot` template files simply:
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

#### View helpers

`dot-view` comes with two default view helpers `truncate()` (truncate a string) and `currency()` (format currency). Take a look at `View.prototype.helpers` for their parameters. View helpers are located in the `helpers` variable inside a template.

```html
<!-- Truncate a string (it.someString) to 60 characters -->
<div>{{!helpers.truncate(it.someString, 60)}}</div>
```

You can add your own helper functions by simply adding them to the `helpers` property of your `View` instance.

```javascript
var view = new View('/tpl/path', 'template.dot', {greet: 'hello'});
view.helpers.greet = function(greet){ return 'Well '+greet+' there!' };
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

You can easily integrate `dot-view` in your `Express` app in two ways.

#### __express()
`dot-view` implements a `__express()` function that can be used by `Express`'s view renderer.
```javascript
app.engine('dot', require('dot-view').__express);

app.get('/', function(req, res){
	res.render('/full/path/to/template.dot', {greet: 'Hello!'}, function(err, html){
		if(!err){ res.send(html); }
	});
});
```

#### display()
You can also bypass `Express`'s template facilities completely and simply pass `Express`'s `res` to `view.display()` along with an optional the template file and optional HTTP status code.

```javascript
app.get('/', function(req, res){
	var view = new View('/tpl/path', 'template.dot', {greet: 'hello'});
	view.display(res);
});
```

## Reserved template varable names
The following object keys vave a special meaning in `dot-view` and should not be used for passing normal values to templates:
  * `content` is used by the layout view to parse the content of the template in

## Resources

  * [doT manual](http://olado.github.io/doT/)

## License

MIT