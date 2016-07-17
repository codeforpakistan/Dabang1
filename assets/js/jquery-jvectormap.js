/**
 * jVectorMap version 2.0.4
 *
 * Copyright 2011-2014, Kirill Lebedev
 *
 */

(function( $ ){
  var apiParams = {
        set: {
          colors: 1,
          values: 1,
          backgroundColor: 1,
          scaleColors: 1,
          normalizeFunction: 1,
          focus: 1
        },
        get: {
          selectedRegions: 1,
          selectedMarkers: 1,
          mapObject: 1,
          regionName: 1
        }
      };

  $.fn.vectorMap = function(options) {
    var map,
        methodName,
        map = this.children('.jvectormap-container').data('mapObject');

    if (options === 'addMap') {
      jvm.Map.maps[arguments[1]] = arguments[2];
    } else if ((options === 'set' || options === 'get') && apiParams[options][arguments[1]]) {
      methodName = arguments[1].charAt(0).toUpperCase()+arguments[1].substr(1);
      return map[options+methodName].apply(map, Array.prototype.slice.call(arguments, 2));
    } else {
      options = options || {};
      options.container = this;
      map = new jvm.Map(options);
    }

    return this;
  };
})( jQuery );
/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.9
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.9',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        },

        getLineHeight: function(elem) {
            return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));/**
 * @namespace jvm Holds core methods and classes used by jVectorMap.
 */
var jvm = {

  /**
   * Inherits child's prototype from the parent's one.
   * @param {Function} child
   * @param {Function} parent
   */
  inherits: function(child, parent) {
    function temp() {}
    temp.prototype = parent.prototype;
    child.prototype = new temp();
    child.prototype.constructor = child;
    child.parentClass = parent;
  },

  /**
   * Mixes in methods from the source constructor to the target one.
   * @param {Function} target
   * @param {Function} source
   */
  mixin: function(target, source){
    var prop;

    for (prop in source.prototype) {
      if (source.prototype.hasOwnProperty(prop)) {
        target.prototype[prop] = source.prototype[prop];
      }
    }
  },

  min: function(values){
    var min = Number.MAX_VALUE,
        i;

    if (values instanceof Array) {
      for (i = 0; i < values.length; i++) {
        if (values[i] < min) {
          min = values[i];
        }
      }
    } else {
      for (i in values) {
        if (values[i] < min) {
          min = values[i];
        }
      }
    }
    return min;
  },

  max: function(values){
    var max = Number.MIN_VALUE,
        i;

    if (values instanceof Array) {
      for (i = 0; i < values.length; i++) {
        if (values[i] > max) {
          max = values[i];
        }
      }
    } else {
      for (i in values) {
        if (values[i] > max) {
          max = values[i];
        }
      }
    }
    return max;
  },

  keys: function(object){
    var keys = [],
        key;

    for (key in object) {
      keys.push(key);
    }
    return keys;
  },

  values: function(object){
    var values = [],
        key,
        i;

    for (i = 0; i < arguments.length; i++) {
      object = arguments[i];
      for (key in object) {
        values.push(object[key]);
      }
    }
    return values;
  },

  whenImageLoaded: function(url){
    var deferred = new jvm.$.Deferred(),
        img = jvm.$('<img/>');

    img.error(function(){
      deferred.reject();
    }).load(function(){
      deferred.resolve(img);
    });
    img.attr('src', url);

    return deferred;
  },

  isImageUrl: function(s){
    return /\.\w{3,4}$/.test(s);
  }
};

jvm.$ = jQuery;

/**
 * indexOf polyfill for IE < 9
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
 */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement, fromIndex) {

    var k;

    // 1. Let O be the result of calling ToObject passing
    //    the this value as the argument.
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }

    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get
    //    internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If len is 0, return -1.
    if (len === 0) {
      return -1;
    }

    // 5. If argument fromIndex was passed let n be
    //    ToInteger(fromIndex); else let n be 0.
    var n = +fromIndex || 0;

    if (Math.abs(n) === Infinity) {
      n = 0;
    }

    // 6. If n >= len, return -1.
    if (n >= len) {
      return -1;
    }

    // 7. If n >= 0, then Let k be n.
    // 8. Else, n<0, Let k be len - abs(n).
    //    If k is less than 0, then let k be 0.
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    // 9. Repeat, while k < len
    while (k < len) {
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the
      //    HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      //    i.  Let elementK be the result of calling the Get
      //        internal method of O with the argument ToString(k).
      //   ii.  Let same be the result of applying the
      //        Strict Equality Comparison Algorithm to
      //        searchElement and elementK.
      //  iii.  If same is true, return k.
      if (k in O && O[k] === searchElement) {
        return k;
      }
      k++;
    }
    return -1;
  };
}/**
 * Basic wrapper for DOM element.
 * @constructor
 * @param {String} name Tag name of the element
 * @param {Object} config Set of parameters to initialize element with
 */
jvm.AbstractElement = function(name, config){
  /**
   * Underlying DOM element
   * @type {DOMElement}
   * @private
   */
  this.node = this.createElement(name);

  /**
   * Name of underlying element
   * @type {String}
   * @private
   */
  this.name = name;

  /**
   * Internal store of attributes
   * @type {Object}
   * @private
   */
  this.properties = {};

  if (config) {
    this.set(config);
  }
};

/**
 * Set attribute of the underlying DOM element.
 * @param {String} name Name of attribute
 * @param {Number|String} config Set of parameters to initialize element with
 */
jvm.AbstractElement.prototype.set = function(property, value){
  var key;

  if (typeof property === 'object') {
    for (key in property) {
      this.properties[key] = property[key];
      this.applyAttr(key, property[key]);
    }
  } else {
    this.properties[property] = value;
    this.applyAttr(property, value);
  }
};

/**
 * Returns value of attribute.
 * @param {String} name Name of attribute
 */
jvm.AbstractElement.prototype.get = function(property){
  return this.properties[property];
};

/**
 * Applies attribute value to the underlying DOM element.
 * @param {String} name Name of attribute
 * @param {Number|String} config Value of attribute to apply
 * @private
 */
jvm.AbstractElement.prototype.applyAttr = function(property, value){
  this.node.setAttribute(property, value);
};

jvm.AbstractElement.prototype.remove = function(){
  jvm.$(this.node).remove();
};/**
 * Implements abstract vector canvas.
 * @constructor
 * @param {HTMLElement} container Container to put element to.
 * @param {Number} width Width of canvas.
 * @param {Number} height Height of canvas.
 */
jvm.AbstractCanvasElement = function(container, width, height){
  this.container = container;
  this.setSize(width, height);
  this.rootElement = new jvm[this.classPrefix+'GroupElement']();
  this.node.appendChild( this.rootElement.node );
  this.container.appendChild(this.node);
}

/**
 * Add element to the certain group inside of the canvas.
 * @param {HTMLElement} element Element to add to canvas.
 * @param {HTMLElement} group Group to add element into or into root group if not provided.
 */
jvm.AbstractCanvasElement.prototype.add = function(element, group){
  group = group || this.rootElement;
  group.add(element);
  element.canvas = this;
}

/**
 * Create path and add it to the canvas.
 * @param {Object} config Parameters of path to create.
 * @param {Object} style Styles of the path to create.
 * @param {HTMLElement} group Group to add path into.
 */
jvm.AbstractCanvasElement.prototype.addPath = function(config, style, group){
  var el = new jvm[this.classPrefix+'PathElement'](config, style);

  this.add(el, group);
  return el;
};

/**
 * Create circle and add it to the canvas.
 * @param {Object} config Parameters of path to create.
 * @param {Object} style Styles of the path to create.
 * @param {HTMLElement} group Group to add circle into.
 */
jvm.AbstractCanvasElement.prototype.addCircle = function(config, style, group){
  var el = new jvm[this.classPrefix+'CircleElement'](config, style);

  this.add(el, group);
  return el;
};

/**
 * Create circle and add it to the canvas.
 * @param {Object} config Parameters of path to create.
 * @param {Object} style Styles of the path to create.
 * @param {HTMLElement} group Group to add circle into.
 */
jvm.AbstractCanvasElement.prototype.addImage = function(config, style, group){
  var el = new jvm[this.classPrefix+'ImageElement'](config, style);

  this.add(el, group);
  return el;
};

/**
 * Create text and add it to the canvas.
 * @param {Object} config Parameters of path to create.
 * @param {Object} style Styles of the path to create.
 * @param {HTMLElement} group Group to add circle into.
 */
jvm.AbstractCanvasElement.prototype.addText = function(config, style, group){
  var el = new jvm[this.classPrefix+'TextElement'](config, style);

  this.add(el, group);
  return el;
};

/**
 * Add group to the another group inside of the canvas.
 * @param {HTMLElement} group Group to add circle into or root group if not provided.
 */
jvm.AbstractCanvasElement.prototype.addGroup = function(parentGroup){
  var el = new jvm[this.classPrefix+'GroupElement']();

  if (parentGroup) {
    parentGroup.node.appendChild(el.node);
  } else {
    this.node.appendChild(el.node);
  }
  el.canvas = this;
  return el;
};/**
 * Abstract shape element. Shape element represents some visual vector or raster object.
 * @constructor
 * @param {String} name Tag name of the element.
 * @param {Object} config Set of parameters to initialize element with.
 * @param {Object} style Object with styles to set on element initialization.
 */
jvm.AbstractShapeElement = function(name, config, style){
  this.style = style || {};
  this.style.current = this.style.current || {};
  this.isHovered = false;
  this.isSelected = false;
  this.updateStyle();
};

/**
 * Set element's style.
 * @param {Object|String} property Could be string to set only one property or object to set several style properties at once.
 * @param {String} value Value to set in case only one property should be set.
 */
jvm.AbstractShapeElement.prototype.setStyle = function(property, value){
  var styles = {};

  if (typeof property === 'object') {
    styles = property;
  } else {
    styles[property] = value;
  }
  jvm.$.extend(this.style.current, styles);
  this.updateStyle();
};


jvm.AbstractShapeElement.prototype.updateStyle = function(){
  var attrs = {};

  jvm.AbstractShapeElement.mergeStyles(attrs, this.style.initial);
  jvm.AbstractShapeElement.mergeStyles(attrs, this.style.current);
  if (this.isHovered) {
    jvm.AbstractShapeElement.mergeStyles(attrs, this.style.hover);
  }
  if (this.isSelected) {
    jvm.AbstractShapeElement.mergeStyles(attrs, this.style.selected);
    if (this.isHovered) {
      jvm.AbstractShapeElement.mergeStyles(attrs, this.style.selectedHover);
    }
  }
  this.set(attrs);
};

jvm.AbstractShapeElement.mergeStyles = function(styles, newStyles){
  var key;

  newStyles = newStyles || {};
  for (key in newStyles) {
    if (newStyles[key] === null) {
      delete styles[key];
    } else {
      styles[key] = newStyles[key];
    }
  }
}/**
 * Wrapper for SVG element.
 * @constructor
 * @extends jvm.AbstractElement
 * @param {String} name Tag name of the element
 * @param {Object} config Set of parameters to initialize element with
 */

jvm.SVGElement = function(name, config){
  jvm.SVGElement.parentClass.apply(this, arguments);
}

jvm.inherits(jvm.SVGElement, jvm.AbstractElement);

jvm.SVGElement.svgns = "http://www.w3.org/2000/svg";

/**
 * Creates DOM element.
 * @param {String} tagName Name of element
 * @private
 * @returns DOMElement
 */
jvm.SVGElement.prototype.createElement = function( tagName ){
  return document.createElementNS( jvm.SVGElement.svgns, tagName );
};

/**
 * Adds CSS class for underlying DOM element.
 * @param {String} className Name of CSS class name
 */
jvm.SVGElement.prototype.addClass = function( className ){
  this.node.setAttribute('class', className);
};

/**
 * Returns constructor for element by name prefixed with 'VML'.
 * @param {String} ctr Name of basic constructor to return
 * proper implementation for.
 * @returns Function
 * @private
 */
jvm.SVGElement.prototype.getElementCtr = function( ctr ){
  return jvm['SVG'+ctr];
};

jvm.SVGElement.prototype.getBBox = function(){
  return this.node.getBBox();
};jvm.SVGGroupElement = function(){
  jvm.SVGGroupElement.parentClass.call(this, 'g');
}

jvm.inherits(jvm.SVGGroupElement, jvm.SVGElement);

jvm.SVGGroupElement.prototype.add = function(element){
  this.node.appendChild( element.node );
};jvm.SVGCanvasElement = function(container, width, height){
  this.classPrefix = 'SVG';
  jvm.SVGCanvasElement.parentClass.call(this, 'svg');

  this.defsElement = new jvm.SVGElement('defs');
  this.node.appendChild( this.defsElement.node );

  jvm.AbstractCanvasElement.apply(this, arguments);
}

jvm.inherits(jvm.SVGCanvasElement, jvm.SVGElement);
jvm.mixin(jvm.SVGCanvasElement, jvm.AbstractCanvasElement);

jvm.SVGCanvasElement.prototype.setSize = function(width, height){
  this.width = width;
  this.height = height;
  this.node.setAttribute('width', width);
  this.node.setAttribute('height', height);
};

jvm.SVGCanvasElement.prototype.applyTransformParams = function(scale, transX, transY) {
  this.scale = scale;
  this.transX = transX;
  this.transY = transY;
  this.rootElement.node.setAttribute('transform', 'scale('+scale+') translate('+transX+', '+transY+')');
};jvm.SVGShapeElement = function(name, config, style){
  jvm.SVGShapeElement.parentClass.call(this, name, config);
  jvm.AbstractShapeElement.apply(this, arguments);
};

jvm.inherits(jvm.SVGShapeElement, jvm.SVGElement);
jvm.mixin(jvm.SVGShapeElement, jvm.AbstractShapeElement);

jvm.SVGShapeElement.prototype.applyAttr = function(attr, value){
  var patternEl,
      imageEl,
      that = this;

  if (attr === 'fill' && jvm.isImageUrl(value)) {
    if (!jvm.SVGShapeElement.images[value]) {
      jvm.whenImageLoaded(value).then(function(img){
        imageEl = new jvm.SVGElement('image');
        imageEl.node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', value);
        imageEl.applyAttr('x', '0');
        imageEl.applyAttr('y', '0');
        imageEl.applyAttr('width', img[0].width);
        imageEl.applyAttr('height', img[0].height);

        patternEl = new jvm.SVGElement('pattern');
        patternEl.applyAttr('id', 'image'+jvm.SVGShapeElement.imageCounter);
        patternEl.applyAttr('x', 0);
        patternEl.applyAttr('y', 0);
        patternEl.applyAttr('width', img[0].width / 2);
        patternEl.applyAttr('height', img[0].height / 2);
        patternEl.applyAttr('viewBox', '0 0 '+img[0].width+' '+img[0].height);
        patternEl.applyAttr('patternUnits', 'userSpaceOnUse');
        patternEl.node.appendChild( imageEl.node );

        that.canvas.defsElement.node.appendChild( patternEl.node );

        jvm.SVGShapeElement.images[value] = jvm.SVGShapeElement.imageCounter++;

        that.applyAttr('fill', 'url(#image'+jvm.SVGShapeElement.images[value]+')');
      });
    } else {
      this.applyAttr('fill', 'url(#image'+jvm.SVGShapeElement.images[value]+')');
    }
  } else {
    jvm.SVGShapeElement.parentClass.prototype.applyAttr.apply(this, arguments);
  }
};

jvm.SVGShapeElement.imageCounter = 1;
jvm.SVGShapeElement.images = {};jvm.SVGPathElement = function(config, style){
  jvm.SVGPathElement.parentClass.call(this, 'path', config, style);
  this.node.setAttribute('fill-rule', 'evenodd');
}

jvm.inherits(jvm.SVGPathElement, jvm.SVGShapeElement);jvm.SVGCircleElement = function(config, style){
  jvm.SVGCircleElement.parentClass.call(this, 'circle', config, style);
};

jvm.inherits(jvm.SVGCircleElement, jvm.SVGShapeElement);jvm.SVGImageElement = function(config, style){
  jvm.SVGImageElement.parentClass.call(this, 'image', config, style);
};

jvm.inherits(jvm.SVGImageElement, jvm.SVGShapeElement);

jvm.SVGImageElement.prototype.applyAttr = function(attr, value){
  var that = this;

  if (attr == 'image') {
    jvm.whenImageLoaded(value).then(function(img){
      that.node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', value);
      that.width = img[0].width;
      that.height = img[0].height;
      that.applyAttr('width', that.width);
      that.applyAttr('height', that.height);

      that.applyAttr('x', that.cx - that.width / 2);
      that.applyAttr('y', that.cy - that.height / 2);

      jvm.$(that.node).trigger('imageloaded', [img]);
    });
  } else if(attr == 'cx') {
    this.cx = value;
    if (this.width) {
      this.applyAttr('x', value - this.width / 2);
    }
  } else if(attr == 'cy') {
    this.cy = value;
    if (this.height) {
      this.applyAttr('y', value - this.height / 2);
    }
  } else {
    jvm.SVGImageElement.parentClass.prototype.applyAttr.apply(this, arguments);
  }
};jvm.SVGTextElement = function(config, style){
  jvm.SVGTextElement.parentClass.call(this, 'text', config, style);
}

jvm.inherits(jvm.SVGTextElement, jvm.SVGShapeElement);

jvm.SVGTextElement.prototype.applyAttr = function(attr, value){
  if (attr === 'text') {
    this.node.textContent = value;
  } else {
    jvm.SVGTextElement.parentClass.prototype.applyAttr.apply(this, arguments);
  }
};/**
 * Wrapper for VML element.
 * @constructor
 * @extends jvm.AbstractElement
 * @param {String} name Tag name of the element
 * @param {Object} config Set of parameters to initialize element with
 */

jvm.VMLElement = function(name, config){
  if (!jvm.VMLElement.VMLInitialized) {
    jvm.VMLElement.initializeVML();
  }

  jvm.VMLElement.parentClass.apply(this, arguments);
};

jvm.inherits(jvm.VMLElement, jvm.AbstractElement);

/**
 * Shows if VML was already initialized for the current document or not.
 * @static
 * @private
 * @type {Boolean}
 */
jvm.VMLElement.VMLInitialized = false;

/**
 * Initializes VML handling before creating the first element
 * (adds CSS class and creates namespace). Adds one of two forms
 * of createElement method depending of support by browser.
 * @static
 * @private
 */

 // The following method of VML handling is borrowed from the
 // Raphael library by Dmitry Baranovsky.

jvm.VMLElement.initializeVML = function(){
  try {
    if (!document.namespaces.rvml) {
      document.namespaces.add("rvml","urn:schemas-microsoft-com:vml");
    }
    /**
     * Creates DOM element.
     * @param {String} tagName Name of element
     * @private
     * @returns DOMElement
     */
    jvm.VMLElement.prototype.createElement = function (tagName) {
      return document.createElement('<rvml:' + tagName + ' class="rvml">');
    };
  } catch (e) {
    /**
     * @private
     */
    jvm.VMLElement.prototype.createElement = function (tagName) {
      return document.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
    };
  }
  document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
  jvm.VMLElement.VMLInitialized = true;
};

/**
 * Returns constructor for element by name prefixed with 'VML'.
 * @param {String} ctr Name of basic constructor to return
 * proper implementation for.
 * @returns Function
 * @private
 */
jvm.VMLElement.prototype.getElementCtr = function( ctr ){
  return jvm['VML'+ctr];
};

/**
 * Adds CSS class for underlying DOM element.
 * @param {String} className Name of CSS class name
 */
jvm.VMLElement.prototype.addClass = function( className ){
  jvm.$(this.node).addClass(className);
};

/**
 * Applies attribute value to the underlying DOM element.
 * @param {String} name Name of attribute
 * @param {Number|String} config Value of attribute to apply
 * @private
 */
jvm.VMLElement.prototype.applyAttr = function( attr, value ){
  this.node[attr] = value;
};

/**
 * Returns boundary box for the element.
 * @returns {Object} Boundary box with numeric fields: x, y, width, height
 * @override
 */
jvm.VMLElement.prototype.getBBox = function(){
  var node = jvm.$(this.node);

  return {
    x: node.position().left / this.canvas.scale,
    y: node.position().top / this.canvas.scale,
    width: node.width() / this.canvas.scale,
    height: node.height() / this.canvas.scale
  };
};jvm.VMLGroupElement = function(){
  jvm.VMLGroupElement.parentClass.call(this, 'group');

  this.node.style.left = '0px';
  this.node.style.top = '0px';
  this.node.coordorigin = "0 0";
};

jvm.inherits(jvm.VMLGroupElement, jvm.VMLElement);

jvm.VMLGroupElement.prototype.add = function(element){
  this.node.appendChild( element.node );
};jvm.VMLCanvasElement = function(container, width, height){
  this.classPrefix = 'VML';
  jvm.VMLCanvasElement.parentClass.call(this, 'group');
  jvm.AbstractCanvasElement.apply(this, arguments);
  this.node.style.position = 'absolute';
};

jvm.inherits(jvm.VMLCanvasElement, jvm.VMLElement);
jvm.mixin(jvm.VMLCanvasElement, jvm.AbstractCanvasElement);

jvm.VMLCanvasElement.prototype.setSize = function(width, height){
  var paths,
      groups,
      i,
      l;

  this.width = width;
  this.height = height;
  this.node.style.width = width + "px";
  this.node.style.height = height + "px";
  this.node.coordsize = width+' '+height;
  this.node.coordorigin = "0 0";
  if (this.rootElement) {
    paths = this.rootElement.node.getElementsByTagName('shape');
    for(i = 0, l = paths.length; i < l; i++) {
      paths[i].coordsize = width+' '+height;
      paths[i].style.width = width+'px';
      paths[i].style.height = height+'px';
    }
    groups = this.node.getElementsByTagName('group');
    for(i = 0, l = groups.length; i < l; i++) {
      groups[i].coordsize = width+' '+height;
      groups[i].style.width = width+'px';
      groups[i].style.height = height+'px';
    }
  }
};

jvm.VMLCanvasElement.prototype.applyTransformParams = function(scale, transX, transY) {
  this.scale = scale;
  this.transX = transX;
  this.transY = transY;
  this.rootElement.node.coordorigin = (this.width-transX-this.width/100)+','+(this.height-transY-this.height/100);
  this.rootElement.node.coordsize = this.width/scale+','+this.height/scale;
};jvm.VMLShapeElement = function(name, config){
  jvm.VMLShapeElement.parentClass.call(this, name, config);

  this.fillElement = new jvm.VMLElement('fill');
  this.strokeElement = new jvm.VMLElement('stroke');
  this.node.appendChild(this.fillElement.node);
  this.node.appendChild(this.strokeElement.node);
  this.node.stroked = false;

  jvm.AbstractShapeElement.apply(this, arguments);
};

jvm.inherits(jvm.VMLShapeElement, jvm.VMLElement);
jvm.mixin(jvm.VMLShapeElement, jvm.AbstractShapeElement);

jvm.VMLShapeElement.prototype.applyAttr = function(attr, value){
  switch (attr) {
    case 'fill':
      this.node.fillcolor = value;
      break;
    case 'fill-opacity':
      this.fillElement.node.opacity = Math.round(value*100)+'%';
      break;
    case 'stroke':
      if (value === 'none') {
        this.node.stroked = false;
      } else {
        this.node.stroked = true;
      }
      this.node.strokecolor = value;
      break;
    case 'stroke-opacity':
      this.strokeElement.node.opacity = Math.round(value*100)+'%';
      break;
    case 'stroke-width':
      if (parseInt(value, 10) === 0) {
        this.node.stroked = false;
      } else {
        this.node.stroked = true;
      }
      this.node.strokeweight = value;
      break;
    case 'd':
      this.node.path = jvm.VMLPathElement.pathSvgToVml(value);
      break;
    default:
      jvm.VMLShapeElement.parentClass.prototype.applyAttr.apply(this, arguments);
  }
};jvm.VMLPathElement = function(config, style){
  var scale = new jvm.VMLElement('skew');

  jvm.VMLPathElement.parentClass.call(this, 'shape', config, style);

  this.node.coordorigin = "0 0";

  scale.node.on = true;
  scale.node.matrix = '0.01,0,0,0.01,0,0';
  scale.node.offset = '0,0';

  this.node.appendChild(scale.node);
};

jvm.inherits(jvm.VMLPathElement, jvm.VMLShapeElement);

jvm.VMLPathElement.prototype.applyAttr = function(attr, value){
  if (attr === 'd') {
    this.node.path = jvm.VMLPathElement.pathSvgToVml(value);
  } else {
    jvm.VMLShapeElement.prototype.applyAttr.call(this, attr, value);
  }
};

jvm.VMLPathElement.pathSvgToVml = function(path) {
  var cx = 0, cy = 0, ctrlx, ctrly;

  path = path.replace(/(-?\d+)e(-?\d+)/g, '0');
  return path.replace(/([MmLlHhVvCcSs])\s*((?:-?\d*(?:\.\d+)?\s*,?\s*)+)/g, function(segment, letter, coords, index){
    coords = coords.replace(/(\d)-/g, '$1,-')
            .replace(/^\s+/g, '')
            .replace(/\s+$/g, '')
            .replace(/\s+/g, ',').split(',');
    if (!coords[0]) coords.shift();
    for (var i=0, l=coords.length; i<l; i++) {
      coords[i] = Math.round(100*coords[i]);
    }
    switch (letter) {
      case 'm':
        cx += coords[0];
        cy += coords[1];
        return 't'+coords.join(',');
      case 'M':
        cx = coords[0];
        cy = coords[1];
        return 'm'+coords.join(',');
      case 'l':
        cx += coords[0];
        cy += coords[1];
        return 'r'+coords.join(',');
      case 'L':
        cx = coords[0];
        cy = coords[1];
        return 'l'+coords.join(',');
      case 'h':
        cx += coords[0];
        return 'r'+coords[0]+',0';
      case 'H':
        cx = coords[0];
        return 'l'+cx+','+cy;
      case 'v':
        cy += coords[0];
        return 'r0,'+coords[0];
      case 'V':
        cy = coords[0];
        return 'l'+cx+','+cy;
      case 'c':
        ctrlx = cx + coords[coords.length-4];
        ctrly = cy + coords[coords.length-3];
        cx += coords[coords.length-2];
        cy += coords[coords.length-1];
        return 'v'+coords.join(',');
      case 'C':
        ctrlx = coords[coords.length-4];
        ctrly = coords[coords.length-3];
        cx = coords[coords.length-2];
        cy = coords[coords.length-1];
        return 'c'+coords.join(',');
      case 's':
        coords.unshift(cy-ctrly);
        coords.unshift(cx-ctrlx);
        ctrlx = cx + coords[coords.length-4];
        ctrly = cy + coords[coords.length-3];
        cx += coords[coords.length-2];
        cy += coords[coords.length-1];
        return 'v'+coords.join(',');
      case 'S':
        coords.unshift(cy+cy-ctrly);
        coords.unshift(cx+cx-ctrlx);
        ctrlx = coords[coords.length-4];
        ctrly = coords[coords.length-3];
        cx = coords[coords.length-2];
        cy = coords[coords.length-1];
        return 'c'+coords.join(',');
    }
    return '';
  }).replace(/z/g, 'e');
};jvm.VMLCircleElement = function(config, style){
  jvm.VMLCircleElement.parentClass.call(this, 'oval', config, style);
};

jvm.inherits(jvm.VMLCircleElement, jvm.VMLShapeElement);

jvm.VMLCircleElement.prototype.applyAttr = function(attr, value){
  switch (attr) {
    case 'r':
      this.node.style.width = value*2+'px';
      this.node.style.height = value*2+'px';
      this.applyAttr('cx', this.get('cx') || 0);
      this.applyAttr('cy', this.get('cy') || 0);
      break;
    case 'cx':
      if (!value) return;
      this.node.style.left = value - (this.get('r') || 0) + 'px';
      break;
    case 'cy':
      if (!value) return;
      this.node.style.top = value - (this.get('r') || 0) + 'px';
      break;
    default:
      jvm.VMLCircleElement.parentClass.prototype.applyAttr.call(this, attr, value);
  }
};/**
 * Class for vector images manipulations.
 * @constructor
 * @param {DOMElement} container to place canvas to
 * @param {Number} width
 * @param {Number} height
 */
jvm.VectorCanvas = function(container, width, height) {
  this.mode = window.SVGAngle ? 'svg' : 'vml';

  if (this.mode == 'svg') {
    this.impl = new jvm.SVGCanvasElement(container, width, height);
  } else {
    this.impl = new jvm.VMLCanvasElement(container, width, height);
  }
  this.impl.mode = this.mode;
  return this.impl;
};jvm.SimpleScale = function(scale){
  this.scale = scale;
};

jvm.SimpleScale.prototype.getValue = function(value){
  return value;
};jvm.OrdinalScale = function(scale){
  this.scale = scale;
};

jvm.OrdinalScale.prototype.getValue = function(value){
  return this.scale[value];
};

jvm.OrdinalScale.prototype.getTicks = function(){
  var ticks = [],
      key;

  for (key in this.scale) {
    ticks.push({
      label: key,
      value: this.scale[key]
    });
  }

  return ticks;
};jvm.NumericScale = function(scale, normalizeFunction, minValue, maxValue) {
  this.scale = [];

  normalizeFunction = normalizeFunction || 'linear';

  if (scale) this.setScale(scale);
  if (normalizeFunction) this.setNormalizeFunction(normalizeFunction);
  if (typeof minValue !== 'undefined' ) this.setMin(minValue);
  if (typeof maxValue !== 'undefined' ) this.setMax(maxValue);
};

jvm.NumericScale.prototype = {
  setMin: function(min) {
    this.clearMinValue = min;
    if (typeof this.normalize === 'function') {
      this.minValue = this.normalize(min);
    } else {
      this.minValue = min;
    }
  },

  setMax: function(max) {
    this.clearMaxValue = max;
    if (typeof this.normalize === 'function') {
      this.maxValue = this.normalize(max);
    } else {
      this.maxValue = max;
    }
  },

  setScale: function(scale) {
    var i;

    this.scale = [];
    for (i = 0; i < scale.length; i++) {
      this.scale[i] = [scale[i]];
    }
  },

  setNormalizeFunction: function(f) {
    if (f === 'polynomial') {
      this.normalize = function(value) {
        return Math.pow(value, 0.2);
      }
    } else if (f === 'linear') {
      delete this.normalize;
    } else {
      this.normalize = f;
    }
    this.setMin(this.clearMinValue);
    this.setMax(this.clearMaxValue);
  },

  getValue: function(value) {
    var lengthes = [],
        fullLength = 0,
        l,
        i = 0,
        c;

    if (typeof this.normalize === 'function') {
      value = this.normalize(value);
    }
    for (i = 0; i < this.scale.length-1; i++) {
      l = this.vectorLength(this.vectorSubtract(this.scale[i+1], this.scale[i]));
      lengthes.push(l);
      fullLength += l;
    }

    c = (this.maxValue - this.minValue) / fullLength;
    for (i=0; i<lengthes.length; i++) {
      lengthes[i] *= c;
    }

    i = 0;
    value -= this.minValue;
    while (value - lengthes[i] >= 0) {
      value -= lengthes[i];
      i++;
    }

    if (i == this.scale.length - 1) {
      value = this.vectorToNum(this.scale[i])
    } else {
      value = (
        this.vectorToNum(
          this.vectorAdd(this.scale[i],
            this.vectorMult(
              this.vectorSubtract(this.scale[i+1], this.scale[i]),
              (value) / (lengthes[i])
            )
          )
        )
      );
    }

    return value;
  },

  vectorToNum: function(vector) {
    var num = 0,
        i;

    for (i = 0; i < vector.length; i++) {
      num += Math.round(vector[i])*Math.pow(256, vector.length-i-1);
    }
    return num;
  },

  vectorSubtract: function(vector1, vector2) {
    var vector = [],
        i;

    for (i = 0; i < vector1.length; i++) {
      vector[i] = vector1[i] - vector2[i];
    }
    return vector;
  },

  vectorAdd: function(vector1, vector2) {
    var vector = [],
        i;

    for (i = 0; i < vector1.length; i++) {
      vector[i] = vector1[i] + vector2[i];
    }
    return vector;
  },

  vectorMult: function(vector, num) {
    var result = [],
        i;

    for (i = 0; i < vector.length; i++) {
      result[i] = vector[i] * num;
    }
    return result;
  },

  vectorLength: function(vector) {
    var result = 0,
        i;
    for (i = 0; i < vector.length; i++) {
      result += vector[i] * vector[i];
    }
    return Math.sqrt(result);
  },

  /* Derived from d3 implementation https://github.com/mbostock/d3/blob/master/src/scale/linear.js#L94 */
  getTicks: function(){
    var m = 5,
        extent = [this.clearMinValue, this.clearMaxValue],
        span = extent[1] - extent[0],
        step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)),
        err = m / span * step,
        ticks = [],
        tick,
        v;

    if (err <= .15) step *= 10;
    else if (err <= .35) step *= 5;
    else if (err <= .75) step *= 2;

    extent[0] = Math.floor(extent[0] / step) * step;
    extent[1] = Math.ceil(extent[1] / step) * step;

    tick = extent[0];
    while (tick <= extent[1]) {
      if (tick == extent[0]) {
        v = this.clearMinValue;
      } else if (tick == extent[1]) {
        v = this.clearMaxValue;
      } else {
        v = tick;
      }
      ticks.push({
        label: tick,
        value: this.getValue(v)
      });
      tick += step;
    }

    return ticks;
  }
};
jvm.ColorScale = function(colors, normalizeFunction, minValue, maxValue) {
  jvm.ColorScale.parentClass.apply(this, arguments);
}

jvm.inherits(jvm.ColorScale, jvm.NumericScale);

jvm.ColorScale.prototype.setScale = function(scale) {
  var i;

  for (i = 0; i < scale.length; i++) {
    this.scale[i] = jvm.ColorScale.rgbToArray(scale[i]);
  }
};

jvm.ColorScale.prototype.getValue = function(value) {
  return jvm.ColorScale.numToRgb(jvm.ColorScale.parentClass.prototype.getValue.call(this, value));
};

jvm.ColorScale.arrayToRgb = function(ar) {
  var rgb = '#',
      d,
      i;

  for (i = 0; i < ar.length; i++) {
    d = ar[i].toString(16);
    rgb += d.length == 1 ? '0'+d : d;
  }
  return rgb;
};

jvm.ColorScale.numToRgb = function(num) {
  num = num.toString(16);

  while (num.length < 6) {
    num = '0' + num;
  }

  return '#'+num;
};

jvm.ColorScale.rgbToArray = function(rgb) {
  rgb = rgb.substr(1);
  return [parseInt(rgb.substr(0, 2), 16), parseInt(rgb.substr(2, 2), 16), parseInt(rgb.substr(4, 2), 16)];
};/**
 * Represents map legend.
 * @constructor
 * @param {Object} params Configuration parameters.
 * @param {String} params.cssClass Additional CSS class to apply to legend element.
 * @param {Boolean} params.vertical If <code>true</code> legend will be rendered as vertical.
 * @param {String} params.title Legend title.
 * @param {Function} params.labelRender Method to convert series values to legend labels.
 */
jvm.Legend = function(params) {
  this.params = params || {};
  this.map = this.params.map;
  this.series = this.params.series;
  this.body = jvm.$('<div/>');
  this.body.addClass('jvectormap-legend');
  if (this.params.cssClass) {
    this.body.addClass(this.params.cssClass);
  }

  if (params.vertical) {
    this.map.legendCntVertical.append( this.body );
  } else {
    this.map.legendCntHorizontal.append( this.body );
  }

  this.render();
}

jvm.Legend.prototype.render = function(){
  var ticks = this.series.scale.getTicks(),
      i,
      inner = jvm.$('<div/>').addClass('jvectormap-legend-inner'),
      tick,
      sample,
      label;

  this.body.html('');
  if (this.params.title) {
    this.body.append(
      jvm.$('<div/>').addClass('jvectormap-legend-title').html(this.params.title)
    );
  }
  this.body.append(inner);

  for (i = 0; i < ticks.length; i++) {
    tick = jvm.$('<div/>').addClass('jvectormap-legend-tick');
    sample = jvm.$('<div/>').addClass('jvectormap-legend-tick-sample');

    switch (this.series.params.attribute) {
      case 'fill':
        if (jvm.isImageUrl(ticks[i].value)) {
          sample.css('background', 'url('+ticks[i].value+')');
        } else {
          sample.css('background', ticks[i].value);
        }
        break;
      case 'stroke':
        sample.css('background', ticks[i].value);
        break;
      case 'image':
        sample.css('background', 'url('+ticks[i].value+') no-repeat center center');
        break;
      case 'r':
        jvm.$('<div/>').css({
          'border-radius': ticks[i].value,
          border: this.map.params.markerStyle.initial['stroke-width']+'px '+
                  this.map.params.markerStyle.initial['stroke']+' solid',
          width: ticks[i].value * 2 + 'px',
          height: ticks[i].value * 2 + 'px',
          background: this.map.params.markerStyle.initial['fill']
        }).appendTo(sample);
        break;
    }
    tick.append( sample );
    label = ticks[i].label;
    if (this.params.labelRender) {
      label = this.params.labelRender(label);
    }
    tick.append( jvm.$('<div>'+label+' </div>').addClass('jvectormap-legend-tick-text') );
    inner.append(tick);
  }
  inner.append( jvm.$('<div/>').css('clear', 'both') );
}/**
 * Creates data series.
 * @constructor
 * @param {Object} params Parameters to initialize series with.
 * @param {Array} params.values The data set to visualize.
 * @param {String} params.attribute Numberic or color attribute to use for data visualization. This could be: <code>fill</code>, <code>stroke</code>, <code>fill-opacity</code>, <code>stroke-opacity</code> for markers and regions and <code>r</code> (radius) for markers only.
 * @param {Array} params.scale Values used to map a dimension of data to a visual representation. The first value sets visualization for minimum value from the data set and the last value sets visualization for the maximum value. There also could be intermidiate values. Default value is <code>['#C8EEFF', '#0071A4']</code>
 * @param {Function|String} params.normalizeFunction The function used to map input values to the provided scale. This parameter could be provided as function or one of the strings: <code>'linear'</code> or <code>'polynomial'</code>, while <code>'linear'</code> is used by default. The function provided takes value from the data set as an input and returns corresponding value from the scale.
 * @param {Number} params.min Minimum value of the data set. Could be calculated automatically if not provided.
 * @param {Number} params.min Maximum value of the data set. Could be calculated automatically if not provided.
 */
jvm.DataSeries = function(params, elements, map) {
  var scaleConstructor;

  params = params || {};
  params.attribute = params.attribute || 'fill';

  this.elements = elements;
  this.params = params;
  this.map = map;

  if (params.attributes) {
    this.setAttributes(params.attributes);
  }

  if (jvm.$.isArray(params.scale)) {
    scaleConstructor = (params.attribute === 'fill' || params.attribute === 'stroke') ? jvm.ColorScale : jvm.NumericScale;
    this.scale = new scaleConstructor(params.scale, params.normalizeFunction, params.min, params.max);
  } else if (params.scale) {
    this.scale = new jvm.OrdinalScale(params.scale);
  } else {
    this.scale = new jvm.SimpleScale(params.scale);
  }

  this.values = params.values || {};
  this.setValues(this.values);

  if (this.params.legend) {
    this.legend = new jvm.Legend($.extend({
      map: this.map,
      series: this
    }, this.params.legend))
  }
};

jvm.DataSeries.prototype = {
  setAttributes: function(key, attr){
    var attrs = key,
        code;

    if (typeof key == 'string') {
      if (this.elements[key]) {
        this.elements[key].setStyle(this.params.attribute, attr);
      }
    } else {
      for (code in attrs) {
        if (this.elements[code]) {
          this.elements[code].element.setStyle(this.params.attribute, attrs[code]);
        }
      }
    }
  },

  /**
   * Set values for the data set.
   * @param {Object} values Object which maps codes of regions or markers to values.
   */
  setValues: function(values) {
    var max = -Number.MAX_VALUE,
        min = Number.MAX_VALUE,
        val,
        cc,
        attrs = {};

    if (!(this.scale instanceof jvm.OrdinalScale) && !(this.scale instanceof jvm.SimpleScale)) {
      // we have a color scale as an array
      if (typeof this.params.min === 'undefined' || typeof this.params.max === 'undefined') {
        // min and/or max are not defined, so calculate them
        for (cc in values) {
          val = parseFloat(values[cc]);
          if (val > max) max = val;
          if (val < min) min = val;
        }
      }

      if (typeof this.params.min === 'undefined') {
        this.scale.setMin(min);
        this.params.min = min;
      } else {
        this.scale.setMin(this.params.min);
      }

      if (typeof this.params.max === 'undefined') {
        this.scale.setMax(max);
        this.params.max = max;
      } else {
        this.scale.setMax(this.params.max);
      }

      for (cc in values) {
        if (cc != 'indexOf') {
          val = parseFloat(values[cc]);
          if (!isNaN(val)) {
            attrs[cc] = this.scale.getValue(val);
          } else {
            attrs[cc] = this.elements[cc].element.style.initial[this.params.attribute];
          }
        }
      }
    } else {
      for (cc in values) {
        if (values[cc]) {
          attrs[cc] = this.scale.getValue(values[cc]);
        } else {
          attrs[cc] = this.elements[cc].element.style.initial[this.params.attribute];
        }
      }
    }

    this.setAttributes(attrs);
    jvm.$.extend(this.values, values);
  },

  clear: function(){
    var key,
        attrs = {};

    for (key in this.values) {
      if (this.elements[key]) {
        attrs[key] = this.elements[key].element.shape.style.initial[this.params.attribute];
      }
    }
    this.setAttributes(attrs);
    this.values = {};
  },

  /**
   * Set scale of the data series.
   * @param {Array} scale Values representing scale.
   */
  setScale: function(scale) {
    this.scale.setScale(scale);
    if (this.values) {
      this.setValues(this.values);
    }
  },

  /**
   * Set normalize function of the data series.
   * @param {Function|String} normilizeFunction.
   */
  setNormalizeFunction: function(f) {
    this.scale.setNormalizeFunction(f);
    if (this.values) {
      this.setValues(this.values);
    }
  }
};
/**
 * Contains methods for transforming point on sphere to
 * Cartesian coordinates using various projections.
 * @class
 */
jvm.Proj = {
  degRad: 180 / Math.PI,
  radDeg: Math.PI / 180,
  radius: 6381372,

  sgn: function(n){
    if (n > 0) {
      return 1;
    } else if (n < 0) {
      return -1;
    } else {
      return n;
    }
  },

  /**
   * Converts point on sphere to the Cartesian coordinates using Miller projection
   * @param {Number} lat Latitude in degrees
   * @param {Number} lng Longitude in degrees
   * @param {Number} c Central meridian in degrees
   */
  mill: function(lat, lng, c){
    return {
      x: this.radius * (lng - c) * this.radDeg,
      y: - this.radius * Math.log(Math.tan((45 + 0.4 * lat) * this.radDeg)) / 0.8
    };
  },

  /**
   * Inverse function of mill()
   * Converts Cartesian coordinates to point on sphere using Miller projection
   * @param {Number} x X of point in Cartesian system as integer
   * @param {Number} y Y of point in Cartesian system as integer
   * @param {Number} c Central meridian in degrees
   */
  mill_inv: function(x, y, c){
    return {
      lat: (2.5 * Math.atan(Math.exp(0.8 * y / this.radius)) - 5 * Math.PI / 8) * this.degRad,
      lng: (c * this.radDeg + x / this.radius) * this.degRad
    };
  },

  /**
   * Converts point on sphere to the Cartesian coordinates using Mercator projection
   * @param {Number} lat Latitude in degrees
   * @param {Number} lng Longitude in degrees
   * @param {Number} c Central meridian in degrees
   */
  merc: function(lat, lng, c){
    return {
      x: this.radius * (lng - c) * this.radDeg,
      y: - this.radius * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))
    };
  },

  /**
   * Inverse function of merc()
   * Converts Cartesian coordinates to point on sphere using Mercator projection
   * @param {Number} x X of point in Cartesian system as integer
   * @param {Number} y Y of point in Cartesian system as integer
   * @param {Number} c Central meridian in degrees
   */
  merc_inv: function(x, y, c){
    return {
      lat: (2 * Math.atan(Math.exp(y / this.radius)) - Math.PI / 2) * this.degRad,
      lng: (c * this.radDeg + x / this.radius) * this.degRad
    };
  },

  /**
   * Converts point on sphere to the Cartesian coordinates using Albers Equal-Area Conic
   * projection
   * @see <a href="http://mathworld.wolfram.com/AlbersEqual-AreaConicProjection.html">Albers Equal-Area Conic projection</a>
   * @param {Number} lat Latitude in degrees
   * @param {Number} lng Longitude in degrees
   * @param {Number} c Central meridian in degrees
   */
  aea: function(lat, lng, c){
    var fi0 = 0,
        lambda0 = c * this.radDeg,
        fi1 = 29.5 * this.radDeg,
        fi2 = 45.5 * this.radDeg,
        fi = lat * this.radDeg,
        lambda = lng * this.radDeg,
        n = (Math.sin(fi1)+Math.sin(fi2)) / 2,
        C = Math.cos(fi1)*Math.cos(fi1)+2*n*Math.sin(fi1),
        theta = n*(lambda-lambda0),
        ro = Math.sqrt(C-2*n*Math.sin(fi))/n,
        ro0 = Math.sqrt(C-2*n*Math.sin(fi0))/n;

    return {
      x: ro * Math.sin(theta) * this.radius,
      y: - (ro0 - ro * Math.cos(theta)) * this.radius
    };
  },

  /**
   * Converts Cartesian coordinates to the point on sphere using Albers Equal-Area Conic
   * projection
   * @see <a href="http://mathworld.wolfram.com/AlbersEqual-AreaConicProjection.html">Albers Equal-Area Conic projection</a>
   * @param {Number} x X of point in Cartesian system as integer
   * @param {Number} y Y of point in Cartesian system as integer
   * @param {Number} c Central meridian in degrees
   */
  aea_inv: function(xCoord, yCoord, c){
    var x = xCoord / this.radius,
        y = yCoord / this.radius,
        fi0 = 0,
        lambda0 = c * this.radDeg,
        fi1 = 29.5 * this.radDeg,
        fi2 = 45.5 * this.radDeg,
        n = (Math.sin(fi1)+Math.sin(fi2)) / 2,
        C = Math.cos(fi1)*Math.cos(fi1)+2*n*Math.sin(fi1),
        ro0 = Math.sqrt(C-2*n*Math.sin(fi0))/n,
        ro = Math.sqrt(x*x+(ro0-y)*(ro0-y)),
        theta = Math.atan( x / (ro0 - y) );

    return {
      lat: (Math.asin((C - ro * ro * n * n) / (2 * n))) * this.degRad,
      lng: (lambda0 + theta / n) * this.degRad
    };
  },

  /**
   * Converts point on sphere to the Cartesian coordinates using Lambert conformal
   * conic projection
   * @see <a href="http://mathworld.wolfram.com/LambertConformalConicProjection.html">Lambert Conformal Conic Projection</a>
   * @param {Number} lat Latitude in degrees
   * @param {Number} lng Longitude in degrees
   * @param {Number} c Central meridian in degrees
   */
  lcc: function(lat, lng, c){
    var fi0 = 0,
        lambda0 = c * this.radDeg,
        lambda = lng * this.radDeg,
        fi1 = 33 * this.radDeg,
        fi2 = 45 * this.radDeg,
        fi = lat * this.radDeg,
        n = Math.log( Math.cos(fi1) * (1 / Math.cos(fi2)) ) / Math.log( Math.tan( Math.PI / 4 + fi2 / 2) * (1 / Math.tan( Math.PI / 4 + fi1 / 2) ) ),
        F = ( Math.cos(fi1) * Math.pow( Math.tan( Math.PI / 4 + fi1 / 2 ), n ) ) / n,
        ro = F * Math.pow( 1 / Math.tan( Math.PI / 4 + fi / 2 ), n ),
        ro0 = F * Math.pow( 1 / Math.tan( Math.PI / 4 + fi0 / 2 ), n );

    return {
      x: ro * Math.sin( n * (lambda - lambda0) ) * this.radius,
      y: - (ro0 - ro * Math.cos( n * (lambda - lambda0) ) ) * this.radius
    };
  },

  /**
   * Converts Cartesian coordinates to the point on sphere using Lambert conformal conic
   * projection
   * @see <a href="http://mathworld.wolfram.com/LambertConformalConicProjection.html">Lambert Conformal Conic Projection</a>
   * @param {Number} x X of point in Cartesian system as integer
   * @param {Number} y Y of point in Cartesian system as integer
   * @param {Number} c Central meridian in degrees
   */
  lcc_inv: function(xCoord, yCoord, c){
    var x = xCoord / this.radius,
        y = yCoord / this.radius,
        fi0 = 0,
        lambda0 = c * this.radDeg,
        fi1 = 33 * this.radDeg,
        fi2 = 45 * this.radDeg,
        n = Math.log( Math.cos(fi1) * (1 / Math.cos(fi2)) ) / Math.log( Math.tan( Math.PI / 4 + fi2 / 2) * (1 / Math.tan( Math.PI / 4 + fi1 / 2) ) ),
        F = ( Math.cos(fi1) * Math.pow( Math.tan( Math.PI / 4 + fi1 / 2 ), n ) ) / n,
        ro0 = F * Math.pow( 1 / Math.tan( Math.PI / 4 + fi0 / 2 ), n ),
        ro = this.sgn(n) * Math.sqrt(x*x+(ro0-y)*(ro0-y)),
        theta = Math.atan( x / (ro0 - y) );

    return {
      lat: (2 * Math.atan(Math.pow(F/ro, 1/n)) - Math.PI / 2) * this.degRad,
      lng: (lambda0 + theta / n) * this.degRad
    };
  }
};jvm.MapObject = function(config){};

jvm.MapObject.prototype.getLabelText = function(key){
  var text;

  if (this.config.label) {
    if (typeof this.config.label.render === 'function') {
      text = this.config.label.render(key);
    } else {
      text = key;
    }
  } else {
    text = null;
  }
  return text;
}

jvm.MapObject.prototype.getLabelOffsets = function(key){
  var offsets;

  if (this.config.label) {
    if (typeof this.config.label.offsets === 'function') {
      offsets = this.config.label.offsets(key);
    } else if (typeof this.config.label.offsets === 'object') {
      offsets = this.config.label.offsets[key];
    }
  }
  return offsets || [0, 0];
}

/**
 * Set hovered state to the element. Hovered state means mouse cursor is over element. Styles will be updates respectively.
 * @param {Boolean} isHovered <code>true</code> to make element hovered, <code>false</code> otherwise.
 */
jvm.MapObject.prototype.setHovered = function(isHovered){
  if (this.isHovered !== isHovered) {
    this.isHovered = isHovered;
    this.shape.isHovered = isHovered;
    this.shape.updateStyle();
    if (this.label) {
      this.label.isHovered = isHovered;
      this.label.updateStyle();
    }
  }
};

/**
 * Set selected state to the element. Styles will be updates respectively.
 * @param {Boolean} isSelected <code>true</code> to make element selected, <code>false</code> otherwise.
 */
jvm.MapObject.prototype.setSelected = function(isSelected){
  if (this.isSelected !== isSelected) {
    this.isSelected = isSelected;
    this.shape.isSelected = isSelected;
    this.shape.updateStyle();
    if (this.label) {
      this.label.isSelected = isSelected;
      this.label.updateStyle();
    }
    jvm.$(this.shape).trigger('selected', [isSelected]);
  }
};

jvm.MapObject.prototype.setStyle = function(){
	this.shape.setStyle.apply(this.shape, arguments);
};

jvm.MapObject.prototype.remove = function(){
  this.shape.remove();
  if (this.label) {
    this.label.remove();
  }
};jvm.Region = function(config){
  var bbox,
      text,
      offsets,
      labelDx,
      labelDy;

  this.config = config;
  this.map = this.config.map;

  this.shape = config.canvas.addPath({
    d: config.path,
    'data-code': config.code
  }, config.style, config.canvas.rootElement);
  this.shape.addClass('jvectormap-region jvectormap-element');

  bbox = this.shape.getBBox();

  text = this.getLabelText(config.code);
  if (this.config.label && text) {
    offsets = this.getLabelOffsets(config.code);
    this.labelX = bbox.x + bbox.width / 2 + offsets[0];
    this.labelY = bbox.y + bbox.height / 2 + offsets[1];
    this.label = config.canvas.addText({
      text: text,
      'text-anchor': 'middle',
      'alignment-baseline': 'central',
      x: this.labelX,
      y: this.labelY,
      'data-code': config.code
    }, config.labelStyle, config.labelsGroup);
    this.label.addClass('jvectormap-region jvectormap-element');
  }
};

jvm.inherits(jvm.Region, jvm.MapObject);

jvm.Region.prototype.updateLabelPosition = function(){
  if (this.label) {
    this.label.set({
      x: this.labelX * this.map.scale + this.map.transX * this.map.scale,
      y: this.labelY * this.map.scale + this.map.transY * this.map.scale
    });
  }
};jvm.Marker = function(config){
  var text,
      offsets;

  this.config = config;
  this.map = this.config.map;

  this.isImage = !!this.config.style.initial.image;
  this.createShape();

  text = this.getLabelText(config.index);
  if (this.config.label && text) {
    this.offsets = this.getLabelOffsets(config.index);
    this.labelX = config.cx / this.map.scale - this.map.transX;
    this.labelY = config.cy / this.map.scale - this.map.transY;
    this.label = config.canvas.addText({
      text: text,
      'data-index': config.index,
      dy: "0.6ex",
      x: this.labelX,
      y: this.labelY
    }, config.labelStyle, config.labelsGroup);

    this.label.addClass('jvectormap-marker jvectormap-element');
  }
};

jvm.inherits(jvm.Marker, jvm.MapObject);

jvm.Marker.prototype.createShape = function(){
  var that = this;

  if (this.shape) {
    this.shape.remove();
  }
  this.shape = this.config.canvas[this.isImage ? 'addImage' : 'addCircle']({
    "data-index": this.config.index,
    cx: this.config.cx,
    cy: this.config.cy
  }, this.config.style, this.config.group);

  this.shape.addClass('jvectormap-marker jvectormap-element');

  if (this.isImage) {
    jvm.$(this.shape.node).on('imageloaded', function(){
      that.updateLabelPosition();
    });
  }
};

jvm.Marker.prototype.updateLabelPosition = function(){
  if (this.label) {
    this.label.set({
      x: this.labelX * this.map.scale + this.offsets[0] +
         this.map.transX * this.map.scale + 5 + (this.isImage ? (this.shape.width || 0) / 2 : this.shape.properties.r),
      y: this.labelY * this.map.scale + this.map.transY * this.map.scale + this.offsets[1]
    });
  }
};

jvm.Marker.prototype.setStyle = function(property, value){
  var isImage;

  jvm.Marker.parentClass.prototype.setStyle.apply(this, arguments);

  if (property === 'r') {
    this.updateLabelPosition();
  }

  isImage = !!this.shape.get('image');
  if (isImage != this.isImage) {
    this.isImage = isImage;
    this.config.style = jvm.$.extend(true, {}, this.shape.style);
    this.createShape();
  }
};/**
 * Creates map, draws paths, binds events.
 * @constructor
 * @param {Object} params Parameters to initialize map with.
 * @param {String} params.map Name of the map in the format <code>territory_proj_lang</code> where <code>territory</code> is a unique code or name of the territory which the map represents (ISO 3166 standard is used where possible), <code>proj</code> is a name of projection used to generate representation of the map on the plane (projections are named according to the conventions of proj4 utility) and <code>lang</code> is a code of the language, used for the names of regions.
 * @param {String} params.backgroundColor Background color of the map in CSS format.
 * @param {Boolean} params.zoomOnScroll When set to true map could be zoomed using mouse scroll. Default value is <code>true</code>.
 * @param {Boolean} params.zoomOnScrollSpeed Mouse scroll speed. Number from 1 to 10. Default value is <code>3</code>.
 * @param {Boolean} params.panOnDrag When set to true, the map pans when being dragged. Default value is <code>true</code>.
 * @param {Number} params.zoomMax Indicates the maximum zoom ratio which could be reached zooming the map. Default value is <code>8</code>.
 * @param {Number} params.zoomMin Indicates the minimum zoom ratio which could be reached zooming the map. Default value is <code>1</code>.
 * @param {Number} params.zoomStep Indicates the multiplier used to zoom map with +/- buttons. Default value is <code>1.6</code>.
 * @param {Boolean} params.zoomAnimate Indicates whether or not to animate changing of map zoom with zoom buttons.
 * @param {Boolean} params.regionsSelectable When set to true regions of the map could be selected. Default value is <code>false</code>.
 * @param {Boolean} params.regionsSelectableOne Allow only one region to be selected at the moment. Default value is <code>false</code>.
 * @param {Boolean} params.markersSelectable When set to true markers on the map could be selected. Default value is <code>false</code>.
 * @param {Boolean} params.markersSelectableOne Allow only one marker to be selected at the moment. Default value is <code>false</code>.
 * @param {Object} params.regionStyle Set the styles for the map's regions. Each region or marker has four states: <code>initial</code> (default state), <code>hover</code> (when the mouse cursor is over the region or marker), <code>selected</code> (when region or marker is selected), <code>selectedHover</code> (when the mouse cursor is over the region or marker and it's selected simultaneously). Styles could be set for each of this states. Default value for that parameter is:
<pre>{
  initial: {
    fill: 'white',
    "fill-opacity": 1,
    stroke: 'none',
    "stroke-width": 0,
    "stroke-opacity": 1
  },
  hover: {
    "fill-opacity": 0.8,
    cursor: 'pointer'
  },
  selected: {
    fill: 'yellow'
  },
  selectedHover: {
  }
}</pre>
* @param {Object} params.regionLabelStyle Set the styles for the regions' labels. Each region or marker has four states: <code>initial</code> (default state), <code>hover</code> (when the mouse cursor is over the region or marker), <code>selected</code> (when region or marker is selected), <code>selectedHover</code> (when the mouse cursor is over the region or marker and it's selected simultaneously). Styles could be set for each of this states. Default value for that parameter is:
<pre>{
  initial: {
    'font-family': 'Verdana',
    'font-size': '12',
    'font-weight': 'bold',
    cursor: 'default',
    fill: 'black'
  },
  hover: {
    cursor: 'pointer'
  }
}</pre>
 * @param {Object} params.markerStyle Set the styles for the map's markers. Any parameter suitable for <code>regionStyle</code> could be used as well as numeric parameter <code>r</code> to set the marker's radius. Default value for that parameter is:
<pre>{
  initial: {
    fill: 'grey',
    stroke: '#505050',
    "fill-opacity": 1,
    "stroke-width": 1,
    "stroke-opacity": 1,
    r: 5
  },
  hover: {
    stroke: 'black',
    "stroke-width": 2,
    cursor: 'pointer'
  },
  selected: {
    fill: 'blue'
  },
  selectedHover: {
  }
}</pre>
 * @param {Object} params.markerLabelStyle Set the styles for the markers' labels. Default value for that parameter is:
<pre>{
  initial: {
    'font-family': 'Verdana',
    'font-size': '12',
    'font-weight': 'bold',
    cursor: 'default',
    fill: 'black'
  },
  hover: {
    cursor: 'pointer'
  }
}</pre>
 * @param {Object|Array} params.markers Set of markers to add to the map during initialization. In case of array is provided, codes of markers will be set as string representations of array indexes. Each marker is represented by <code>latLng</code> (array of two numeric values), <code>name</code> (string which will be show on marker's tip) and any marker styles.
 * @param {Object} params.series Object with two keys: <code>markers</code> and <code>regions</code>. Each of which is an array of series configs to be applied to the respective map elements. See <a href="jvm.DataSeries.html">DataSeries</a> description for a list of parameters available.
 * @param {Object|String} params.focusOn This parameter sets the initial position and scale of the map viewport. See <code>setFocus</code> docuemntation for possible parameters.
 * @param {Object} params.labels Defines parameters for rendering static labels. Object could contain two keys: <code>regions</code> and <code>markers</code>. Each key value defines configuration object with the following possible options:
<ul>
  <li><code>render {Function}</code> - defines method for converting region code or marker index to actual label value.</li>
  <li><code>offsets {Object|Function}</code> - provides method or object which could be used to define label offset by region code or marker index.</li>
</ul>
<b>Plase note: static labels feature is not supported in Internet Explorer 8 and below.</b>
 * @param {Array|Object|String} params.selectedRegions Set initially selected regions.
 * @param {Array|Object|String} params.selectedMarkers Set initially selected markers.
 * @param {Function} params.onRegionTipShow <code>(Event e, Object tip, String code)</code> Will be called right before the region tip is going to be shown.
 * @param {Function} params.onRegionOver <code>(Event e, String code)</code> Will be called on region mouse over event.
 * @param {Function} params.onRegionOut <code>(Event e, String code)</code> Will be called on region mouse out event.
 * @param {Function} params.onRegionClick <code>(Event e, String code)</code> Will be called on region click event.
 * @param {Function} params.onRegionSelected <code>(Event e, String code, Boolean isSelected, Array selectedRegions)</code> Will be called when region is (de)selected. <code>isSelected</code> parameter of the callback indicates whether region is selected or not. <code>selectedRegions</code> contains codes of all currently selected regions.
 * @param {Function} params.onMarkerTipShow <code>(Event e, Object tip, String code)</code> Will be called right before the marker tip is going to be shown.
 * @param {Function} params.onMarkerOver <code>(Event e, String code)</code> Will be called on marker mouse over event.
 * @param {Function} params.onMarkerOut <code>(Event e, String code)</code> Will be called on marker mouse out event.
 * @param {Function} params.onMarkerClick <code>(Event e, String code)</code> Will be called on marker click event.
 * @param {Function} params.onMarkerSelected <code>(Event e, String code, Boolean isSelected, Array selectedMarkers)</code> Will be called when marker is (de)selected. <code>isSelected</code> parameter of the callback indicates whether marker is selected or not. <code>selectedMarkers</code> contains codes of all currently selected markers.
 * @param {Function} params.onViewportChange <code>(Event e, Number scale)</code> Triggered when the map's viewport is changed (map was panned or zoomed).
 */
jvm.Map = function(params) {
  var map = this,
      e;

  this.params = jvm.$.extend(true, {}, jvm.Map.defaultParams, params);

  if (!jvm.Map.maps[this.params.map]) {
    throw new Error('Attempt to use map which was not loaded: '+this.params.map);
  }

  this.mapData = jvm.Map.maps[this.params.map];
  this.markers = {};
  this.regions = {};
  this.regionsColors = {};
  this.regionsData = {};

  this.container = jvm.$('<div>').addClass('jvectormap-container');
  if (this.params.container) {
    this.params.container.append( this.container );
  }
  this.container.data('mapObject', this);

  this.defaultWidth = this.mapData.width;
  this.defaultHeight = this.mapData.height;

  this.setBackgroundColor(this.params.backgroundColor);

  this.onResize = function(){
    map.updateSize();
  }
  jvm.$(window).resize(this.onResize);

  for (e in jvm.Map.apiEvents) {
    if (this.params[e]) {
      this.container.bind(jvm.Map.apiEvents[e]+'.jvectormap', this.params[e]);
    }
  }

  this.canvas = new jvm.VectorCanvas(this.container[0], this.width, this.height);

  if (this.params.bindTouchEvents) {
    if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)) {
      this.bindContainerTouchEvents();
    } else if (window.MSGesture) {
      this.bindContainerPointerEvents();
    }
  }
  this.bindContainerEvents();
  this.bindElementEvents();
  this.createTip();
  if (this.params.zoomButtons) {
    this.bindZoomButtons();
  }

  this.createRegions();
  this.createMarkers(this.params.markers || {});

  this.updateSize();

  if (this.params.focusOn) {
    if (typeof this.params.focusOn === 'string') {
      this.params.focusOn = {region: this.params.focusOn};
    } else if (jvm.$.isArray(this.params.focusOn)) {
      this.params.focusOn = {regions: this.params.focusOn};
    }
    this.setFocus(this.params.focusOn);
  }

  if (this.params.selectedRegions) {
    this.setSelectedRegions(this.params.selectedRegions);
  }
  if (this.params.selectedMarkers) {
    this.setSelectedMarkers(this.params.selectedMarkers);
  }

  this.legendCntHorizontal = jvm.$('<div/>').addClass('jvectormap-legend-cnt jvectormap-legend-cnt-h');
  this.legendCntVertical = jvm.$('<div/>').addClass('jvectormap-legend-cnt jvectormap-legend-cnt-v');
  this.container.append(this.legendCntHorizontal);
  this.container.append(this.legendCntVertical);

  if (this.params.series) {
    this.createSeries();
  }
};

jvm.Map.prototype = {
  transX: 0,
  transY: 0,
  scale: 1,
  baseTransX: 0,
  baseTransY: 0,
  baseScale: 1,

  width: 0,
  height: 0,

  /**
   * Set background color of the map.
   * @param {String} backgroundColor Background color in CSS format.
   */
  setBackgroundColor: function(backgroundColor) {
    this.container.css('background-color', backgroundColor);
  },

  resize: function() {
    var curBaseScale = this.baseScale;
    if (this.width / this.height > this.defaultWidth / this.defaultHeight) {
      this.baseScale = this.height / this.defaultHeight;
      this.baseTransX = Math.abs(this.width - this.defaultWidth * this.baseScale) / (2 * this.baseScale);
    } else {
      this.baseScale = this.width / this.defaultWidth;
      this.baseTransY = Math.abs(this.height - this.defaultHeight * this.baseScale) / (2 * this.baseScale);
    }
    this.scale *= this.baseScale / curBaseScale;
    this.transX *= this.baseScale / curBaseScale;
    this.transY *= this.baseScale / curBaseScale;
  },

  /**
   * Synchronize the size of the map with the size of the container. Suitable in situations where the size of the container is changed programmatically or container is shown after it became visible.
   */
  updateSize: function(){
    this.width = this.container.width();
    this.height = this.container.height();
    this.resize();
    this.canvas.setSize(this.width, this.height);
    this.applyTransform();
  },

  /**
   * Reset all the series and show the map with the initial zoom.
   */
  reset: function() {
    var key,
        i;

    for (key in this.series) {
      for (i = 0; i < this.series[key].length; i++) {
        this.series[key][i].clear();
      }
    }
    this.scale = this.baseScale;
    this.transX = this.baseTransX;
    this.transY = this.baseTransY;
    this.applyTransform();
  },

  applyTransform: function() {
    var maxTransX,
        maxTransY,
        minTransX,
        minTransY;

    if (this.defaultWidth * this.scale <= this.width) {
      maxTransX = (this.width - this.defaultWidth * this.scale) / (2 * this.scale);
      minTransX = (this.width - this.defaultWidth * this.scale) / (2 * this.scale);
    } else {
      maxTransX = 0;
      minTransX = (this.width - this.defaultWidth * this.scale) / this.scale;
    }

    if (this.defaultHeight * this.scale <= this.height) {
      maxTransY = (this.height - this.defaultHeight * this.scale) / (2 * this.scale);
      minTransY = (this.height - this.defaultHeight * this.scale) / (2 * this.scale);
    } else {
      maxTransY = 0;
      minTransY = (this.height - this.defaultHeight * this.scale) / this.scale;
    }

    if (this.transY > maxTransY) {
      this.transY = maxTransY;
    } else if (this.transY < minTransY) {
      this.transY = minTransY;
    }
    if (this.transX > maxTransX) {
      this.transX = maxTransX;
    } else if (this.transX < minTransX) {
      this.transX = minTransX;
    }

    this.canvas.applyTransformParams(this.scale, this.transX, this.transY);

    if (this.markers) {
      this.repositionMarkers();
    }

    this.repositionLabels();

    this.container.trigger('viewportChange', [this.scale/this.baseScale, this.transX, this.transY]);
  },

  bindContainerEvents: function(){
    var mouseDown = false,
        oldPageX,
        oldPageY,
        map = this;

    if (this.params.panOnDrag) {
      this.container.mousemove(function(e){
        if (mouseDown) {
          map.transX -= (oldPageX - e.pageX) / map.scale;
          map.transY -= (oldPageY - e.pageY) / map.scale;

          map.applyTransform();

          oldPageX = e.pageX;
          oldPageY = e.pageY;
        }
        return false;
      }).mousedown(function(e){
        mouseDown = true;
        oldPageX = e.pageX;
        oldPageY = e.pageY;
        return false;
      });

      this.onContainerMouseUp = function(){
        mouseDown = false;
      };
      jvm.$('body').mouseup(this.onContainerMouseUp);
    }

    if (this.params.zoomOnScroll) {
      this.container.mousewheel(function(event, delta, deltaX, deltaY) {
        var offset = jvm.$(map.container).offset(),
            centerX = event.pageX - offset.left,
            centerY = event.pageY - offset.top,
            zoomStep = Math.pow(1 + map.params.zoomOnScrollSpeed / 1000, event.deltaFactor * event.deltaY);

        map.tip.hide();

        map.setScale(map.scale * zoomStep, centerX, centerY);
        event.preventDefault();
      });
    }
  },

  bindContainerTouchEvents: function(){
    var touchStartScale,
        touchStartDistance,
        map = this,
        touchX,
        touchY,
        centerTouchX,
        centerTouchY,
        lastTouchesLength,
        handleTouchEvent = function(e){
          var touches = e.originalEvent.touches,
              offset,
              scale,
              transXOld,
              transYOld;

          if (e.type == 'touchstart') {
            lastTouchesLength = 0;
          }

          if (touches.length == 1) {
            if (lastTouchesLength == 1) {
              transXOld = map.transX;
              transYOld = map.transY;
              map.transX -= (touchX - touches[0].pageX) / map.scale;
              map.transY -= (touchY - touches[0].pageY) / map.scale;
              map.applyTransform();
              map.tip.hide();
              if (transXOld != map.transX || transYOld != map.transY) {
                e.preventDefault();
              }
            }
            touchX = touches[0].pageX;
            touchY = touches[0].pageY;
          } else if (touches.length == 2) {
            if (lastTouchesLength == 2) {
              scale = Math.sqrt(
                Math.pow(touches[0].pageX - touches[1].pageX, 2) +
                Math.pow(touches[0].pageY - touches[1].pageY, 2)
              ) / touchStartDistance;
              map.setScale(
                touchStartScale * scale,
                centerTouchX,
                centerTouchY
              )
              map.tip.hide();
              e.preventDefault();
            } else {
              offset = jvm.$(map.container).offset();
              if (touches[0].pageX > touches[1].pageX) {
                centerTouchX = touches[1].pageX + (touches[0].pageX - touches[1].pageX) / 2;
              } else {
                centerTouchX = touches[0].pageX + (touches[1].pageX - touches[0].pageX) / 2;
              }
              if (touches[0].pageY > touches[1].pageY) {
                centerTouchY = touches[1].pageY + (touches[0].pageY - touches[1].pageY) / 2;
              } else {
                centerTouchY = touches[0].pageY + (touches[1].pageY - touches[0].pageY) / 2;
              }
              centerTouchX -= offset.left;
              centerTouchY -= offset.top;
              touchStartScale = map.scale;
              touchStartDistance = Math.sqrt(
                Math.pow(touches[0].pageX - touches[1].pageX, 2) +
                Math.pow(touches[0].pageY - touches[1].pageY, 2)
              );
            }
          }

          lastTouchesLength = touches.length;
        };

    jvm.$(this.container).bind('touchstart', handleTouchEvent);
    jvm.$(this.container).bind('touchmove', handleTouchEvent);
  },

  bindContainerPointerEvents: function(){
    var map = this,
        gesture = new MSGesture(),
        element = this.container[0],
        handlePointerDownEvent = function(e){
          gesture.addPointer(e.pointerId);
        },
        handleGestureEvent = function(e){
          var offset,
              scale,
              transXOld,
              transYOld;

          if (e.translationX != 0 || e.translationY != 0) {
            transXOld = map.transX;
            transYOld = map.transY;
            map.transX += e.translationX / map.scale;
            map.transY += e.translationY / map.scale;
            map.applyTransform();
            map.tip.hide();
            if (transXOld != map.transX || transYOld != map.transY) {
              e.preventDefault();
            }
          }
          if (e.scale != 1) {
            map.setScale(
              map.scale * e.scale,
              e.offsetX,
              e.offsetY
            )
            map.tip.hide();
            e.preventDefault();
          }
        };

    gesture.target = element;
    element.addEventListener("MSGestureChange", handleGestureEvent, false);
    element.addEventListener("pointerdown", handlePointerDownEvent, false);
  },

  bindElementEvents: function(){
    var map = this,
        pageX,
        pageY,
        mouseMoved;

    this.container.mousemove(function(e){
      if (Math.abs(pageX - e.pageX) + Math.abs(pageY - e.pageY) > 2) {
        mouseMoved = true;
      }
    });

    /* Can not use common class selectors here because of the bug in jQuery
       SVG handling, use with caution. */
    this.container.delegate("[class~='jvectormap-element']", 'mouseover mouseout', function(e){
      var baseVal = jvm.$(this).attr('class').baseVal || jvm.$(this).attr('class'),
          type = baseVal.indexOf('jvectormap-region') === -1 ? 'marker' : 'region',
          code = type == 'region' ? jvm.$(this).attr('data-code') : jvm.$(this).attr('data-index'),
          element = type == 'region' ? map.regions[code].element : map.markers[code].element,
          tipText = type == 'region' ? map.mapData.paths[code].name : (map.markers[code].config.name || ''),
          tipShowEvent = jvm.$.Event(type+'TipShow.jvectormap'),
          overEvent = jvm.$.Event(type+'Over.jvectormap');

      if (e.type == 'mouseover') {
        map.container.trigger(overEvent, [code]);
        if (!overEvent.isDefaultPrevented()) {
          element.setHovered(true);
        }

        map.tip.text(tipText);
        map.container.trigger(tipShowEvent, [map.tip, code]);
        if (!tipShowEvent.isDefaultPrevented()) {
          map.tip.show();
          map.tipWidth = map.tip.width();
          map.tipHeight = map.tip.height();
        }
      } else {
        element.setHovered(false);
        map.tip.hide();
        map.container.trigger(type+'Out.jvectormap', [code]);
      }
    });

    /* Can not use common class selectors here because of the bug in jQuery
       SVG handling, use with caution. */
    this.container.delegate("[class~='jvectormap-element']", 'mousedown', function(e){
      pageX = e.pageX;
      pageY = e.pageY;
      mouseMoved = false;
    });

    /* Can not use common class selectors here because of the bug in jQuery
       SVG handling, use with caution. */
    this.container.delegate("[class~='jvectormap-element']", 'mouseup', function(){
      var baseVal = jvm.$(this).attr('class').baseVal ? jvm.$(this).attr('class').baseVal : jvm.$(this).attr('class'),
          type = baseVal.indexOf('jvectormap-region') === -1 ? 'marker' : 'region',
          code = type == 'region' ? jvm.$(this).attr('data-code') : jvm.$(this).attr('data-index'),
          clickEvent = jvm.$.Event(type+'Click.jvectormap'),
          element = type == 'region' ? map.regions[code].element : map.markers[code].element;

      if (!mouseMoved) {
        map.container.trigger(clickEvent, [code]);
        if ((type === 'region' && map.params.regionsSelectable) || (type === 'marker' && map.params.markersSelectable)) {
          if (!clickEvent.isDefaultPrevented()) {
            if (map.params[type+'sSelectableOne']) {
              map.clearSelected(type+'s');
            }
            element.setSelected(!element.isSelected);
          }
        }
      }
    });
  },

  bindZoomButtons: function() {
    var map = this;

    jvm.$('<div/>').addClass('jvectormap-zoomin').text('+').appendTo(this.container);
    jvm.$('<div/>').addClass('jvectormap-zoomout').html('&#x2212;').appendTo(this.container);

    this.container.find('.jvectormap-zoomin').click(function(){
      map.setScale(map.scale * map.params.zoomStep, map.width / 2, map.height / 2, false, map.params.zoomAnimate);
    });
    this.container.find('.jvectormap-zoomout').click(function(){
      map.setScale(map.scale / map.params.zoomStep, map.width / 2, map.height / 2, false, map.params.zoomAnimate);
    });
  },

  createTip: function(){
    var map = this;

    this.tip = jvm.$('<div/>').addClass('jvectormap-tip').appendTo(jvm.$('body'));

    this.container.mousemove(function(e){
      var left = e.pageX-15-map.tipWidth,
          top = e.pageY-15-map.tipHeight;

      if (left < 5) {
        left = e.pageX + 15;
      }
      if (top < 5) {
        top = e.pageY + 15;
      }

      map.tip.css({
        left: left,
        top: top
      });
    });
  },

  setScale: function(scale, anchorX, anchorY, isCentered, animate) {
    var viewportChangeEvent = jvm.$.Event('zoom.jvectormap'),
        interval,
        that = this,
        i = 0,
        count = Math.abs(Math.round((scale - this.scale) * 60 / Math.max(scale, this.scale))),
        scaleStart,
        scaleDiff,
        transXStart,
        transXDiff,
        transYStart,
        transYDiff,
        transX,
        transY,
        deferred = new jvm.$.Deferred();

    if (scale > this.params.zoomMax * this.baseScale) {
      scale = this.params.zoomMax * this.baseScale;
    } else if (scale < this.params.zoomMin * this.baseScale) {
      scale = this.params.zoomMin * this.baseScale;
    }

    if (typeof anchorX != 'undefined' && typeof anchorY != 'undefined') {
      zoomStep = scale / this.scale;
      if (isCentered) {
        transX = anchorX + this.defaultWidth * (this.width / (this.defaultWidth * scale)) / 2;
        transY = anchorY + this.defaultHeight * (this.height / (this.defaultHeight * scale)) / 2;
      } else {
        transX = this.transX - (zoomStep - 1) / scale * anchorX;
        transY = this.transY - (zoomStep - 1) / scale * anchorY;
      }
    }

    if (animate && count > 0)  {
      scaleStart = this.scale;
      scaleDiff = (scale - scaleStart) / count;
      transXStart = this.transX * this.scale;
      transYStart = this.transY * this.scale;
      transXDiff = (transX * scale - transXStart) / count;
      transYDiff = (transY * scale - transYStart) / count;
      interval = setInterval(function(){
        i += 1;
        that.scale = scaleStart + scaleDiff * i;
        that.transX = (transXStart + transXDiff * i) / that.scale;
        that.transY = (transYStart + transYDiff * i) / that.scale;
        that.applyTransform();
        if (i == count) {
          clearInterval(interval);
          that.container.trigger(viewportChangeEvent, [scale/that.baseScale]);
          deferred.resolve();
        }
      }, 10);
    } else {
      this.transX = transX;
      this.transY = transY;
      this.scale = scale;
      this.applyTransform();
      this.container.trigger(viewportChangeEvent, [scale/this.baseScale]);
      deferred.resolve();
    }

    return deferred;
  },

  /**
   * Set the map's viewport to the specific point and set zoom of the map to the specific level. Point and zoom level could be defined in two ways: using the code of some region to focus on or a central point and zoom level as numbers.
   * @param This method takes a configuration object as the single argument. The options passed to it are the following:
   * @param {Array} params.regions Array of region codes to zoom to.
   * @param {String} params.region Region code to zoom to.
   * @param {Number} params.scale Map scale to set.
   * @param {Number} params.lat Latitude to set viewport to.
   * @param {Number} params.lng Longitude to set viewport to.
   * @param {Number} params.x Number from 0 to 1 specifying the horizontal coordinate of the central point of the viewport.
   * @param {Number} params.y Number from 0 to 1 specifying the vertical coordinate of the central point of the viewport.
   * @param {Boolean} params.animate Indicates whether or not to animate the scale change and transition.
   */
  setFocus: function(config){
    var bbox,
        itemBbox,
        newBbox,
        codes,
        i,
        point;

    config = config || {};

    if (config.region) {
      codes = [config.region];
    } else if (config.regions) {
      codes = config.regions;
    }

    if (codes) {
      for (i = 0; i < codes.length; i++) {
        if (this.regions[codes[i]]) {
          itemBbox = this.regions[codes[i]].element.shape.getBBox();
          if (itemBbox) {
            if (typeof bbox == 'undefined') {
              bbox = itemBbox;
            } else {
              newBbox = {
                x: Math.min(bbox.x, itemBbox.x),
                y: Math.min(bbox.y, itemBbox.y),
                width: Math.max(bbox.x + bbox.width, itemBbox.x + itemBbox.width) - Math.min(bbox.x, itemBbox.x),
                height: Math.max(bbox.y + bbox.height, itemBbox.y + itemBbox.height) - Math.min(bbox.y, itemBbox.y)
              }
              bbox = newBbox;
            }
          }
        }
      }
      return this.setScale(
        Math.min(this.width / bbox.width, this.height / bbox.height),
        - (bbox.x + bbox.width / 2),
        - (bbox.y + bbox.height / 2),
        true,
        config.animate
      );
    } else {
      if (config.lat && config.lng) {
        point = this.latLngToPoint(config.lat, config.lng);
        config.x = this.transX - point.x / this.scale;
        config.y = this.transY - point.y / this.scale;
      } else if (config.x && config.y) {
        config.x *= -this.defaultWidth;
        config.y *= -this.defaultHeight;
      }
      return this.setScale(config.scale * this.baseScale, config.x, config.y, true, config.animate);
    }
  },

  getSelected: function(type){
    var key,
        selected = [];

    for (key in this[type]) {
      if (this[type][key].element.isSelected) {
        selected.push(key);
      }
    }
    return selected;
  },

  /**
   * Return the codes of currently selected regions.
   * @returns {Array}
   */
  getSelectedRegions: function(){
    return this.getSelected('regions');
  },

  /**
   * Return the codes of currently selected markers.
   * @returns {Array}
   */
  getSelectedMarkers: function(){
    return this.getSelected('markers');
  },

  setSelected: function(type, keys){
    var i;

    if (typeof keys != 'object') {
      keys = [keys];
    }

    if (jvm.$.isArray(keys)) {
      for (i = 0; i < keys.length; i++) {
        this[type][keys[i]].element.setSelected(true);
      }
    } else {
      for (i in keys) {
        this[type][i].element.setSelected(!!keys[i]);
      }
    }
  },

  /**
   * Set or remove selected state for the regions.
   * @param {String|Array|Object} keys If <code>String</code> or <code>Array</code> the region(s) with the corresponding code(s) will be selected. If <code>Object</code> was provided its keys are  codes of regions, state of which should be changed. Selected state will be set if value is true, removed otherwise.
   */
  setSelectedRegions: function(keys){
    this.setSelected('regions', keys);
  },

  /**
   * Set or remove selected state for the markers.
   * @param {String|Array|Object} keys If <code>String</code> or <code>Array</code> the marker(s) with the corresponding code(s) will be selected. If <code>Object</code> was provided its keys are  codes of markers, state of which should be changed. Selected state will be set if value is true, removed otherwise.
   */
  setSelectedMarkers: function(keys){
    this.setSelected('markers', keys);
  },

  clearSelected: function(type){
    var select = {},
        selected = this.getSelected(type),
        i;

    for (i = 0; i < selected.length; i++) {
      select[selected[i]] = false;
    };

    this.setSelected(type, select);
  },

  /**
   * Remove the selected state from all the currently selected regions.
   */
  clearSelectedRegions: function(){
    this.clearSelected('regions');
  },

  /**
   * Remove the selected state from all the currently selected markers.
   */
  clearSelectedMarkers: function(){
    this.clearSelected('markers');
  },

  /**
   * Return the instance of Map. Useful when instantiated as a jQuery plug-in.
   * @returns {Map}
   */
  getMapObject: function(){
    return this;
  },

  /**
   * Return the name of the region by region code.
   * @returns {String}
   */
  getRegionName: function(code){
    return this.mapData.paths[code].name;
  },

  createRegions: function(){
    var key,
        region,
        map = this;

    this.regionLabelsGroup = this.regionLabelsGroup || this.canvas.addGroup();

    for (key in this.mapData.paths) {
      region = new jvm.Region({
        map: this,
        path: this.mapData.paths[key].path,
        code: key,
        style: jvm.$.extend(true, {}, this.params.regionStyle),
        labelStyle: jvm.$.extend(true, {}, this.params.regionLabelStyle),
        canvas: this.canvas,
        labelsGroup: this.regionLabelsGroup,
        label: this.canvas.mode != 'vml' ? (this.params.labels && this.params.labels.regions) : null
      });

      jvm.$(region.shape).bind('selected', function(e, isSelected){
        map.container.trigger('regionSelected.jvectormap', [jvm.$(this.node).attr('data-code'), isSelected, map.getSelectedRegions()]);
      });
      this.regions[key] = {
        element: region,
        config: this.mapData.paths[key]
      };
    }
  },

  createMarkers: function(markers) {
    var i,
        marker,
        point,
        markerConfig,
        markersArray,
        map = this;

    this.markersGroup = this.markersGroup || this.canvas.addGroup();
    this.markerLabelsGroup = this.markerLabelsGroup || this.canvas.addGroup();

    if (jvm.$.isArray(markers)) {
      markersArray = markers.slice();
      markers = {};
      for (i = 0; i < markersArray.length; i++) {
        markers[i] = markersArray[i];
      }
    }

    for (i in markers) {
      markerConfig = markers[i] instanceof Array ? {latLng: markers[i]} : markers[i];
      point = this.getMarkerPosition( markerConfig );

      if (point !== false) {
        marker = new jvm.Marker({
          map: this,
          style: jvm.$.extend(true, {}, this.params.markerStyle, {initial: markerConfig.style || {}}),
          labelStyle: jvm.$.extend(true, {}, this.params.markerLabelStyle),
          index: i,
          cx: point.x,
          cy: point.y,
          group: this.markersGroup,
          canvas: this.canvas,
          labelsGroup: this.markerLabelsGroup,
          label: this.canvas.mode != 'vml' ? (this.params.labels && this.params.labels.markers) : null
        });

        jvm.$(marker.shape).bind('selected', function(e, isSelected){
          map.container.trigger('markerSelected.jvectormap', [jvm.$(this.node).attr('data-index'), isSelected, map.getSelectedMarkers()]);
        });
        if (this.markers[i]) {
          this.removeMarkers([i]);
        }
        this.markers[i] = {element: marker, config: markerConfig};
      }
    }
  },

  repositionMarkers: function() {
    var i,
        point;

    for (i in this.markers) {
      point = this.getMarkerPosition( this.markers[i].config );
      if (point !== false) {
        this.markers[i].element.setStyle({cx: point.x, cy: point.y});
      }
    }
  },

  repositionLabels: function() {
    var key;

    for (key in this.regions) {
      this.regions[key].element.updateLabelPosition();
    }

    for (key in this.markers) {
      this.markers[key].element.updateLabelPosition();
    }
  },

  getMarkerPosition: function(markerConfig) {
    if (jvm.Map.maps[this.params.map].projection) {
      return this.latLngToPoint.apply(this, markerConfig.latLng || [0, 0]);
    } else {
      return {
        x: markerConfig.coords[0]*this.scale + this.transX*this.scale,
        y: markerConfig.coords[1]*this.scale + this.transY*this.scale
      };
    }
  },

  /**
   * Add one marker to the map.
   * @param {String} key Marker unique code.
   * @param {Object} marker Marker configuration parameters.
   * @param {Array} seriesData Values to add to the data series.
   */
  addMarker: function(key, marker, seriesData){
    var markers = {},
        data = [],
        values,
        i,
        seriesData = seriesData || [];

    markers[key] = marker;

    for (i = 0; i < seriesData.length; i++) {
      values = {};
      if (typeof seriesData[i] !== 'undefined') {
        values[key] = seriesData[i];
      }
      data.push(values);
    }
    this.addMarkers(markers, data);
  },

  /**
   * Add set of marker to the map.
   * @param {Object|Array} markers Markers to add to the map. In case of array is provided, codes of markers will be set as string representations of array indexes.
   * @param {Array} seriesData Values to add to the data series.
   */
  addMarkers: function(markers, seriesData){
    var i;

    seriesData = seriesData || [];

    this.createMarkers(markers);
    for (i = 0; i < seriesData.length; i++) {
      this.series.markers[i].setValues(seriesData[i] || {});
    };
  },

  /**
   * Remove some markers from the map.
   * @param {Array} markers Array of marker codes to be removed.
   */
  removeMarkers: function(markers){
    var i;

    for (i = 0; i < markers.length; i++) {
      this.markers[ markers[i] ].element.remove();
      delete this.markers[ markers[i] ];
    };
  },

  /**
   * Remove all markers from the map.
   */
  removeAllMarkers: function(){
    var i,
        markers = [];

    for (i in this.markers) {
      markers.push(i);
    }
    this.removeMarkers(markers)
  },

  /**
   * Converts coordinates expressed as latitude and longitude to the coordinates in pixels on the map.
   * @param {Number} lat Latitide of point in degrees.
   * @param {Number} lng Longitude of point in degrees.
   */
  latLngToPoint: function(lat, lng) {
    var point,
        proj = jvm.Map.maps[this.params.map].projection,
        centralMeridian = proj.centralMeridian,
        inset,
        bbox;

    if (lng < (-180 + centralMeridian)) {
      lng += 360;
    }

    point = jvm.Proj[proj.type](lat, lng, centralMeridian);

    inset = this.getInsetForPoint(point.x, point.y);
    if (inset) {
      bbox = inset.bbox;

      point.x = (point.x - bbox[0].x) / (bbox[1].x - bbox[0].x) * inset.width * this.scale;
      point.y = (point.y - bbox[0].y) / (bbox[1].y - bbox[0].y) * inset.height * this.scale;

      return {
        x: point.x + this.transX*this.scale + inset.left*this.scale,
        y: point.y + this.transY*this.scale + inset.top*this.scale
      };
     } else {
       return false;
     }
  },

  /**
   * Converts cartesian coordinates into coordinates expressed as latitude and longitude.
   * @param {Number} x X-axis of point on map in pixels.
   * @param {Number} y Y-axis of point on map in pixels.
   */
  pointToLatLng: function(x, y) {
    var proj = jvm.Map.maps[this.params.map].projection,
        centralMeridian = proj.centralMeridian,
        insets = jvm.Map.maps[this.params.map].insets,
        i,
        inset,
        bbox,
        nx,
        ny;

    for (i = 0; i < insets.length; i++) {
      inset = insets[i];
      bbox = inset.bbox;

      nx = x - (this.transX*this.scale + inset.left*this.scale);
      ny = y - (this.transY*this.scale + inset.top*this.scale);

      nx = (nx / (inset.width * this.scale)) * (bbox[1].x - bbox[0].x) + bbox[0].x;
      ny = (ny / (inset.height * this.scale)) * (bbox[1].y - bbox[0].y) + bbox[0].y;

      if (nx > bbox[0].x && nx < bbox[1].x && ny > bbox[0].y && ny < bbox[1].y) {
        return jvm.Proj[proj.type + '_inv'](nx, -ny, centralMeridian);
      }
    }

    return false;
  },

  getInsetForPoint: function(x, y){
    var insets = jvm.Map.maps[this.params.map].insets,
        i,
        bbox;

    for (i = 0; i < insets.length; i++) {
      bbox = insets[i].bbox;
      if (x > bbox[0].x && x < bbox[1].x && y > bbox[0].y && y < bbox[1].y) {
        return insets[i];
      }
    }
  },

  createSeries: function(){
    var i,
        key;

    this.series = {
      markers: [],
      regions: []
    };

    for (key in this.params.series) {
      for (i = 0; i < this.params.series[key].length; i++) {
        this.series[key][i] = new jvm.DataSeries(
          this.params.series[key][i],
          this[key],
          this
        );
      }
    }
  },

  /**
   * Gracefully remove the map and and all its accessories, unbind event handlers.
   */
  remove: function(){
    this.tip.remove();
    this.container.remove();
    jvm.$(window).unbind('resize', this.onResize);
    jvm.$('body').unbind('mouseup', this.onContainerMouseUp);
  }
};

jvm.Map.maps = {};
jvm.Map.defaultParams = {
  map: 'world_mill_en',
  backgroundColor: '#505050',
  zoomButtons: true,
  zoomOnScroll: true,
  zoomOnScrollSpeed: 3,
  panOnDrag: true,
  zoomMax: 8,
  zoomMin: 1,
  zoomStep: 1.6,
  zoomAnimate: true,
  regionsSelectable: false,
  markersSelectable: false,
  bindTouchEvents: true,
  regionStyle: {
    initial: {
      fill: 'white',
      "fill-opacity": 1,
      stroke: 'none',
      "stroke-width": 0,
      "stroke-opacity": 1
    },
    hover: {
      "fill-opacity": 0.8,
      cursor: 'pointer'
    },
    selected: {
      fill: 'yellow'
    },
    selectedHover: {
    }
  },
  regionLabelStyle: {
    initial: {
      'font-family': 'Verdana',
      'font-size': '12',
      'font-weight': 'bold',
      cursor: 'default',
      fill: 'black'
    },
    hover: {
      cursor: 'pointer'
    }
  },
  markerStyle: {
    initial: {
      fill: 'grey',
      stroke: '#505050',
      "fill-opacity": 1,
      "stroke-width": 1,
      "stroke-opacity": 1,
      r: 5
    },
    hover: {
      stroke: 'black',
      "stroke-width": 2,
      cursor: 'pointer'
    },
    selected: {
      fill: 'blue'
    },
    selectedHover: {
    }
  },
  markerLabelStyle: {
    initial: {
      'font-family': 'Verdana',
      'font-size': '12',
      'font-weight': 'bold',
      cursor: 'default',
      fill: 'black'
    },
    hover: {
      cursor: 'pointer'
    }
  }
};
jvm.Map.apiEvents = {
  onRegionTipShow: 'regionTipShow',
  onRegionOver: 'regionOver',
  onRegionOut: 'regionOut',
  onRegionClick: 'regionClick',
  onRegionSelected: 'regionSelected',
  onMarkerTipShow: 'markerTipShow',
  onMarkerOver: 'markerOver',
  onMarkerOut: 'markerOut',
  onMarkerClick: 'markerClick',
  onMarkerSelected: 'markerSelected',
  onViewportChange: 'viewportChange'
};/**
 * Creates map with drill-down functionality.
 * @constructor
 * @param {Object} params Parameters to initialize map with.
 * @param {Number} params.maxLevel Maximum number of levels user can go through
 * @param {Object} params.main Config of the main map. See <a href="./jvm-map/">jvm.Map</a> for more information.
 * @param {Function} params.mapNameByCode Function go generate map name by region code. Default value is:
<pre>
function(code, multiMap) {
  return code.toLowerCase()+'_'+
         multiMap.defaultProjection+'_en';
}
</pre>
 * @param {Function} params.mapUrlByCode Function to generate map url by region code. Default value is:
<pre>
function(code, multiMap){
  return 'jquery-jvectormap-data-'+
         code.toLowerCase()+'-'+
         multiMap.defaultProjection+'-en.js';
}
</pre>
 */
jvm.MultiMap = function(params) {
  var that = this;

  this.maps = {};
  this.params = jvm.$.extend(true, {}, jvm.MultiMap.defaultParams, params);
  this.params.maxLevel = this.params.maxLevel || Number.MAX_VALUE;
  this.params.main = this.params.main || {};
  this.params.main.multiMapLevel = 0;
  this.history = [ this.addMap(this.params.main.map, this.params.main) ];
  this.defaultProjection = this.history[0].mapData.projection.type;
  this.mapsLoaded = {};

  this.params.container.css({position: 'relative'});
  this.backButton = jvm.$('<div/>').addClass('jvectormap-goback').text('Back').appendTo(this.params.container);
  this.backButton.hide();
  this.backButton.click(function(){
    that.goBack();
  });

  this.spinner = jvm.$('<div/>').addClass('jvectormap-spinner').appendTo(this.params.container);
  this.spinner.hide();
};

jvm.MultiMap.prototype = {
  addMap: function(name, config){
    var cnt = jvm.$('<div/>').css({
      width: '100%',
      height: '100%'
    });

    this.params.container.append(cnt);

    this.maps[name] = new jvm.Map(jvm.$.extend(config, {container: cnt}));
    if (this.params.maxLevel > config.multiMapLevel) {
      this.maps[name].container.on('regionClick.jvectormap', {scope: this}, function(e, code){
        var multimap = e.data.scope,
            mapName = multimap.params.mapNameByCode(code, multimap);

        if (!multimap.drillDownPromise || multimap.drillDownPromise.state() !== 'pending') {
          multimap.drillDown(mapName, code);
        }
      });
    }


    return this.maps[name];
  },

  downloadMap: function(code){
    var that = this,
        deferred = jvm.$.Deferred();

    if (!this.mapsLoaded[code]) {
      jvm.$.get(this.params.mapUrlByCode(code, this)).then(function(){
        that.mapsLoaded[code] = true;
        deferred.resolve();
      }, function(){
        deferred.reject();
      });
    } else {
      deferred.resolve();
    }
    return deferred;
  },

  drillDown: function(name, code){
    var currentMap = this.history[this.history.length - 1],
        that = this,
        focusPromise = currentMap.setFocus({region: code, animate: true}),
        downloadPromise = this.downloadMap(code);

    focusPromise.then(function(){
      if (downloadPromise.state() === 'pending') {
        that.spinner.show();
      }
    });
    downloadPromise.always(function(){
      that.spinner.hide();
    });
    this.drillDownPromise = jvm.$.when(downloadPromise, focusPromise);
    this.drillDownPromise.then(function(){
      currentMap.params.container.hide();
      if (!that.maps[name]) {
        that.addMap(name, {map: name, multiMapLevel: currentMap.params.multiMapLevel + 1});
      } else {
        that.maps[name].params.container.show();
      }
      that.history.push( that.maps[name] );
      that.backButton.show();
    });
  },

  goBack: function(){
    var currentMap = this.history.pop(),
        prevMap = this.history[this.history.length - 1],
        that = this;

    currentMap.setFocus({scale: 1, x: 0.5, y: 0.5, animate: true}).then(function(){
      currentMap.params.container.hide();
      prevMap.params.container.show();
      prevMap.updateSize();
      if (that.history.length === 1) {
        that.backButton.hide();
      }
      prevMap.setFocus({scale: 1, x: 0.5, y: 0.5, animate: true});
    });
  }
};

jvm.MultiMap.defaultParams = {
  mapNameByCode: function(code, multiMap){
    return code.toLowerCase()+'_'+multiMap.defaultProjection+'_en';
  },
  mapUrlByCode: function(code, multiMap){
    return 'jquery-jvectormap-data-'+code.toLowerCase()+'-'+multiMap.defaultProjection+'-en.js';
  }
}



// World_mill_en code 
jQuery.fn.vectorMap('addMap', 'be_mill',{"insets": [{"width": 900, "top": 0, "height": 613.8264117465903, "bbox": [{"y": -6304997.820898261, "x": 280867.8681907376}, {"y": -6012338.384324307, "x": 709968.8124904385}], "left": 0}], "paths": {"BE-VWV": {"path": "M0.52,126.72l4.36,-2.66l8.91,-2.48l31.69,-19.99l48.55,-23.81l46.99,-25.74l51.99,-14.0l1.94,11.45l-0.96,7.67l-0.14,7.38l3.41,7.92l5.67,5.17l1.7,0.8l-7.39,3.87l-0.17,0.53l3.83,7.69l-5.34,3.15l0.1,0.73l6.21,1.7l5.22,7.73l-8.18,12.98l-10.13,5.51l-0.01,0.7l25.85,15.36l-4.48,2.69l-0.12,0.57l6.81,9.76l-5.92,7.36l0.01,0.52l3.61,4.08l-6.68,2.52l-0.26,0.37l0.25,0.38l9.33,3.9l-2.62,-0.04l-0.38,0.26l0.12,0.45l3.19,2.65l-1.13,0.97l-5.35,-0.66l-0.4,0.58l1.69,3.26l-2.89,2.38l-0.11,0.47l1.91,4.24l0.55,0.19l5.26,-2.7l3.3,1.14l1.72,5.34l-5.3,4.54l0.03,0.63l14.09,10.14l-2.7,2.83l-0.01,0.54l5.25,6.01l-0.49,1.88l-24.92,15.46l-10.64,9.3l-0.91,2.17l-3.29,-0.61l-5.46,-3.36l0.23,-4.26l-5.33,-6.07l-9.81,1.24l-9.83,-4.55l-10.4,4.47l-2.55,0.77l-3.72,-5.59l-4.04,-3.23l-6.21,-1.62l-18.36,4.76l-2.11,-10.93l-4.17,-2.3l-13.59,4.6l-0.27,0.32l-0.1,1.71l4.34,4.3l-8.22,2.81l-1.18,2.87l-6.25,1.03l-3.52,-2.53l-1.63,0.41l-6.22,3.2l-0.19,0.5l5.45,14.79l-17.84,-6.83l-4.22,-2.96l-5.66,-10.08l-8.73,-7.01l-1.48,-2.21l-0.75,-2.13l-1.35,-1.93l-3.19,-1.38l-2.3,-0.21l-6.16,0.44l-3.36,-0.59l-1.56,-0.58l-3.22,-5.61l-1.18,-1.08l-2.72,-1.17l-0.59,-0.82l0.2,-1.19l1.78,-3.37l0.29,-2.32l-4.56,-13.37l1.24,-2.59l5.32,-4.44l1.44,-1.92l-0.67,-6.42l-3.8,-4.87l-8.29,-7.67l-2.27,-5.83l-2.34,-13.59l-3.43,-6.87Z", "name": "West Flanders"}, "BE-VAN": {"path": "M390.25,140.12l1.33,-3.43l-0.72,-3.57l-1.36,-3.54l-0.68,-2.82l-0.57,-3.94l0.68,-1.17l2.87,-2.82l4.07,-2.38l4.53,-0.73l9.54,-0.01l9.3,-2.54l3.22,-5.15l1.05,-6.77l-0.58,-2.37l-1.31,-4.06l-5.35,-6.42l1.61,-0.86l0.19,-0.49l-4.9,-13.13l1.32,-2.73l3.02,-1.06l2.0,-1.81l3.44,-6.06l-0.21,-0.57l-7.82,-2.79l-1.67,-1.13l-0.85,-2.55l0.17,-6.64l-0.73,-3.33l-1.83,-2.68l-2.71,-2.79l5.71,0.16l8.38,3.79l4.66,1.32l10.89,0.58l4.63,-2.0l1.36,-5.88l-1.51,-3.16l-5.21,-5.16l-1.72,-2.64l0.16,-2.91l1.47,-2.33l0.53,-2.34l-2.51,-2.56l11.66,-5.65l12.47,-3.81l6.82,-0.93l2.72,0.41l1.68,2.34l-0.3,4.96l-1.94,3.79l-0.47,3.16l0.19,0.4l4.47,2.66l3.36,0.29l6.66,-1.01l7.39,1.55l3.73,-0.19l3.24,-1.01l2.58,-1.59l18.0,-18.38l7.54,-3.23l3.24,0.26l4.17,1.32l3.82,2.09l2.28,2.49l0.48,4.47l-1.43,4.41l-1.04,4.7l1.45,4.81l-9.61,-3.67l-2.96,0.58l-1.33,3.73l0.24,0.51l5.07,1.8l16.31,0.46l4.23,0.95l9.23,3.46l5.21,-1.23l5.94,-4.81l5.38,-6.06l3.67,-5.05l1.66,-3.9l0.79,-2.86l1.27,-1.69l3.22,-0.69l0.6,0.65l6.91,3.82l4.45,7.06l-0.79,4.95l-2.62,5.04l-0.78,6.94l1.58,3.13l7.98,7.35l3.57,9.42l1.16,2.09l4.41,2.06l9.0,-0.65l4.14,0.34l3.89,4.11l0.12,10.87l0.32,0.39l4.0,0.85l-1.51,1.17l-2.55,11.82l0.14,0.4l9.36,7.31l0.74,12.1l-5.53,4.1l-7.37,-1.8l-0.4,0.13l-5.17,6.29l-11.8,0.63l-9.35,9.9l-18.57,3.09l-0.33,0.39l-0.02,4.08l-6.35,7.41l-3.23,-3.04l-4.49,0.25l-9.02,3.03l-6.21,4.57l-2.94,-1.1l-11.99,4.14l-2.74,-1.54l-3.93,-7.17l-0.57,-0.15l-7.5,4.77l-5.36,-0.79l-7.31,6.83l1.47,-2.72l-0.19,-0.55l-6.53,-2.88l-17.03,3.81l-3.22,6.28l-3.24,-0.05l-7.37,-3.61l-0.42,0.04l-4.01,3.13l-7.64,-4.88l-0.53,0.09l-3.98,5.02l-5.24,-4.27l-13.81,2.81l-1.04,-4.2l-4.19,-1.29l2.02,-4.24l-0.09,-0.46l-0.47,-0.06l-7.11,3.97l-0.87,-0.36l1.28,-1.77l-0.18,-0.61l-11.6,-4.34l-5.82,-0.82l-7.79,1.69l-1.83,-1.77l-0.5,-0.04l-4.4,3.03l-2.33,-0.87l-2.26,-1.64Z", "name": "Antwerp"}, "BE-WLX": {"path": "M572.11,521.76l0.6,-1.6l1.0,-4.94l2.77,-0.68l0.28,-0.52l-1.95,-5.7l0.9,-2.39l17.4,-10.53l0.05,-0.65l-3.52,-2.96l5.51,-4.39l11.65,-3.91l0.13,-0.69l-4.89,-4.12l0.84,-6.57l-0.24,-0.42l-6.69,-2.91l-2.08,-3.99l-0.42,-0.21l-9.82,1.66l-2.19,-0.93l-2.96,-9.77l-4.92,-4.13l3.27,0.07l0.39,-0.27l1.45,-4.17l2.07,1.57l2.41,-0.74l7.73,-6.81l2.46,-5.16l-0.1,-0.48l-1.83,-1.57l2.87,-9.79l1.08,6.8l0.28,0.32l5.1,1.47l21.93,-1.29l5.11,-0.92l6.22,-3.67l6.14,0.51l0.41,-0.26l1.18,-3.27l-0.13,-0.45l-5.32,-4.16l6.15,-1.83l2.17,-5.51l-0.09,-0.43l-8.15,-7.97l0.33,-2.93l-0.4,-0.44l-1.96,-0.01l1.99,-2.38l-0.14,-0.62l-8.3,-3.87l3.59,-2.11l6.6,0.36l0.42,-0.46l-0.55,-3.33l4.9,-2.78l2.28,-0.19l2.32,2.54l0.49,0.08l16.51,-8.95l6.5,-5.67l0.32,-5.12l-2.4,-4.88l-0.38,-0.22l-5.41,0.32l-2.93,3.35l-1.09,-0.96l12.24,-7.65l0.08,-0.61l-3.08,-3.37l4.66,-5.22l0.06,-0.45l-1.9,-3.66l7.53,-5.96l0.08,-0.54l-4.53,-6.76l1.16,-1.73l2.77,-0.13l10.03,6.58l0.41,0.02l8.97,-4.95l1.98,5.59l3.83,0.85l-0.61,2.33l1.44,1.4l4.26,0.55l7.73,-3.07l12.47,9.77l7.45,-0.3l-0.94,3.11l0.38,0.52l11.13,0.03l-3.74,7.04l0.28,3.79l3.77,5.36l6.01,1.36l-6.01,10.77l0.4,0.59l13.97,-1.81l3.58,0.95l1.48,2.79l0.71,-0.01l1.42,-2.8l14.9,-1.91l1.52,-3.0l-0.31,-0.58l-7.58,-0.93l4.97,-10.17l-0.13,-0.5l-4.07,-2.91l1.83,-5.01l27.71,5.09l0.6,2.65l7.21,3.12l-1.26,28.31l1.04,3.39l0.32,0.28l4.33,0.73l-2.79,2.96l1.16,3.93l-0.43,8.78l-1.42,-0.58l-1.32,-2.08l-0.76,-2.86l-1.61,-1.57l-0.49,-0.04l-3.51,2.36l-4.87,0.43l-2.33,3.13l-0.96,4.15l-1.81,4.27l-3.36,2.94l-8.63,3.56l-3.95,3.02l-1.0,2.22l-0.46,4.92l-0.55,1.97l-1.34,1.63l-3.36,2.46l-1.49,1.98l0.19,6.59l-0.54,2.24l-1.54,1.38l-4.66,1.74l-1.71,1.97l-0.27,4.21l1.72,1.97l0.8,1.44l-2.4,3.93l-1.8,1.42l-3.36,0.66l-1.76,0.97l-1.94,2.13l-2.41,5.14l-8.07,11.8l-0.99,3.0l0.23,0.49l2.72,1.1l5.08,3.26l1.56,1.99l-5.21,-0.45l-0.43,0.4l0.02,1.69l-1.16,2.65l0.13,0.45l1.78,1.39l-2.44,1.49l-1.06,3.08l0.36,3.74l1.47,3.91l2.64,3.6l2.37,0.97l2.54,0.38l2.83,1.47l1.48,1.85l5.46,9.1l0.92,6.55l1.62,1.08l4.7,1.5l1.3,0.2l1.6,-0.42l1.27,0.08l1.18,1.57l0.28,2.07l-1.98,2.36l-0.48,3.6l-1.03,2.08l0.83,2.49l1.75,1.22l4.75,0.51l1.49,1.07l1.22,4.03l-1.19,2.41l-4.23,3.77l-2.98,6.97l-1.81,2.96l-2.58,2.06l0.08,0.68l3.59,1.67l-2.02,4.3l-5.25,4.74l-5.37,2.17l-2.56,-0.53l-5.07,-2.64l-2.86,-0.32l-2.64,1.23l-2.95,3.3l-2.71,1.0l-4.9,-0.71l-5.05,-2.1l-5.5,-0.99l-5.96,2.61l-2.78,3.21l-0.6,2.28l-0.64,1.0l-3.19,0.36l-1.91,-0.43l-7.58,-2.87l-4.47,1.7l-5.85,3.89l-5.91,2.92l-4.73,-1.06l-1.31,-2.43l0.23,-2.56l0.75,-2.92l0.05,-3.17l-0.99,-2.91l-11.29,-17.29l-4.56,-3.46l-7.21,-2.23l-2.63,-1.33l-1.57,-0.24l-1.2,0.92l-2.18,3.14l-1.46,0.38l-3.67,-0.61l-0.96,-1.01l-0.52,-2.61l0.68,-4.03l1.81,-1.0l1.15,-1.51l-1.62,-4.55l-4.6,-4.82l-4.91,-4.11l-5.39,0.03l-10.46,2.46l-5.23,-1.3l-4.17,-2.62l-3.43,-2.8l-9.92,-12.13l-2.83,-2.3l-8.45,-2.09l-4.58,-2.19l-8.65,-7.21l-4.51,-2.07Z", "name": "Luxembourg"}, "BE-WBR": {"path": "M421.22,237.11l1.13,-1.08l4.47,4.95l4.41,0.27l0.41,-0.29l1.28,-4.39l10.97,-1.42l8.59,-5.57l5.01,-1.32l2.85,0.35l-0.88,3.1l1.21,1.89l7.58,3.7l0.57,-0.31l0.48,-3.52l9.94,-1.96l5.18,-4.64l1.1,5.98l0.41,0.33l7.8,-0.35l4.8,-4.52l0.02,-0.55l-4.15,-4.67l0.89,-7.26l11.76,2.55l3.97,-1.79l0.76,1.91l0.73,0.04l1.95,-3.78l5.98,-1.79l9.54,2.76l4.92,6.84l5.4,0.56l-0.86,2.86l0.42,0.51l17.12,-1.47l-0.74,5.04l0.17,0.39l2.96,2.08l3.99,-0.45l11.25,-7.44l8.37,5.56l-0.7,5.2l-5.37,2.42l-0.14,0.62l5.45,6.52l-3.49,2.31l0.24,8.99l-4.28,6.67l-7.15,-1.36l-5.59,6.01l-6.0,-0.44l-0.43,0.35l-0.21,1.61l-24.76,5.47l-1.37,1.01l-0.14,0.41l0.45,1.79l-1.47,-1.83l-0.44,-0.13l-8.99,2.95l-1.38,-5.75l-0.48,-0.3l-6.04,1.4l-1.2,3.18l-6.1,-3.58l-2.46,-0.04l-2.97,4.17l2.58,9.14l-4.71,0.88l-8.41,-2.5l-4.29,0.46l-4.13,2.67l-0.17,0.4l0.78,4.89l-13.61,4.83l-3.0,-1.13l0.25,-2.55l-0.56,-0.41l-7.09,3.09l0.59,-6.9l-1.52,-2.01l-10.39,0.06l-2.62,-2.12l-13.24,1.19l-5.32,4.87l0.57,-6.78l-0.43,-0.43l-6.68,0.56l-5.75,-7.47l-7.43,-1.4l1.2,-6.01l-0.31,-0.47l-12.09,-2.55l1.02,-6.39l-4.51,-4.97l-0.42,-0.11l-2.75,0.97l-7.25,8.34l-5.17,0.66l-3.84,-1.35l-2.18,-5.18l-0.26,-11.23l0.86,-3.67l4.02,-0.99l0.3,-0.43l-0.39,-0.36l-2.29,-0.06l1.35,-2.31l5.45,0.08l0.36,-0.22l1.63,-3.24l2.03,-0.65l2.01,0.7l4.99,5.8l6.53,0.03l7.5,5.17l0.43,0.01l4.43,-2.69l6.29,1.75l3.81,-1.04l1.73,-1.85l0.57,-4.34l4.76,-0.07l0.31,-0.65l-2.25,-2.79Z", "name": "Walloon Brabant"}, "BE-VBR": {"path": "M321.04,236.0l5.26,1.53l7.56,-1.62l0.31,-0.31l0.23,-1.99l-4.69,-5.35l2.8,-5.11l2.55,-1.21l5.86,3.85l0.51,-0.06l3.75,-3.93l3.37,2.4l4.09,-1.39l7.0,-4.97l3.52,-9.14l-2.38,-4.76l-5.28,-0.82l10.47,-12.69l0.32,-3.48l-3.07,-2.5l5.69,-3.53l0.17,-0.47l-1.8,-5.17l9.91,3.5l5.74,-3.22l0.29,-4.42l-3.25,-8.44l3.31,-5.73l7.27,2.1l5.61,-2.05l5.59,-14.83l7.72,-1.67l5.56,0.81l10.99,4.12l-1.27,1.76l0.17,0.6l1.52,0.62l6.53,-3.48l-1.69,3.55l0.26,0.56l4.14,1.06l1.08,4.35l0.47,0.3l13.99,-2.85l5.07,4.32l0.57,-0.06l4.01,-5.07l7.58,4.84l0.46,-0.02l4.04,-3.15l7.22,3.54l3.76,0.1l0.37,-0.23l2.97,-6.12l16.71,-3.74l5.76,2.62l-2.44,4.5l0.11,0.51l0.52,-0.02l8.96,-8.37l5.25,0.83l7.27,-4.62l3.78,6.9l3.48,1.87l12.01,-4.15l3.11,1.07l6.23,-4.6l8.91,-2.99l4.15,-0.22l3.48,3.21l5.66,-1.29l3.62,5.85l0.46,0.17l4.52,-1.46l5.05,2.43l4.16,-2.17l0.22,-0.36l-0.03,-7.38l6.1,-0.67l5.03,1.91l5.84,6.26l-5.0,1.7l-1.05,-2.14l-0.44,-0.21l-2.29,0.49l-0.31,0.47l1.43,6.92l-9.44,3.61l-0.26,0.36l-0.21,6.62l-9.24,6.84l-0.13,0.49l3.08,6.74l1.68,1.16l4.0,-1.28l3.73,3.41l0.42,0.08l8.62,-3.41l0.68,2.04l0.38,0.27l8.06,0.09l3.08,2.24l-1.95,8.14l-0.86,0.75l-4.34,-1.23l-0.48,0.23l-3.9,9.05l-1.67,10.46l0.28,0.45l4.46,1.32l-10.01,8.65l-0.12,0.43l1.85,5.5l-3.06,6.08l0.18,0.54l4.14,2.05l-4.22,7.54l-5.86,0.83l-3.37,-1.36l-3.68,-3.98l0.12,-5.29l-0.22,-0.37l-5.69,-2.79l-8.78,-5.84l-0.44,-0.0l-11.39,7.53l-3.29,0.43l-2.63,-1.85l0.78,-5.3l-0.43,-0.46l-17.04,1.47l0.83,-2.78l-0.35,-0.51l-5.42,-0.42l-5.1,-6.95l-9.79,-2.83l-6.48,1.88l-1.87,3.35l-0.59,-1.49l-0.54,-0.21l-3.98,1.88l-12.06,-2.61l-0.48,0.34l-0.97,7.87l4.12,4.83l-4.16,4.03l-7.3,0.33l-1.17,-6.35l-0.66,-0.22l-5.43,4.95l-10.12,1.99l-0.32,0.34l-0.44,3.26l-6.85,-3.3l-0.97,-1.3l0.96,-3.36l-0.34,-0.51l-3.54,-0.4l-5.26,1.4l-8.4,5.49l-11.14,1.44l-0.33,0.28l-1.26,4.33l-3.92,-0.24l-4.36,-5.01l-0.58,-0.03l-1.7,1.62l-0.04,0.54l1.97,2.44l-4.28,0.06l-0.39,0.35l-0.6,4.55l-1.45,1.45l-3.21,0.88l-6.35,-1.77l-4.67,2.69l-7.39,-5.1l-6.4,0.04l-4.94,-5.74l-2.66,-0.9l-2.55,0.95l-1.59,3.16l-5.79,0.12l-1.65,2.83l-6.02,-1.7l-0.45,0.17l-3.02,4.72l-1.29,-1.65l-0.48,-0.12l-5.35,2.34l-4.63,-1.12l-4.6,3.08l-13.98,-0.33l-4.82,-1.45l-3.17,-3.46l-1.06,-3.23l1.48,-4.61ZM412.43,197.94l-1.36,4.74l-5.96,0.98l-2.78,4.71l0.18,0.57l8.75,4.07l4.25,-1.7l5.99,10.59l6.61,3.79l5.27,0.82l5.09,-0.97l19.09,-8.53l0.05,-0.71l-7.41,-4.57l1.61,-2.21l4.77,-0.52l0.33,-0.54l-3.71,-9.76l-9.06,-4.95l3.21,-2.76l0.19,-3.49l-3.67,-5.26l-4.13,-2.72l-0.47,0.03l-5.92,4.89l-9.81,-1.38l-8.78,3.63l-4.62,7.45l0.01,0.43l2.28,3.35Z", "name": "Flemish Brabant"}, "BE-VOV": {"path": "M205.45,78.63l4.78,1.82l7.46,0.73l11.15,-1.44l0.34,-0.31l0.68,-2.93l-0.59,-4.02l0.41,-3.37l2.36,-2.02l3.3,-0.68l3.76,-0.19l9.27,-1.73l5.71,-0.28l5.9,0.8l28.49,7.88l4.23,2.31l1.14,3.82l-0.38,3.45l0.5,3.47l3.48,3.44l3.04,1.15l27.89,-0.28l5.35,-1.45l10.62,-6.93l28.91,-12.11l11.65,-7.61l9.35,-10.62l1.32,-3.14l1.81,-7.88l3.93,3.08l1.8,2.97l1.74,5.77l3.86,3.91l4.26,3.1l2.78,2.96l0.81,1.86l0.32,1.75l-0.58,2.02l-1.5,2.05l-0.93,0.65l-1.51,3.42l4.84,12.96l-1.73,0.92l-0.12,0.61l5.61,6.73l1.75,5.93l-1.03,6.61l-2.81,4.62l-9.09,2.48l-9.41,0.0l-4.7,0.76l-4.39,2.55l-2.95,2.89l-0.85,1.44l0.56,4.36l0.7,2.92l1.34,3.46l0.69,3.43l-1.52,3.65l2.84,2.06l2.67,1.02l4.67,-3.01l1.56,1.51l-5.28,14.39l-5.06,1.93l-7.44,-2.15l-0.46,0.18l-3.56,6.17l3.26,8.88l-0.11,3.63l-5.06,2.98l-10.52,-3.71l-0.51,0.51l1.97,5.66l-5.92,3.67l-0.03,0.66l3.2,2.37l-0.2,2.9l-10.83,13.13l0.25,0.65l5.76,0.9l1.92,4.18l-3.29,8.38l-6.86,4.87l-3.72,1.25l-3.11,-2.43l-0.54,0.04l-3.77,3.95l-5.77,-3.79l-3.26,1.33l-3.17,5.64l0.05,0.46l4.75,5.42l-0.24,1.2l-7.2,1.54l-5.17,-1.56l-2.4,-5.14l-0.43,-0.22l-12.99,2.39l-3.26,-2.55l-9.06,0.88l-3.82,-9.38l-0.5,-0.23l-9.79,3.48l-2.29,-3.86l-0.51,-0.16l-6.87,3.29l-9.3,15.07l-6.4,-3.66l-15.1,-0.22l-1.48,-9.36l-0.49,-0.33l-9.19,2.29l-7.63,-2.65l13.87,-8.6l0.76,-2.47l-5.23,-6.26l2.77,-2.9l-0.06,-0.6l-14.05,-10.11l5.12,-4.38l0.12,-0.43l-1.86,-5.78l-4.21,-1.5l-5.03,2.59l-1.61,-3.57l2.9,-2.39l0.1,-0.49l-1.49,-2.87l5.09,0.49l1.62,-1.39l-0.01,-0.61l-2.68,-2.22l3.56,0.05l0.4,-0.32l-0.24,-0.45l-10.32,-4.31l6.28,-2.37l0.16,-0.64l-3.77,-4.26l5.9,-7.34l0.02,-0.48l-6.73,-9.66l4.69,-2.82l-0.0,-0.69l-25.82,-15.34l9.75,-5.36l8.38,-13.29l-0.01,-0.44l-5.44,-8.07l-5.66,-1.65l4.85,-2.86l0.15,-0.52l-3.82,-7.68l7.38,-3.86l0.11,-0.33Z", "name": "East Flanders"}, "BE-WLG": {"path": "M583.69,230.64l4.98,2.44l-0.01,5.48l4.0,4.26l3.75,1.46l6.09,-0.86l15.49,3.83l3.35,-3.15l0.07,-0.46l-2.25,-4.39l13.17,1.4l0.39,-0.2l1.31,-2.26l1.36,2.82l0.54,0.18l7.35,-3.78l7.25,3.32l0.55,-0.24l1.11,-3.36l4.48,-3.35l10.57,-2.98l2.89,1.05l3.05,6.1l6.28,2.03l5.36,-0.41l0.35,-0.27l1.65,-4.87l4.15,3.76l4.23,-0.73l6.31,-4.59l-0.25,-5.03l19.89,-4.96l11.38,-9.51l6.21,2.7l3.36,0.84l-0.37,3.23l-2.4,7.02l0.21,0.49l4.25,2.04l2.64,0.46l2.57,-0.41l1.08,-1.19l4.18,3.43l5.77,-1.28l10.07,10.91l8.27,-0.99l5.51,2.37l2.33,-0.71l5.61,-7.08l-0.02,-0.52l-3.46,-3.68l1.29,0.33l16.95,0.46l3.93,-0.6l-0.12,1.18l0.39,0.76l3.84,1.76l0.11,2.65l-0.84,3.42l0.92,2.57l0.34,0.26l3.22,0.29l9.19,-2.12l3.7,0.29l4.36,3.64l13.9,17.76l-2.7,1.44l-0.15,0.56l2.91,4.57l4.96,2.14l15.83,0.33l0.4,1.39l-1.53,2.54l-2.62,2.66l-0.11,1.14l-5.04,2.52l-7.36,5.12l-4.39,5.73l0.03,0.52l3.65,3.86l-1.62,2.09l0.24,1.73l2.14,0.96l2.12,0.15l-1.45,2.06l0.08,0.55l1.82,1.41l2.09,3.57l2.07,1.32l2.43,0.08l7.89,-2.04l0.98,-0.56l4.56,1.99l10.12,1.95l3.27,0.16l-1.94,1.7l-0.58,2.64l0.68,2.76l1.3,3.16l2.05,2.85l1.78,0.41l0.7,0.82l-0.16,4.92l-1.65,7.15l-1.61,4.07l0.29,3.81l8.12,11.95l0.45,3.97l-2.68,2.39l-6.03,0.92l-3.05,-0.46l-2.72,-0.88l-2.61,-0.19l-3.37,1.57l-2.43,2.45l-1.65,3.16l-0.48,3.08l0.95,2.67l-3.99,3.02l-9.96,2.35l-4.91,1.95l-2.42,3.04l-5.31,3.18l-2.41,2.65l0.02,0.56l3.05,2.84l1.24,3.31l-0.14,3.28l-1.31,2.7l-1.55,0.84l-4.57,0.31l-2.34,1.28l-1.73,5.97l0.15,0.46l2.27,1.55l0.71,1.63l-0.6,1.81l-1.87,1.85l-3.03,-1.14l-0.47,-2.14l0.24,-3.0l-1.01,-2.81l-3.14,-2.62l-2.11,0.12l-1.68,1.42l-1.92,1.0l-5.19,0.69l-3.24,-0.6l0.45,-9.13l-1.13,-3.89l3.08,-2.94l-0.21,-0.68l-4.87,-0.82l-0.95,-3.09l1.29,-28.38l-0.24,-0.39l-7.26,-3.14l-0.38,-2.41l-0.32,-0.33l-28.32,-5.21l-0.45,0.26l-2.05,5.62l0.14,0.46l4.05,2.89l-5.07,10.37l0.31,0.57l7.57,0.93l-1.17,2.3l-14.59,1.7l-1.48,2.52l-1.45,-2.46l-3.83,-1.01l-13.42,1.71l5.89,-10.55l-0.27,-0.59l-6.15,-1.28l-3.61,-5.14l-0.24,-3.14l4.0,-7.52l-0.35,-0.59l-11.26,-0.03l0.95,-3.14l-0.4,-0.52l-7.6,0.4l-12.53,-9.82l-8.24,3.06l-3.67,-0.47l-0.99,-0.76l0.66,-2.5l-0.32,-0.5l-3.72,-0.63l-2.06,-5.81l-0.57,-0.22l-9.17,5.06l-9.94,-6.52l-3.34,0.08l-1.74,2.3l-0.0,0.45l4.48,6.68l-7.34,5.81l-10.03,-2.75l-12.52,7.06l-2.92,-3.39l0.26,-5.51l-0.31,-0.41l-11.44,-2.6l-2.63,-3.61l3.52,-6.19l-4.42,-8.28l-5.44,-4.35l-7.62,2.57l-2.28,-3.23l1.08,-2.47l-0.42,-0.56l-4.3,0.53l-1.44,-4.28l2.95,-2.38l0.09,-0.51l-0.49,-0.17l-5.45,2.15l-2.88,-0.44l-3.41,-7.04l-0.34,-0.23l-11.77,-0.54l3.32,-2.1l0.16,-0.49l-5.99,-14.74l-11.31,-9.04l0.77,-7.09l4.5,-7.15l-0.24,-8.88l3.49,-2.08l0.1,-0.6l-5.41,-6.48l5.1,-2.29l0.92,-5.43Z", "name": "Liege"}, "BE-VLI": {"path": "M761.53,228.86l2.67,1.5l20.2,-0.43l2.5,0.66l4.1,4.37l-5.15,6.59l-1.78,0.63l-5.67,-2.38l-8.17,0.98l-9.75,-10.8l-6.19,1.17l-3.69,-3.25l2.28,-2.86l1.86,-1.2l2.08,0.66l4.72,4.34ZM603.13,242.74l4.26,-7.62l-0.17,-0.55l-4.15,-2.06l2.96,-5.87l-1.8,-5.71l10.36,-8.96l-0.15,-0.69l-4.83,-1.43l1.58,-9.97l3.74,-8.68l4.21,1.19l1.49,-1.06l2.17,-8.74l-0.15,-0.42l-3.63,-2.55l-7.9,-0.08l-0.72,-2.17l-0.53,-0.25l-8.79,3.47l-3.73,-3.41l-4.09,1.25l-1.27,-0.82l-2.89,-6.34l9.13,-6.76l0.37,-6.86l9.51,-3.64l0.25,-0.45l-1.42,-6.87l1.6,-0.35l1.07,2.18l0.49,0.2l5.92,-2.01l0.16,-0.65l-6.33,-6.78l-5.54,-2.1l-6.55,0.72l-0.36,0.4l0.04,7.49l-3.76,1.96l-4.64,-2.41l-4.69,1.39l-3.6,-5.83l-0.43,-0.18l-4.76,1.09l5.94,-6.93l0.12,-4.15l18.37,-3.06l9.55,-10.0l11.55,-0.5l5.42,-6.38l7.31,1.79l6.19,-4.4l-0.6,-12.84l-9.46,-7.56l2.46,-11.42l2.62,-1.8l7.18,-1.49l27.73,0.95l4.96,-1.53l9.78,-5.74l4.49,-1.8l4.87,0.46l5.35,2.81l4.21,4.58l1.63,5.87l0.74,7.0l5.5,4.08l13.31,3.37l3.07,1.8l2.28,2.17l2.74,1.57l4.07,-0.04l9.73,-1.67l2.87,0.25l3.68,1.83l4.82,5.55l3.19,2.25l7.43,-1.44l3.71,0.25l2.43,4.91l-3.06,2.52l-0.89,3.76l5.02,4.75l-3.92,1.69l-2.43,0.31l-2.52,-0.23l-0.42,0.5l0.59,2.28l0.95,2.06l-1.66,4.04l-1.25,2.14l-1.5,1.7l-2.43,-1.74l-0.42,-0.03l-2.1,1.19l-1.21,3.09l-0.56,4.09l3.08,3.71l-3.56,7.25l-9.18,12.23l-0.02,0.46l0.42,0.17l5.17,-1.17l2.11,0.04l1.77,0.88l-2.43,3.42l-4.02,7.14l-2.96,3.72l-1.01,0.68l-5.51,1.79l-16.85,15.72l0.47,7.44l3.79,4.69l3.52,2.09l-10.93,9.19l-20.13,5.02l-0.3,0.42l0.43,4.78l-6.06,4.4l-3.45,0.7l-4.45,-4.04l-0.65,0.17l-1.76,5.2l-4.86,0.4l-6.04,-1.96l-2.81,-5.89l-3.63,-1.36l-10.9,3.1l-4.64,3.47l-1.15,3.25l-7.02,-3.22l-7.51,3.69l-1.51,-3.13l-0.71,-0.03l-1.56,2.69l-13.65,-1.45l-0.4,0.58l2.45,4.79l-2.61,2.67l-14.83,-3.67Z", "name": "Limburg"}, "BE-WHT": {"path": "M276.0,221.26l2.28,3.83l0.48,0.17l9.74,-3.47l3.79,9.3l0.41,0.25l9.19,-0.89l3.31,2.56l12.87,-2.37l2.28,4.88l-1.59,4.95l1.12,3.68l3.57,3.87l4.97,1.49l14.27,0.35l4.79,-3.12l4.53,1.15l5.2,-2.27l1.45,1.85l0.65,-0.03l3.16,-4.95l6.13,1.66l-1.68,0.69l-0.94,4.06l0.27,11.36l2.55,5.78l4.28,1.46l5.42,-0.69l7.53,-8.51l2.22,-0.74l4.21,4.63l-1.15,6.24l0.31,0.46l12.08,2.55l-1.2,6.02l0.32,0.47l7.43,1.3l6.13,7.67l6.42,-0.54l-0.61,7.34l0.22,0.39l0.45,-0.07l5.74,-5.38l12.94,-1.16l2.58,2.11l10.33,-0.06l0.92,1.29l-0.64,7.43l0.56,0.4l7.08,-3.09l-0.21,2.18l0.26,0.41l3.7,1.3l13.34,-4.73l-3.96,14.39l0.47,0.5l7.44,-1.56l-1.31,2.03l0.04,0.48l2.72,3.11l-2.93,6.73l-2.94,0.43l-0.22,0.68l1.94,1.86l-1.87,1.58l0.08,0.66l9.75,4.9l-3.2,5.89l-3.56,0.9l-0.18,0.67l4.6,4.5l-5.54,7.88l1.42,11.1l-15.19,2.08l-4.46,-4.57l-6.49,0.51l-4.93,6.88l-12.71,-1.5l-0.43,0.27l-1.81,5.43l-4.25,0.02l-2.91,4.43l-7.82,0.49l-9.28,5.71l-0.09,0.6l3.97,4.49l8.52,4.23l2.25,-0.15l4.17,-4.04l4.64,0.86l3.03,1.95l-2.74,9.51l1.78,4.34l-8.24,5.32l-0.11,0.56l8.8,12.9l-2.97,5.2l0.2,12.3l1.03,4.98l3.8,1.34l1.84,15.6l6.78,11.66l-3.57,7.26l-34.75,-8.03l-17.93,2.16l-3.03,-0.73l-11.28,-5.12l0.33,-0.32l-0.3,-4.55l-1.28,-4.66l-1.01,-0.54l0.86,-3.19l1.14,-2.2l1.63,-1.69l4.23,-3.33l5.36,-3.22l5.57,-2.34l0.25,-0.35l0.01,-2.24l-1.6,-2.41l-1.37,-2.82l-4.15,-13.4l-2.53,-1.02l-2.6,0.35l-4.51,1.73l-2.89,-1.23l0.52,-5.18l4.47,-12.21l1.26,-5.57l1.03,-2.41l2.41,-2.9l5.46,-3.59l2.47,-2.48l0.49,-3.49l-1.51,-2.08l-2.9,-2.13l-3.19,-1.69l-2.42,-0.66l-2.92,1.04l-0.26,0.35l0.14,3.92l-1.36,1.13l-3.94,-1.55l-6.44,-11.53l-4.83,-3.62l-4.98,-2.43l-7.71,-7.17l-4.85,-1.93l-5.05,0.46l-14.79,5.23l-5.14,0.05l-4.08,-1.64l-4.03,-2.37l-4.94,-2.09l-9.77,-1.0l-10.28,0.67l-3.16,0.98l-2.04,1.9l-4.25,6.05l-1.59,3.39l-0.76,0.44l-0.93,0.01l-0.88,1.71l-7.69,-6.04l-2.02,-12.33l-0.03,-14.33l-1.98,-11.85l-3.85,-5.94l-4.72,-3.82l-5.21,-2.2l-5.37,-0.96l-15.04,-0.08l-2.45,-1.53l2.04,-3.07l0.32,-2.97l-1.71,-1.71l-3.36,-0.86l-3.62,0.26l-2.39,1.32l-2.36,1.98l-3.09,2.0l-10.15,3.09l-5.57,0.56l-3.98,-0.94l-10.15,-4.43l-3.0,-1.98l-3.58,-3.85l-1.16,-3.35l-0.38,-9.85l-6.17,-17.26l-1.84,-8.71l3.21,-5.34l-2.66,-7.32l-2.13,-3.09l-3.14,-0.86l-3.21,-0.38l-1.71,-1.67l-2.84,-5.79l-2.96,-4.46l2.39,-0.72l10.26,-4.41l9.45,4.52l9.93,-1.19l4.73,5.63l-0.32,4.05l0.19,0.37l5.76,3.54l3.76,0.75l0.48,-0.24l0.89,-2.26l10.49,-9.17l10.29,-6.38l8.58,2.91l8.88,-2.22l1.47,9.26l0.39,0.34l15.34,0.22l6.45,3.75l0.54,-0.14l9.44,-15.3l6.26,-2.93ZM104.93,227.83l-5.47,2.85l-4.33,3.89l-7.04,10.19l-2.89,1.86l-4.31,-0.94l-5.55,-15.11l5.86,-3.01l1.31,-0.32l3.48,2.52l6.65,-1.1l1.26,-2.93l8.64,-2.96l0.15,-0.66l-4.65,-4.61l0.15,-0.93l13.2,-4.46l3.33,1.82l2.09,10.8l-11.88,3.11Z", "name": "Hainaut"}, "BE-WNA": {"path": "M445.81,480.33l3.57,-7.67l-6.79,-11.62l-1.86,-15.78l-0.28,-0.34l-3.55,-1.04l-0.97,-4.71l-0.19,-12.08l2.99,-5.12l-0.02,-0.43l-8.71,-12.77l8.18,-5.28l0.15,-0.49l-1.84,-4.25l2.79,-9.66l-0.17,-0.45l-3.34,-2.15l-5.07,-0.97l-4.56,4.19l-1.54,0.07l-8.36,-4.15l-3.49,-3.98l8.79,-5.41l8.05,-0.62l2.89,-4.41l3.97,0.16l0.4,-0.27l1.8,-5.41l12.63,1.49l0.38,-0.17l4.66,-6.75l6.11,-0.48l4.49,4.58l15.79,-2.16l0.34,-0.45l-1.45,-11.34l5.58,-7.75l-0.04,-0.52l-4.33,-4.24l3.29,-0.96l3.48,-6.41l-0.17,-0.55l-9.58,-4.81l1.75,-1.48l0.02,-0.59l-1.67,-1.6l2.66,-0.58l3.11,-7.17l-0.07,-0.42l-2.69,-3.08l1.66,-2.58l-0.42,-0.61l-7.74,1.62l3.99,-14.49l-0.78,-5.13l3.66,-2.42l3.95,-0.46l8.42,2.51l5.43,-0.97l0.31,-0.5l-2.65,-9.38l2.35,-3.33l1.94,-0.01l6.44,3.78l0.58,-0.23l0.99,-3.17l5.43,-1.26l1.39,5.79l0.51,0.29l9.14,-3.0l2.45,3.05l0.49,0.11l0.21,-0.46l-0.84,-3.32l0.93,-0.72l24.95,-5.51l0.31,-0.34l0.19,-1.51l5.81,0.42l5.53,-5.99l6.83,1.3l-0.62,7.39l11.28,8.95l5.82,14.33l-4.11,2.6l-0.17,0.44l0.37,0.3l12.8,0.59l3.7,7.24l3.41,0.47l3.12,-1.23l-1.13,0.91l-0.13,0.44l1.63,4.85l0.43,0.27l3.93,-0.48l-0.85,2.43l2.58,3.66l0.45,0.15l7.69,-2.59l4.83,4.08l4.18,7.89l-3.53,5.82l0.02,0.44l2.87,3.94l11.5,2.72l-0.25,5.33l3.33,4.04l0.5,0.09l12.66,-7.14l9.6,2.75l1.85,3.55l-4.72,5.29l0.0,0.54l3.0,3.28l-12.29,7.68l-0.05,0.64l1.8,1.59l0.57,-0.04l2.8,-3.38l4.97,-0.29l2.24,4.55l-0.22,4.37l-6.26,5.48l-16.2,8.78l-2.24,-2.46l-2.89,0.08l-5.38,3.01l-0.2,0.41l0.51,3.11l-6.23,-0.34l-4.57,2.61l0.03,0.71l8.52,3.97l-2.2,2.63l0.3,0.66l2.37,0.01l-0.18,3.01l8.1,7.92l-2.0,5.08l-6.46,1.75l-0.14,0.7l5.72,4.48l-0.98,2.71l-6.2,-0.44l-6.26,3.7l-4.88,0.85l-21.79,1.28l-4.65,-1.36l-1.32,-8.3l-0.37,-0.34l-0.41,0.29l-3.44,11.74l0.12,0.42l1.8,1.54l-2.3,4.81l-7.5,6.57l-1.96,0.57l-1.97,-1.73l-0.64,0.17l-1.55,4.45l-4.14,-0.09l-0.38,0.26l0.12,0.45l5.59,4.59l3.21,10.09l2.7,1.07l9.65,-1.63l2.21,4.04l6.55,2.85l-0.83,6.49l4.65,4.16l-11.17,3.77l-5.95,4.74l-0.01,0.62l3.47,2.91l-17.04,10.32l-1.17,3.13l1.85,5.42l-2.59,0.64l-0.3,0.31l-1.04,5.16l-0.69,1.82l-4.12,0.18l-10.11,3.01l-5.16,0.7l-5.91,-0.71l-1.9,-2.09l0.03,-11.35l-0.64,-1.92l-2.26,-3.14l-0.43,-1.36l0.38,-1.64l2.07,-2.07l3.24,-7.95l0.61,-2.76l-0.41,-3.97l-3.91,-5.94l-10.94,-3.79l-2.94,-4.02l0.97,-4.65l8.96,-18.79l0.26,-3.41l-0.36,-2.57l0.25,-2.63l4.27,-7.89l1.04,-0.21l2.36,2.17l0.67,-0.26l0.53,-5.33l1.26,-6.35l0.31,-5.35l-2.62,-2.8l-7.21,1.26l-2.33,-0.82l-1.01,-4.33l-0.53,-0.28l-6.42,2.5l-25.01,21.32l-1.4,2.51l-0.63,3.01l0.56,2.03l0.86,1.54l0.23,1.96l-1.77,9.66l-1.62,4.77l-2.07,3.35l-2.38,1.32l-9.76,1.32l-32.52,13.57l-6.8,1.01l-1.16,-0.27Z", "name": "Namur"}, "BE-BRU": {"path": "M403.24,208.4l2.45,-4.16l5.74,-0.8l0.33,-0.29l1.48,-5.17l-2.3,-3.63l4.23,-6.96l8.35,-3.51l10.18,1.3l5.83,-4.81l3.71,2.41l3.55,5.08l-0.11,2.65l-3.53,3.02l0.07,0.66l9.26,4.94l3.47,9.13l-4.72,0.65l-1.97,2.7l0.11,0.58l7.13,4.4l-18.27,8.17l-4.84,0.95l-4.99,-0.75l-6.3,-3.55l-6.11,-10.81l-0.51,-0.17l-4.08,1.77l-8.19,-3.81Z", "name": "Brussels"}}, "height": 613.8264117465903, "projection": {"type": "mill", "centralMeridian": 0.0}, "width": 900.0});