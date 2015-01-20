'use strict';

/** @module dot-view */

var doT = require('dot'),
	fs = require('fs'),
	path = require('path');

/**
 * Parse absolute and relative path strings to a full path
 * @param {string} filePath
 * @param {string} currentPath
 * @returns {string}
 */

var parsePath = function(filePath, currentPath){
	if(/^(?:\/|[a-zA-Z]:(?:\/|\\))/.test(filePath)){ // Is the path absolute?
		filePath = path.normalize(filePath);
	}else{ // Relative paths need to be resolved first
		filePath = path.resolve(currentPath, filePath);
	}
	return filePath;
};

/**
 * Expose the View constructor
 * @type {View}
 */

exports.View = View;

/**
 * Expose the compiled template function cache
 * @type {object}
 */

exports.cache = {};

/**
 * Object constructor. For quick use, the most important properties can be set in the constructor.
 * @constructor
 * @param {string} [tplPath] - The path of the template file
 * @param {string} [tplFile] - The filename of the template file
 * @param {object} [data={}] - The template data
 * @return {View}
 */

function View(tplPath, tplFile, data){
	this.data = data||{};
	this.defines = {};
	this.enabled = true;
	// Default settings
	this.settings = doT.templateSettings;
	this.settings.varname = 'it,helpers'; // Add the helpers as a second data param for the parser
	this.settings.cache = true; // Use memory cache for compiled template functions
	this.settings.layout = /\{\{##\s*(?:def\.)?_layout\s*(?:\:|=)\s*([\s\S]+?)\s*#\}\}/; // Layout regex
	if(tplPath){ this.path = tplPath; }
	if(tplFile){
		this.file = tplFile;
		this.layout();
	}
}

/**
 * Container for view helper functions. Usage: {{=it.helpers.functionName(it.var)}}
 * @type {object}
 */

View.prototype.helpers = {
	/**
	 * Truncate a string. Usage: {{=helpers.truncate(str)}}
	 * @param {string} str - The input string
	 * @param {number} [len=50] - The optional maximum string length (default = 50 characters)
	 * @param {string} [replace=...] - Optional replace string (defaults to "...")
	 * @returns {string}
	 */ 
	truncate: function(str, len, replace){
		len||(len = 50); 
		replace||(replace = '...');
		return (str.length > len) ? str.trim().substr(0,len).trim()+replace : str;
	},
	
	/**
	 * Format money. Usage: {{=helpers.money(3.5, 2, ',', '.')}}
	 * @param {number} nr - The quantity
	 * @param {number} [dec=2] - Optional decimal positions (defaults to 2)
	 * @param {string} [decPoint=.] - Optional decimal point character (defaults to ".")
	 * @param {string} [thousandSep=,] - Optional thousand separator character (defaults to ",")
	 * @returns {string}
	 */
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
 * @param {object} [data={}] - The template data
 * @returns {View}
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
 * @param {boolean} [enabled] - Optional boolean (or some truthy/falsy value) whether the view is enabled
 * @returns {View}
 */

View.prototype.toggle = function(enabled){
	this.enabled = (enabled === undefined) ? !this.enabled : (enabled ? true : false);
	return this;
};

/**
 * Get or set the current layout View.
 * This function will also try to get the layout definition from the current template file.
 * @param {View} [layout] - An optional layout View instance to set
 * @return {View|undefined}
 */

View.prototype.layout = function(layout){
	if(layout instanceof View){ 
		this._layoutView = layout;
	// Check the current template file for layout tags when it hasn't been checked before
	}else if(!this._layoutView && this.file && (typeof this._layoutFromTemplate === 'undefined')){
		var layoutPath = fs.readFileSync(this.path+'/'+this.file, {encoding: 'utf8'}).match(this.settings.layout);
		if(layoutPath){
			layoutPath = parsePath(layoutPath[1], this.path);
			this._layoutView = new View(path.dirname(layoutPath), path.basename(layoutPath));
			this._layoutFromTemplate = true;
		}else{
			this._layoutFromTemplate = false;
		}
	}
	return this._layoutView;
};

/**
 * Define compile time items like sub-templates. Usage in template: {{#def.foo}}
 * @param {object} defines - Defines object like {"foo":"<div>{{=it.bar}} foobar?</div>"}
 * @returns {View}
 */

View.prototype.define = function(defines){
	for(var prop in defines){
		this.defines[prop] = defines[prop];
	}
	return this;
};

/**
 * Render the given template file to a string.
 * @param {string} [file] - The template file to render (optional when the file has already been set)
 * @returns {string}
 */

View.prototype.render = function(file){
	if(file){ this.file = file; }
	var path = this.path+'/'+this.file, html, tplFunction, self = this;
	if(!(this.settings.cache) || !exports.cache[path]){
		// Add the def.include() function when not set
		if(typeof this.defines.include !== 'function'){
			this.defines.include = function(filePath){
				return fs.readFileSync(parsePath(filePath, self.path), {encoding: 'utf8'});
			};
		}
		tplFunction = doT.template(fs.readFileSync(path, {encoding: 'utf8'}), this.settings, this.defines);
		if(this.settings.cache){ // Add the compiled template function to the function cache
			exports.cache[path] = tplFunction;
		}
	}else{
		tplFunction = exports.cache[path];
	}
	html = tplFunction(this.data, this.helpers);
	if(this.layout()){ // Insert the template HTML into the layout 
		this._layoutView.define({_content: html});
		html = this._layoutView.render();
	}
	return html;
};

/**
 * Combine view rendering and the sending of the response to the browser.
 * @param {ServerResponse} res - An Express server response object
 * @param {string} [file] - The template file to render
 * @param {number} [status=200] - The HTTP status
 */

View.prototype.display = function(res, file, status){
	res.status((status||200)).send(this.render(file));
};

/**
 * Basic Express support http://expressjs.com/api.html#app.engine
 * @param {string} tplPath - Full path to the template file incl. file name.
 * @param {object} [options] - Optional template data/options
 * @param {function} [callback] - Optional callback function to be executed
 * @returns {string|function}
 */

exports.__express = function(tplPath, options, callback){
	var view = new View(path.dirname(tplPath), path.basename(tplPath));
	
	if((arguments.length === 2) && (typeof options === 'function')){
		callback = options; options = null;
	}else if(typeof options === 'object'){
		var data = {};
		for(var key in options){
			// Add the layout view when present
			if((key === 'layout')){
				var layout = options[key];
				if(!(layout instanceof View)){ // Layout is a string
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
			// Enable/disable template function caching
			else if(key === 'cache'){
				view.settings.cache = options[key];
			}
			// Normal template variables
			else{
				data[key] = options[key];
			}
		}
		view.assign(data);
	}
	
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