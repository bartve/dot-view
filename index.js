
var doT = require('dot'),
	fs = require('fs'),
	path = require('path'),
	_cache = {}; // Memory cache for compiled template functions

/**
 * Light weight view class based on doT templating engine.
 * For quick use, the most important properties can be set in the constructor.
 * @constructor
 * @param {String} [tplPath] - The path of the template file
 * @param {String} [tplFile] - The filename of the template file
 * @param {Object} [data]	 - The template data
 * @return {View}
 */

function View(tplPath, tplFile, data){
	tplPath&&(this.path = tplPath);
	tplFile&&(this.file = tplFile);
	this.data = data||{};
	this.defines = {}; // doT defines objects
	this.enabled = true;
	/** Default settings */
	this.settings = doT.templateSettings;
	this.settings.varname = 'it,helpers'; // Add the helpers as a second data param for the parser
	this.settings.cache = true; // Use memory cache for compiled templates
}

/**
 * Container for view helper functions. Usage: {{=it.helpers.functionName(it.var)}}
 */

View.prototype.helpers = {
	// Truncate a string. Usage: {{=helpers.truncate(str)}}
	truncate: function(str, len, replace){
		len||(len = 50); 
		replace||(replace = '...');
		return (str.length > len) ? str.trim().substr(0,len).trim()+replace : str;
	},
	// Format money. Usage: {{=helpers.money(3.5, 2, ',', '.')}}
	money: function(nr, dec, decPoint, thousandSep){
		decPoint||(decPoint = '.');
		thousandSep||(thousandSep = ',');
		dec = isNaN(dec = Math.abs(dec)) ? 2 : dec;
		var sign = (nr < 0) ? '-' : '',
			i = parseInt(nr = Math.abs(+nr || 0).toFixed(dec), 10) + '',
			j = (j = i.length) > 3 ? j % 3 : 0;
		return sign + (j ? i.substr(0, j) + thousandSep : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousandSep) + (dec ? decPoint + Math.abs(nr - i).toFixed(dec).slice(2) : '');
	}
};

/**
 * Assign template data to the view.
 * @param {Object} [data={}] - The template data
 * @return {View}
 */

View.prototype.assign = function(data){
	data = data||{};
	for(var key in data){
		this.data[key] = data[key];
	}
	return this;
};

/**
 * Toggle the enabled state of the current view.
 * @param {Boolean} [enabled] - Optional boolean (or some truthy/falsy value) whether the view is enabled
 * @return {View}
 */

View.prototype.toggle = function(enabled){
	this.enabled = (enabled === undefined) ? !this.enabled : (enabled ? true : false);
	return this;
};

/**
 * Get or set the current layout View.
 * @param {View} layout - The layout View instance
 * @return {View}
 */

View.prototype.layout = function(layout){
	(layout instanceof View)&&(this.layoutView = layout);
	return this.layoutView;
};

/**
 * Define compile time items like sub-templates. Usage in template: {{#def.foo}}
 * @param {Object} defines - Defines object like {"foo":"<div>{{=it.bar}} foobar?</div>"}
 * @return {View}
 */

View.prototype.define = function(defines){
	for(var prop in defines){
		this.defines[prop] = defines[prop];
	}
	return this;
};

/**
 * Clear the compiled templates cache.
 * @return {View}
 */

View.prototype.clearCache = function(){
	_cache = {};
	return this;
};

/**
 * Render the given template file to a string.
 * @param {String} [file] - The template file to render (optional when the file has already been set)
 * @return {String}
 */

View.prototype.render = function(file){
	var path = this.path+'/'+(file||this.file), html, tplFunction;
	if(this.settings.cache){ // Use caching? Get from cache and set if not present
		if(!_cache[path]){
			var tplFile = fs.readFileSync(path); 
			_cache[path] = doT.template(tplFile, this.settings, this.defines);
		}
		tplFunction = _cache[path];
	}else{ // No caching, just compile.
		var tplFile = fs.readFileSync(path);
		tplFunction = doT.template(tplFile, this.settings, this.defines);
	}
	html = tplFunction(this.data, this.helpers); // Render html by calling the compiled template function
	if(this.layoutView instanceof View){
		this.layoutView.assign({content: html});
		html = this.layoutView.render();
	}
	return html;
};

/**
 * Combine view rendering and the sending of the response to the browser.
 * @param {ServerResponse} res - An Express server response object
 * @param {String} [file] - The template file to render
 * @param {Number} [status=200] - The HTTP status
 */

View.prototype.display = function(res, file, status){
	res.status((status||200)).send(this.render(file));
};

/**
 * Expose the View constructor
 */

module.exports.View = View;

/**
 * Basic Express support http://expressjs.com/api.html#app.engine
 * @param {String} tplPath - Full path to the template file incl. file name.
 * @param {Object} [options] - Template data/options
 * @param {Function} [callback] - Callback function to be executed (optional)
 * @return {String|Function}
 */

module.exports.__express = function(tplPath, options, callback){
	if(typeof options === 'function'){
		callback = options, options = null;
	}
	!options&&(options = {});
	var view = new View(path.dirname(tplPath), path.basename(tplPath)),
		data = {};
	
	for(var key in options){
		// Add the layout view when present
		if((key === 'layout')){
			var layout = options[key];
			if(!(layout instanceof View)){ // layout is a string
				layout = new View(path.dirname(layout), path.basename(layout));
			}
			view.layout(layout);
		}
		// Add defines when present
		else if((key === 'defines') && (typeof options[key] === 'object')){
			view.define(options[key]);
		}
		// Add view helper functions when present
		else if((key === 'helpers') && (typeof options[key] === 'object')){
			for(var helper in options[key]){
				view.helpers[helper] = options[key][helper];
			}
		}
		// Normal template variables
		else{
			data[key] = options[key];
		}
	}
	view.assign(data);
	
	if(typeof callback === 'function'){
		var html;
		try{
			html = view.render();
		}catch(err){
			return callback(err);
		}
		return callback(null, html);
	}else{
		return view.render();
	}
};