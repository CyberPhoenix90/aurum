!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e(t.aurum={})}(this,function(t){var e=function(){this.subscribeChannel=[],this.onAfterFire=[]},n={subscriptions:{configurable:!0}};n.subscriptions.get=function(){return this.subscribeChannel.length},e.prototype.subscribe=function(t,e){return this.createSubscription(t,this.subscribeChannel,e).facade},e.prototype.hasSubscriptions=function(){return this.subscriptions>0},e.prototype.cancelAll=function(){this.subscribeChannel.length=0},e.prototype.fireFiltered=function(t,e){this.isFiring=!0;for(var n=this.subscribeChannel.length,o=0;o<n;o++)this.subscribeChannel[o].callback!==e&&this.subscribeChannel[o].callback(t);this.isFiring=!1,this.afterFire()},e.prototype.afterFire=function(){this.onAfterFire.length>0&&(this.onAfterFire.forEach(function(t){return t()}),this.onAfterFire.length=0)},e.prototype.fire=function(t){this.isFiring=!0;for(var e=this.subscribeChannel.length,n=0;n<e;n++)this.subscribeChannel[n].callback(t);this.isFiring=!1,this.afterFire()},e.prototype.createSubscription=function(t,e,n){var o=this,r={callback:t},i={cancel:function(){o.cancel(r,e)}};return void 0!==n&&n.addCancelable(function(){return o.cancel(r,e)}),e.push(r),{subscription:r,facade:i}},e.prototype.cancel=function(t,e){var n=this,o=e.indexOf(t);o>=0&&(this.isFiring?this.onAfterFire.push(function(){return n.cancel(t,e)}):e.splice(o,1))},Object.defineProperties(e.prototype,n);var o=function(t){this.value=t,this.updateEvent=new e};o.prototype.update=function(t){if(this.updating)throw new Error("Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed");this.updating=!0,this.value=t,this.updateEvent.fire(t),this.updating=!1},o.prototype.backPropagate=function(t,e){this.value=e,this.updating=!0,this.updateEvent.fireFiltered(e,t),this.updating=!1},o.prototype.listenAndRepeat=function(t,e){return t(this.value),this.listen(t,e)},o.prototype.listen=function(t,e){return this.updateEvent.subscribe(t,e).cancel},o.prototype.filter=function(t,e){var n=new o;return this.listen(function(e){t(e)&&n.update(e)},e),n},o.prototype.filterDuplex=function(t,e){var n=this,r=new o,i=function(e){t(e)&&r.backPropagate(a,e)},a=function(e){t(e)&&n.backPropagate(i,e)};return this.listen(i,e),r.listen(a,e),r},o.prototype.pipe=function(t,e){this.listen(function(e){return t.update(e)},e)},o.prototype.pipeDuplex=function(t,e){var n=this,o=function(e){return t.backPropagate(r,e)},r=function(t){return n.backPropagate(o,t)};this.listen(o,e),t.listen(r,e)},o.prototype.map=function(t,e){var n=new o(t(this.value));return this.listen(function(e){n.update(t(e))},e),n},o.prototype.mapDuplex=function(t,e,n){var r=this,i=new o(t(this.value)),a=function(e){return i.backPropagate(c,t(e))},c=function(t){return r.backPropagate(a,e(t))};return this.listen(a,n),i.listen(c,n),i},o.prototype.unique=function(t){var e=new o(this.value);return this.listen(function(t){t!==e.value&&e.update(t)},t),e},o.prototype.uniqueDuplex=function(t){var e=this,n=new o(this.value),r=function(t){t!==n.value&&n.backPropagate(i,t)},i=function(t){t!==e.value&&e.backPropagate(r,t)};return this.listen(r,t),n.listen(i,t),n},o.prototype.reduce=function(t,e,n){var r=new o(e);return this.listen(function(e){return r.update(t(r.value,e))},n),r},o.prototype.aggregate=function(t,e,n){var r=this,i=new o(e(this.value,t.value));return this.listen(function(){return i.update(e(r.value,t.value))},n),t.listen(function(){return i.update(e(r.value,t.value))},n),i},o.prototype.combine=function(t,e){var n=new o;return this.pipe(n,e),t.pipe(n,e),n},o.prototype.debounce=function(t,e){var n,r=new o;return this.listen(function(e){clearTimeout(n),n=setTimeout(function(){r.update(e)},t)},e),r},o.prototype.buffer=function(t,e){var n,r=new o,i=[];return this.listen(function(e){i.push(e),n||(n=setTimeout(function(){n=void 0,r.update(i),i=[]},t))},e),r},o.prototype.queue=function(t,e){var n=new r;return this.listen(function(t){n.push(t)},e),n},o.prototype.pick=function(t,e){var n,r=new o(null===(n=this.value)||void 0===n?void 0:n[t]);return this.listen(function(e){r.update(null!=e?e[t]:e)},e),r},o.prototype.cancelAll=function(){this.updateEvent.cancelAll()};var r=function(t){this.data=t?t.slice():[],this.updateEvent=new e},i={length:{configurable:!0}};r.prototype.listenAndRepeat=function(t,e){return t({operation:"add",operationDetailed:"append",index:0,items:this.data,newState:this.data,count:this.data.length}),this.listen(t,e)},r.prototype.listen=function(t,e){return this.updateEvent.subscribe(t,e).cancel},i.length.get=function(){return this.data.length},r.prototype.getData=function(){return this.data.slice()},r.prototype.get=function(t){return this.data[t]},r.prototype.set=function(t,e){var n=this.data[t];n!==e&&(this.data[t]=e,this.update({operation:"replace",operationDetailed:"replace",target:n,count:1,index:t,items:[e],newState:this.data}))},r.prototype.swap=function(t,e){if(t!==e){var n=this.data[t],o=this.data[e];this.data[e]=n,this.data[t]=o,this.update({operation:"swap",operationDetailed:"swap",index:t,index2:e,items:[n,o],newState:this.data})}},r.prototype.swapItems=function(t,e){if(t!==e){var n=this.data.indexOf(t),o=this.data.indexOf(e);-1!==n&&-1!==o&&(this.data[o]=t,this.data[n]=e),this.update({operation:"swap",operationDetailed:"swap",index:n,index2:o,items:[t,e],newState:this.data})}},r.prototype.push=function(){for(var t,e=[],n=arguments.length;n--;)e[n]=arguments[n];(t=this.data).push.apply(t,e),this.update({operation:"add",operationDetailed:"append",count:e.length,index:this.data.length-e.length,items:e,newState:this.data})},r.prototype.unshift=function(){for(var t,e=[],n=arguments.length;n--;)e[n]=arguments[n];(t=this.data).unshift.apply(t,e),this.update({operation:"add",operationDetailed:"prepend",count:e.length,items:e,index:0,newState:this.data})},r.prototype.pop=function(){var t=this.data.pop();return this.update({operation:"remove",operationDetailed:"removeRight",count:1,index:this.data.length,items:[t],newState:this.data}),t},r.prototype.merge=function(t){for(var e=0;e<t.length;e++)this.data[e]!==t[e]&&(this.length>e?this.set(e,t[e]):this.push(t[e]));this.length>t.length&&this.removeRight(this.length-t.length)},r.prototype.removeRight=function(t){var e=this.length,n=this.data.splice(e-t,t);this.update({operation:"remove",operationDetailed:"removeRight",count:t,index:e-t,items:n,newState:this.data})},r.prototype.removeLeft=function(t){var e=this.data.splice(0,t);this.update({operation:"remove",operationDetailed:"removeLeft",count:t,index:0,items:e,newState:this.data})},r.prototype.remove=function(t){var e=this.data.indexOf(t);-1!==e&&(this.data.splice(e,1),this.update({operation:"remove",operationDetailed:"remove",count:1,index:e,items:[t],newState:this.data}))},r.prototype.clear=function(){var t=this.data;this.data=[],this.update({operation:"remove",operationDetailed:"clear",count:t.length,index:0,items:t,newState:this.data})},r.prototype.shift=function(){var t=this.data.shift();return this.update({operation:"remove",operationDetailed:"removeLeft",items:[t],count:1,index:0,newState:this.data}),t},r.prototype.toArray=function(){return this.data.slice()},r.prototype.sort=function(t,e){return new a(this,t,e)},r.prototype.filter=function(t,e){return new c(this,t,e)},r.prototype.forEach=function(t,e){return this.data.forEach(t,e)},r.prototype.toDataSource=function(){var t=new o(this.data);return this.listen(function(e){t.update(e.newState)}),t},r.prototype.update=function(t){this.updateEvent.fire(t)},Object.defineProperties(r.prototype,i);var a=function(t){function e(e,n,o){var r=this,i=e.data.slice().sort(n);t.call(this,i),this.comparator=n,e.listen(function(t){var e,n;switch(t.operationDetailed){case"removeLeft":r.removeLeft(t.count);break;case"removeRight":r.removeRight(t.count);break;case"remove":r.remove(t.items[0]);break;case"clear":r.data.length=0;break;case"prepend":(e=r).unshift.apply(e,t.items),r.data.sort(r.comparator);break;case"append":(n=r).push.apply(n,t.items),r.data.sort(r.comparator);break;case"swap":break;case"replace":r.set(t.index,t.items[0]),r.data.sort(r.comparator)}},o)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(r),c=function(t){function e(e,n,o){var r=this,i=e.data.filter(n);t.call(this,i),this.parent=e,this.viewFilter=n,e.listen(function(t){var e,n,o;switch(t.operationDetailed){case"removeLeft":case"removeRight":case"remove":case"clear":for(var i=0,a=t.items;i<a.length;i+=1)r.remove(a[i]);break;case"prepend":o=t.items.filter(r.viewFilter),(e=r).unshift.apply(e,o);break;case"append":o=t.items.filter(r.viewFilter),(n=r).push.apply(n,o);break;case"swap":var c=r.data.indexOf(t.items[0]),s=r.data.indexOf(t.items[1]);-1!==c&&-1!==s&&r.swap(c,s);break;case"replace":var p=r.data.indexOf(t.target);-1!==p&&(r.viewFilter(t.items[0])?r.set(p,t.items[0]):r.remove(t.target))}},o)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.updateFilter=function(t){this.viewFilter!==t&&(this.viewFilter=t,this.refresh())},e.prototype.refresh=function(){var t;this.clear();var e=this.parent.data.filter(this.viewFilter);(t=this).push.apply(t,e)},e}(r),s=function(t){this.data=t};s.prototype.deleteNext=function(){if(this.next){var t=this.next.next;this.next.next=void 0,this.next.previous=void 0,this.next=t,this.next&&(this.next.previous=this)}},s.prototype.deletePrevious=function(){if(this.previous){var t=this.previous.previous;this.previous.next=void 0,this.previous.previous=void 0,this.previous=t,this.previous&&(this.previous.next=this)}};var p=function(t){var e=this;void 0===t&&(t=[]),this.length=0,t.forEach(function(t){return e.append(t)})};p.prototype.find=function(t){for(var e=this.rootNode;e&&!t(e);)e=e.next;return e},p.prototype.append=function(t){return this.rootNode||this.lastNode?(this.lastNode.next=new s(t),this.lastNode.next.previous=this.lastNode,this.lastNode=this.lastNode.next):this.rootNode=this.lastNode=new s(t),this.length++,t},p.prototype.forEach=function(t){this.find(function(e){return t(e.data),!1})},p.prototype.prepend=function(t){return this.rootNode||this.lastNode?(this.rootNode.previous=new s(t),this.rootNode.previous.next=this.rootNode,this.rootNode=this.rootNode.previous):this.rootNode=this.lastNode=new s(t),this.length++,t},p.prototype.remove=function(t){if(t===this.rootNode.data)this.rootNode=this.rootNode===this.lastNode?this.lastNode=void 0:this.rootNode.next,this.length--;else{var e=this.find(function(e){return e.next&&e.next.data===t});e&&(e.next===this.lastNode&&(this.lastNode=e),e.deleteNext(),this.length--)}};var u=function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];this.cancelables=new p(t),this._isCancelled=!1},l={isCanceled:{configurable:!0}};l.isCanceled.get=function(){return this._isCancelled},u.prototype.addCancelable=function(t){return this.throwIfCancelled("attempting to add cancellable to token that is already cancelled"),this.cancelables.append(t),this.cancelables.length>200&&console.log("potential memory leak: cancellation token has over 200 clean up calls"),this},u.prototype.removeCancelable=function(t){return this.throwIfCancelled("attempting to remove cancellable from token that is already cancelled"),this.cancelables.remove(t),this},u.prototype.addDisposable=function(t){return this.addCancelable(function(){return t.dispose()}),this},u.prototype.callIfNotCancelled=function(t){this.isCanceled||t()},u.prototype.setTimeout=function(t,e){var n=this;void 0===e&&(e=0);var o=setTimeout(function(){n.removeCancelable(r),t()},e),r=function(){return clearTimeout(o)};this.addCancelable(r)},u.prototype.setInterval=function(t,e){var n=setInterval(t,e);this.addCancelable(function(){return clearInterval(n)})},u.prototype.requestAnimationFrame=function(t){var e=requestAnimationFrame(t);this.addCancelable(function(){return cancelAnimationFrame(e)})},u.prototype.animationLoop=function(t){var e=requestAnimationFrame(function n(o){t(o),e=requestAnimationFrame(n)});this.addCancelable(function(){return cancelAnimationFrame(e)})},u.prototype.throwIfCancelled=function(t){if(this.isCanceled)throw new Error(t||"cancellation token is cancelled")},u.prototype.chain=function(t,e){return void 0===e&&(e=!1),e&&t.chain(this,!1),this.addCancelable(function(){return t.cancel()}),this},u.prototype.registerDomEvent=function(t,e,n){return t.addEventListener(e,n),this.addCancelable(function(){return t.removeEventListener(e,n)}),this},u.prototype.cancel=function(){this.isCanceled||(this._isCancelled=!0,this.cancelables.forEach(function(t){return t()}),this.cancelables=void 0)},Object.defineProperties(u.prototype,l);var h=Symbol("owner"),d=function(t,e){var n,o;this.onDispose=t.onDispose,this.onAttach=t.onAttach,this.onDetach=t.onDetach,this.domNodeName=e,this.template=t.template,this.cancellationToken=new u,this.node=this.create(t),this.initialize(t),null===(o=(n=t).onCreate)||void 0===o||o.call(n,this)};d.prototype.initialize=function(t){this.node instanceof Text||(this.children=[]),this.createEventHandlers(["drag","name","dragstart","dragend","dragexit","dragover","dragenter","dragleave","blur","focus","click","dblclick","keydown","keyhit","keyup","mousedown","mouseup","mousemouse","mouseenter","mouseleave","mousewheel"],t);var e=Object.keys(t).filter(function(t){return t.includes("-")});this.bindProps(["id","draggable","tabindex","style","role","contentEditable"].concat(e),t),t.class&&this.handleClass(t.class),t.repeatModel&&this.handleRepeat(t.repeatModel)},d.prototype.bindProps=function(t,e){for(var n=0,o=t;n<o.length;n+=1){var r=o[n];e[r]&&this.assignStringSourceToAttribute(e[r],r)}},d.prototype.createEventHandlers=function(t,e){var n=this;if(!(this.node instanceof Text))for(var r=function(){var t=a[i],r="on"+t[0].toUpperCase()+t.slice(1),c=void 0;Object.defineProperty(n,r,{get:function(){return c||(c=new o),c},set:function(){throw new Error(r+" is read only")}}),e[r]&&(e[r]instanceof o?n[r].listen(e[r].update.bind(e.onClick),n.cancellationToken):"function"==typeof e[r]&&n[r].listen(e[r],n.cancellationToken),n.cancellationToken.registerDomEvent(n.node,t,function(t){return n[r].update(t)}))},i=0,a=t;i<a.length;i+=1)r()},d.prototype.handleRepeat=function(t){var e=this;if(this.repeatData=t instanceof r?t:new r(t),this.repeatData.length){var n=this.children;this.children=new Array(this.children.length);var o=0;for(o=0;o<this.children.length;o++)this.children[o]=n[o];this.repeatData.forEach(function(t,n){e.children[o+n]=e.template.generate(t)}),this.render()}this.repeatData.listen(function(t){var n,o,r;switch(t.operationDetailed){case"swap":var i=e.children[t.index2];e.children[t.index2]=e.children[t.index],e.children[t.index]=i;break;case"append":(n=e.children).push.apply(n,t.items.map(function(t){return e.template.generate(t)}));break;case"prepend":(o=e.children).unshift.apply(o,t.items.map(function(t){return e.template.generate(t)}));break;case"remove":case"removeLeft":case"removeRight":case"clear":e.children.splice(t.index,t.count);break;default:e.children.length=0,(r=e.children).push.apply(r,e.repeatData.toArray().map(function(t){return e.template.generate(t)}))}e.render()})},d.prototype.render=function(){if(!(this.node instanceof Text)){for(var t=0;t<this.children.length;t++){if(this.node.childNodes.length<=t){this.addChildrenDom(this.children.slice(t,this.children.length));break}if(this.node.childNodes[t][h]!==this.children[t]){if(!this.children.includes(this.node.childNodes[t][h])){var e=this.node.childNodes[t];e.remove(),e[h].dispose(),t--;continue}var n=this.getChildIndex(this.children[t].node);-1!==n?this.swapChildrenDom(t,n):this.addDomNodeAt(this.children[t].node,t)}}for(;this.node.childNodes.length>this.children.length;){var o=this.node.childNodes[this.node.childNodes.length-1];this.node.removeChild(o),o[h].dispose()}}},d.prototype.assignStringSourceToAttribute=function(t,e){var n=this;this.node instanceof Text||("string"==typeof t?this.node.setAttribute(e,t):(t.value&&this.node.setAttribute(e,t.value),t.unique(this.cancellationToken).listen(function(t){return n.node.setAttribute(e,t)},this.cancellationToken)))},d.prototype.handleAttach=function(){var t;if(this.node.isConnected){null===(t=this.onAttach)||void 0===t||t.call(this,this);for(var e=0,n=this.node.childNodes;e<n.length;e+=1)n[e][h].handleAttach()}},d.prototype.handleDetach=function(){var t;if(!this.node.isConnected){null===(t=this.onDetach)||void 0===t||t.call(this,this);for(var e=0,n=this.node.childNodes;e<n.length;e+=1){var o=n[e];o[h]&&o[h].handleDetach()}}},d.prototype.handleClass=function(t){var e=this;if(!(this.node instanceof Text))if("string"==typeof t)this.node.className=t;else if(t instanceof o)t.value&&(Array.isArray(t.value)?(this.node.className=t.value.join(" "),t.unique(this.cancellationToken).listen(function(){e.node.className=t.value.join(" ")},this.cancellationToken)):(this.node.className=t.value,t.unique(this.cancellationToken).listen(function(){e.node.className=t.value},this.cancellationToken))),t.unique(this.cancellationToken).listen(function(t){return e.node.className=t},this.cancellationToken);else{var n=t.reduce(function(t,e){return"string"==typeof e?t+" "+e:e.value?t+" "+e.value:t},"");this.node.className=n;for(var r=0,i=t;r<i.length;r+=1){var a=i[r];a instanceof o&&a.unique(this.cancellationToken).listen(function(n){var o=t.reduce(function(t,e){return"string"==typeof e?t+" "+e:e.value?t+" "+e.value:t},"");e.node.className=o},this.cancellationToken)}}},d.prototype.resolveStringSource=function(t){return"string"==typeof t?t:t.value},d.prototype.create=function(t){var e=document.createElement(this.domNodeName);return e[h]=this,e},d.prototype.getChildIndex=function(t){for(var e=0,n=0,o=t.childNodes;n<o.length;n+=1){if(o[n]===t)return e;e++}return-1},d.prototype.hasChild=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");for(var e=0,n=t.children;e<n.length;e+=1)if(n[e]===t)return!0;return!1},d.prototype.addChildrenDom=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");for(var e=0,n=t;e<n.length;e+=1){var o=n[e];this.node.appendChild(o.node),o.handleAttach()}},d.prototype.swapChildrenDom=function(t,e){if(this.node instanceof Text)throw new Error("Text nodes don't have children");if(t!==e){var n=this.node.children[t],o=this.node.children[e];n.remove(),o.remove(),t<e?(this.addDomNodeAt(o,t),this.addDomNodeAt(n,e)):(this.addDomNodeAt(n,e),this.addDomNodeAt(o,t))}},d.prototype.addDomNodeAt=function(t,e){if(this.node instanceof Text)throw new Error("Text nodes don't have children");e>=this.node.childElementCount?(this.node.appendChild(t),t[h].handleAttach()):(this.node.insertBefore(t,this.node.children[e]),t[h].handleAttach())},d.prototype.remove=function(){this.hasParent()&&this.node.parentElement[h].removeChild(this.node)},d.prototype.hasParent=function(){return!!this.node.parentElement},d.prototype.isConnected=function(){return this.node.isConnected},d.prototype.removeChild=function(t){var e=this.children.indexOf(t);-1!==e&&this.children.splice(e,1),this.render()},d.prototype.removeChildAt=function(t){this.children.splice(t,1),this.render()},d.prototype.swapChildren=function(t,e){if(t!==e){var n=this.children[t];this.children[t]=this.children[e],this.children[e]=n,this.render()}},d.prototype.clearChildren=function(){if(this.node instanceof Text)throw new Error("Text nodes don't have children");this.children.length=0,this.render()},d.prototype.addChild=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");t instanceof f||(t=this.childNodeToAurum(t),this.children.push(t),this.render())},d.prototype.childNodeToAurum=function(t){return"string"==typeof t||t instanceof o?t=new y({text:t}):t instanceof d||(t=new y({text:t.toString()})),t},d.prototype.addChildAt=function(t,e){if(this.node instanceof Text)throw new Error("Text nodes don't have children");t instanceof f||(t=this.childNodeToAurum(t),this.children.splice(e,0,t),this.render())},d.prototype.addChildren=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");if(0!==t.length)for(var e=0,n=t;e<n.length;e+=1)this.addChild(n[e])},d.prototype.dispose=function(){this.internalDispose(!0)},d.prototype.internalDispose=function(t){var e;this.cancellationToken.cancel(),t&&this.remove();for(var n=0,o=this.node.childNodes;n<o.length;n+=1){var r=o[n];r[h]&&r[h].internalDispose(!1)}delete this.node[h],delete this.node,null===(e=this.onDispose)||void 0===e||e.call(this,this)};var f=function(t){function e(e){t.call(this,e,"template"),this.ref=e.ref,this.generate=e.generator}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),y=function(t){function e(e){var n=this;t.call(this,e,"textNode"),e.text instanceof o&&e.text.listen(function(t){return n.node.textContent=t},this.cancellationToken)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.create=function(t){var e=document.createTextNode(this.resolveStringSource(t.text));return e[h]=this,e},e}(d),v=function(t){function e(e){t.call(this,e,"a"),this.bindProps(["href","target"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),_=function(t){function e(e){t.call(this,e,"abbr")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),b=function(t){function e(e){t.call(this,e,"area")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),m=function(t){function e(e){t.call(this,e,"article")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),g=function(t){function e(e){t.call(this,e,"aside")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),w=function(t){function e(e){t.call(this,e,"audio"),this.bindProps(["controls","autoplay","loop","muted","preload","src"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),x=function(t){function e(e){t.call(this,e,"b")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),O=function(t){function e(e){t.call(this,e,"br")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),j=function(t){function e(e){t.call(this,e,"button"),this.bindProps(["disabled"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),k=function(t){function e(e){t.call(this,e,"canvas"),this.bindProps(["width","height"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),C=function(t){function e(e){t.call(this,e,"data"),this.bindProps(["datalue"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),S=function(t){function e(e){t.call(this,e,"details")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),N=function(t){function e(e){t.call(this,e,"div")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),T=function(t){function e(e){t.call(this,e,"em")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),A=function(t){function e(e){t.call(this,e,"footer")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),D=function(t){function e(e){t.call(this,e,"form")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),E=function(t){function e(e){t.call(this,e,"h1")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),P=function(t){function e(e){t.call(this,e,"h2")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),F=function(t){function e(e){t.call(this,e,"h3")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),I=function(t){function e(e){t.call(this,e,"h4")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),V=function(t){function e(e){t.call(this,e,"h5")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),q=function(t){function e(e){t.call(this,e,"h6")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),L=function(t){function e(e){t.call(this,e,"header")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),R=function(t){function e(e){t.call(this,e,"heading")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),H=function(t){function e(e){t.call(this,e,"i")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),K=function(t){function e(e){t.call(this,e,"iframe"),this.bindProps(["src","srcdoc","width","height","allow","allowFullscreen","allowPaymentRequest"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),M=function(t){function e(e){t.call(this,e,"img"),this.bindProps(["src","alt","width","height","referrerPolicy","sizes","srcset","useMap"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),B=function(t){function e(e){var n,o=this;t.call(this,e,"input"),e.inputValueSource?e.inputValueSource.unique().listenAndRepeat(function(t){return o.node.value=t},this.cancellationToken):this.node.value=null!=(n=e.initialValue)?n:"",this.bindProps(["placeholder","readonly","disabled","accept","alt","autocomplete","autofocus","checked","defaultChecked","formAction","formEnctype","formMethod","formNoValidate","formTarget","max","maxLength","min","minLength","pattern","multiple","required","type"],e),this.createEventHandlers(["input","change"],e),e.inputValueSource&&this.node.addEventListener("input",function(){e.inputValueSource.update(o.node.value)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),z=function(t){function e(e){t.call(this,e,"label"),this.bindProps(["for"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),U=function(t){function e(e){t.call(this,e,"li")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),Q=function(t){function e(e){t.call(this,e,"link"),this.bindProps(["href","rel","media","as","disabled","type"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),G=function(t){function e(e){t.call(this,e,"nav")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),J=function(t){function e(e){t.call(this,e,"noscript")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),W=function(t){function e(e){t.call(this,e,"ol")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),X=function(t){function e(e){t.call(this,e,"option")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),Y=function(t){function e(e){t.call(this,e,"p")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),Z=function(t){function e(e){t.call(this,e,"pre")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),$=function(t){function e(e){t.call(this,e,"progress"),this.bindProps(["max","value"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),tt=function(t){function e(e){t.call(this,e,"q")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),et=function(t){function e(e){t.call(this,e,"script"),this.bindProps(["src","async","defer","integrity","noModule","type"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),nt=function(t){function e(e){var n=this;t.call(this,e,"select"),this.createEventHandlers(["change"],e),this.initialSelection=e.initialSelection,e.selectedIndexSource&&(this.selectedIndexSource=e.selectedIndexSource,e.selectedIndexSource.unique().listenAndRepeat(function(t){return n.node.selectedIndex=t},this.cancellationToken)),e.selectedIndexSource&&this.node.addEventListener("change",function(){e.selectedIndexSource.update(n.node.selectedIndex)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.handleAttach=function(){t.prototype.handleAttach.call(this),this.selectedIndexSource?this.node.selectedIndex=this.selectedIndexSource.value:void 0!==this.initialSelection&&(this.node.selectedIndex=this.initialSelection)},e}(d),ot=function(t){function e(e){t.call(this,e,"source"),this.bindProps(["src","srcSet","media","sizes","type"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),rt=function(t){function e(e){t.call(this,e,"span")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),it=function(t){function e(e){var n=this;t.call(this,e,"switch"),this.firstRender=!0,this.templateMap=e.templateMap,this.renderSwitch(e.state.value),e.state.listen(function(t){n.renderSwitch(t)},this.cancellationToken)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.renderSwitch=function(t){var e;if(t!==this.lastValue||this.firstRender)if(this.lastValue=t,this.firstRender=!1,this.clearChildren(),null!=t){var n=null!=(e=this.templateMap[t.toString()])?e:this.template;if(n){var o=n.generate();this.addChild(o)}}else if(this.template){var r=this.template.generate();this.addChild(r)}},e}(d),at=function(t){function e(e){var n=new o(location.hash.substring(1));t.call(this,Object.assign(Object.assign({},e),{state:n})),window.addEventListener("hashchange",function(){var t=location.hash.substring(1);t.includes("?")?n.update(t.substring(0,t.indexOf("?"))):n.update(t)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(it),ct=function(t){function e(e){var n=this;t.call(this,e,"suspense"),e.loader().then(function(t){n.clearChildren(),n.addChild(t)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),st=function(t){function e(e){t.call(this,e,"style"),this.bindProps(["media"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),pt=function(t){function e(e){t.call(this,e,"sub")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),ut=function(t){function e(e){t.call(this,e,"summary")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),lt=function(t){function e(e){t.call(this,e,"sup")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),ht=function(t){function e(e){t.call(this,e,"svg"),this.bindProps(["width","height"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),dt=function(t){function e(e){t.call(this,e,"table")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),ft=function(t){function e(e){t.call(this,e,"tbody")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),yt=function(t){function e(e){t.call(this,e,"td")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),vt=function(t){function e(e){var n,o,r,i=this;t.call(this,e,"textArea"),e.inputValueSource?(this.node.value=null!=(o=null!=(n=e.initialValue)?n:e.inputValueSource.value)?o:"",e.inputValueSource.unique().listen(function(t){return i.node.value=t},this.cancellationToken)):this.node.value=null!=(r=e.initialValue)?r:"",this.bindProps(["placeholder","readonly","disabled","rows","wrap","autocomplete","autofocus","max","maxLength","min","minLength","required","type"],e),this.createEventHandlers(["input","change"],e),e.inputValueSource&&this.onInput.map(function(t){return i.node.value}).pipe(e.inputValueSource)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),_t=function(t){function e(e){t.call(this,e,"tfoot")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),bt=function(t){function e(e){t.call(this,e,"th")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),mt=function(t){function e(e){t.call(this,e,"thead")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),gt=function(t){function e(e){t.call(this,e,"time"),this.bindProps(["datetime"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),wt=function(t){function e(e){t.call(this,e,"title")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),xt=function(t){function e(e){t.call(this,e,"tr")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),Ot=function(t){function e(e){t.call(this,e,"ul")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),jt=function(t){function e(e){t.call(this,e,"video"),this.bindProps(["controls","autoplay","loop","muted","preload","src","poster","width","height"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),kt=function(t){function e(e){t.call(this,e,"body")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),Ct=function(t){function e(e){t.call(this,e,"head")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(d),St=function(t){t&&(this.data=t),this.updateEvent=new e,this.updateEventOnKey=new Map};St.prototype.pick=function(t,e){var n,r=new o(null===(n=this.data)||void 0===n?void 0:n[t]);return this.listenOnKey(t,function(t){r.update(t.newValue)},e),r},St.prototype.listen=function(t,e){return this.updateEvent.subscribe(t,e).cancel},St.prototype.listenOnKeyAndRepeat=function(t,e,n){return e({key:t,newValue:this.data[t],oldValue:void 0}),this.listenOnKey(t,e,n)},St.prototype.listenOnKey=function(t,n,o){return this.updateEventOnKey.has(t)||this.updateEventOnKey.set(t,new e),this.updateEventOnKey.get(t).subscribe(n,o).cancel},St.prototype.get=function(t){return this.data[t]},St.prototype.set=function(t,e){if(this.data[t]!==e){var n=this.data[t];this.data[t]=e,this.updateEvent.fire({oldValue:n,key:t,newValue:this.data[t]}),this.updateEventOnKey.has(t)&&this.updateEventOnKey.get(t).fire({oldValue:n,key:t,newValue:this.data[t]})}},St.prototype.assign=function(t){for(var e=0,n=Object.keys(t);e<n.length;e+=1){var o=n[e];this.set(o,t[o])}},St.prototype.toObject=function(){return Object.assign({},this.data)},St.prototype.toDataSource=function(){var t=this,e=new o(this.data);return this.listen(function(n){e.update(t.data)}),e};var Nt={button:j,div:N,input:B,li:U,span:rt,style:st,ul:Ot,p:Y,img:M,link:Q,canvas:k,a:v,article:m,br:O,form:D,label:z,ol:W,pre:Z,progress:$,table:dt,td:yt,tr:xt,th:bt,textarea:vt,h1:E,h2:P,h3:F,h4:I,h5:V,h6:q,header:L,footer:A,nav:G,b:x,i:H,script:et,abbr:_,area:b,aside:g,audio:w,em:T,heading:R,iframe:K,noscript:J,option:X,q:tt,select:nt,source:ot,title:wt,video:jt,tbody:ft,tfoot:_t,thead:mt,summary:ut,details:S,sub:pt,sup:lt,svg:ht,data:C,time:gt,template:f},Tt=function(){};Tt.attach=function(t,e){if(e[h])throw new Error("This node is already managed by aurum and cannot be used");e.appendChild(t.node),t.handleAttach(),e[h]=t},Tt.detach=function(t){t[h]&&(t[h].node.remove(),t[h].handleDetach(),t[h].dispose(),t[h]=void 0)},Tt.factory=function(t,e){for(var n,o=[],r=arguments.length-2;r-- >0;)o[r]=arguments[r+2];if("string"==typeof t){var i=t;if(void 0===(t=Nt[t]))throw new Error("Node "+i+" does not exist or is not supported")}for(var a,c,s=(n=[]).concat.apply(n,o).filter(function(t){return t}),p={},u=!1,l=0,h=s;l<h.length;l+=1){var d=h[l];"string"!=typeof d&&(d instanceof f&&(!d.ref||"default"===d.ref)&&(a=d),d.ref&&(p[d.ref]=d,u=!0))}return e=null!=e?e:{},a&&(e.template=a),u&&(e.templateMap=p),(c=t.prototype?new t(e||{}):t(e||{})).addChildren(s),c},t.A=v,t.Abbr=_,t.Area=b,t.Article=m,t.Aside=g,t.Audio=w,t.AurumElement=d,t.Template=f,t.TextNode=y,t.B=x,t.Br=O,t.Button=j,t.Canvas=k,t.Data=C,t.Details=S,t.Div=N,t.Em=T,t.Footer=A,t.Form=D,t.H1=E,t.H2=P,t.H3=F,t.H4=I,t.H5=V,t.H6=q,t.Header=L,t.Heading=R,t.I=H,t.IFrame=K,t.Img=M,t.Input=B,t.Label=z,t.Li=U,t.Link=Q,t.Nav=G,t.NoScript=J,t.Ol=W,t.Option=X,t.P=Y,t.Pre=Z,t.Progress=$,t.Q=tt,t.Script=et,t.Select=nt,t.Source=ot,t.Span=rt,t.AurumRouter=at,t.Suspense=ct,t.Switch=it,t.Style=st,t.Sub=pt,t.Summary=ut,t.Sup=lt,t.Svg=ht,t.Table=dt,t.Tbody=ft,t.Td=yt,t.TextArea=vt,t.Tfoot=_t,t.Th=bt,t.Thead=mt,t.Time=gt,t.Title=wt,t.Tr=xt,t.Ul=Ot,t.Video=jt,t.Body=kt,t.Head=Ct,t.DataSource=o,t.ArrayDataSource=r,t.SortedArrayView=a,t.FilteredArrayView=c,t.ObjectDataSource=St,t.Aurum=Tt,t.CancellationToken=u});
//# sourceMappingURL=aurumjs.umd.js.map
