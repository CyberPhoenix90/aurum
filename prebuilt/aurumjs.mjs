var t=function(){this.subscribeChannel=[],this.onAfterFire=[]},e={subscriptions:{configurable:!0}};e.subscriptions.get=function(){return this.subscribeChannel.length},t.prototype.subscribe=function(t,e){return this.createSubscription(t,this.subscribeChannel,e).facade},t.prototype.hasSubscriptions=function(){return this.subscriptions>0},t.prototype.cancelAll=function(){this.subscribeChannel.length=0},t.prototype.fireFiltered=function(t,e){this.isFiring=!0;for(var n=this.subscribeChannel.length,o=0;o<n;o++)this.subscribeChannel[o].callback!==e&&this.subscribeChannel[o].callback(t);this.isFiring=!1,this.afterFire()},t.prototype.afterFire=function(){this.onAfterFire.length>0&&(this.onAfterFire.forEach(function(t){return t()}),this.onAfterFire.length=0)},t.prototype.fire=function(t){this.isFiring=!0;for(var e=this.subscribeChannel.length,n=0;n<e;n++)this.subscribeChannel[n].callback(t);this.isFiring=!1,this.afterFire()},t.prototype.createSubscription=function(t,e,n){var o=this,r={callback:t},i={cancel:function(){o.cancel(r,e)}};return void 0!==n&&n.addCancelable(function(){return o.cancel(r,e)}),e.push(r),{subscription:r,facade:i}},t.prototype.cancel=function(t,e){var n=this,o=e.indexOf(t);o>=0&&(this.isFiring?this.onAfterFire.push(function(){return n.cancel(t,e)}):e.splice(o,1))},Object.defineProperties(t.prototype,e);var n=function(e){this.value=e,this.updateEvent=new t};n.prototype.update=function(t){if(this.updating)throw new Error("Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed");this.updating=!0,this.value=t,this.updateEvent.fire(t),this.updating=!1},n.prototype.backPropagate=function(t,e){this.value=e,this.updating=!0,this.updateEvent.fireFiltered(e,t),this.updating=!1},n.prototype.listenAndRepeat=function(t,e){return t(this.value),this.listen(t,e)},n.prototype.listen=function(t,e){return this.updateEvent.subscribe(t,e).cancel},n.prototype.filter=function(t,e){var o=new n;return this.listen(function(e){t(e)&&o.update(e)},e),o},n.prototype.filterDuplex=function(t,e){var o=this,r=new n,i=function(e){t(e)&&r.backPropagate(a,e)},a=function(e){t(e)&&o.backPropagate(i,e)};return this.listen(i,e),r.listen(a,e),r},n.prototype.pipe=function(t,e){this.listen(function(e){return t.update(e)},e)},n.prototype.pipeDuplex=function(t,e){var n=this,o=function(e){return t.backPropagate(r,e)},r=function(t){return n.backPropagate(o,t)};this.listen(o,e),t.listen(r,e)},n.prototype.map=function(t,e){var o=new n(t(this.value));return this.listen(function(e){o.update(t(e))},e),o},n.prototype.mapDuplex=function(t,e,o){var r=this,i=new n(t(this.value)),a=function(e){return i.backPropagate(c,t(e))},c=function(t){return r.backPropagate(a,e(t))};return this.listen(a,o),i.listen(c,o),i},n.prototype.unique=function(t){var e=new n(this.value);return this.listen(function(t){t!==e.value&&e.update(t)},t),e},n.prototype.uniqueDuplex=function(t){var e=this,o=new n(this.value),r=function(t){t!==o.value&&o.backPropagate(i,t)},i=function(t){t!==e.value&&e.backPropagate(r,t)};return this.listen(r,t),o.listen(i,t),o},n.prototype.reduce=function(t,e,o){var r=new n(e);return this.listen(function(e){return r.update(t(r.value,e))},o),r},n.prototype.aggregate=function(t,e,o){var r=this,i=new n(e(this.value,t.value));return this.listen(function(){return i.update(e(r.value,t.value))},o),t.listen(function(){return i.update(e(r.value,t.value))},o),i},n.prototype.combine=function(t,e){var o=new n;return this.pipe(o,e),t.pipe(o,e),o},n.prototype.debounce=function(t,e){var o,r=new n;return this.listen(function(e){clearTimeout(o),o=setTimeout(function(){r.update(e)},t)},e),r},n.prototype.buffer=function(t,e){var o,r=new n,i=[];return this.listen(function(e){i.push(e),o||(o=setTimeout(function(){o=void 0,r.update(i),i=[]},t))},e),r},n.prototype.queue=function(t,e){var n=new o;return this.listen(function(t){n.push(t)},e),n},n.prototype.pick=function(t,e){var o,r=new n(null===(o=this.value)||void 0===o?void 0:o[t]);return this.listen(function(e){r.update(null!=e?e[t]:e)},e),r},n.prototype.cancelAll=function(){this.updateEvent.cancelAll()};var o=function(e){this.data=e?e.slice():[],this.updateEvent=new t},r={length:{configurable:!0}};o.prototype.listenAndRepeat=function(t,e){return t({operation:"add",operationDetailed:"append",index:0,items:this.data,newState:this.data,count:this.data.length}),this.listen(t,e)},o.prototype.listen=function(t,e){return this.updateEvent.subscribe(t,e).cancel},r.length.get=function(){return this.data.length},o.prototype.getData=function(){return this.data.slice()},o.prototype.get=function(t){return this.data[t]},o.prototype.set=function(t,e){var n=this.data[t];n!==e&&(this.data[t]=e,this.update({operation:"replace",operationDetailed:"replace",target:n,count:1,index:t,items:[e],newState:this.data}))},o.prototype.swap=function(t,e){if(t!==e){var n=this.data[t],o=this.data[e];this.data[e]=n,this.data[t]=o,this.update({operation:"swap",operationDetailed:"swap",index:t,index2:e,items:[n,o],newState:this.data})}},o.prototype.swapItems=function(t,e){if(t!==e){var n=this.data.indexOf(t),o=this.data.indexOf(e);-1!==n&&-1!==o&&(this.data[o]=t,this.data[n]=e),this.update({operation:"swap",operationDetailed:"swap",index:n,index2:o,items:[t,e],newState:this.data})}},o.prototype.push=function(){for(var t,e=[],n=arguments.length;n--;)e[n]=arguments[n];(t=this.data).push.apply(t,e),this.update({operation:"add",operationDetailed:"append",count:e.length,index:this.data.length-e.length,items:e,newState:this.data})},o.prototype.unshift=function(){for(var t,e=[],n=arguments.length;n--;)e[n]=arguments[n];(t=this.data).unshift.apply(t,e),this.update({operation:"add",operationDetailed:"prepend",count:e.length,items:e,index:0,newState:this.data})},o.prototype.pop=function(){var t=this.data.pop();return this.update({operation:"remove",operationDetailed:"removeRight",count:1,index:this.data.length,items:[t],newState:this.data}),t},o.prototype.merge=function(t){for(var e=0;e<t.length;e++)this.data[e]!==t[e]&&(this.length>e?this.set(e,t[e]):this.push(t[e]));this.length>t.length&&this.removeRight(this.length-t.length)},o.prototype.removeRight=function(t){var e=this.data.splice(this.length-t,t);this.update({operation:"remove",operationDetailed:"removeRight",count:t,index:this.length-t,items:e,newState:this.data})},o.prototype.removeLeft=function(t){var e=this.data.splice(0,t);this.update({operation:"remove",operationDetailed:"removeLeft",count:t,index:0,items:e,newState:this.data})},o.prototype.remove=function(t){var e=this.data.indexOf(t);-1!==e&&(this.data.splice(e,1),this.update({operation:"remove",operationDetailed:"remove",count:1,index:e,items:[t],newState:this.data}))},o.prototype.clear=function(){var t=this.data;this.data=[],this.update({operation:"remove",operationDetailed:"clear",count:t.length,index:0,items:t,newState:this.data})},o.prototype.shift=function(){var t=this.data.shift();return this.update({operation:"remove",operationDetailed:"removeLeft",items:[t],count:1,index:0,newState:this.data}),t},o.prototype.toArray=function(){return this.data.slice()},o.prototype.sort=function(t,e){return new i(this,t,e)},o.prototype.filter=function(t,e){return new a(this,t,e)},o.prototype.forEach=function(t,e){return this.data.forEach(t,e)},o.prototype.toDataSource=function(){var t=new n(this.data);return this.listen(function(e){t.update(e.newState)}),t},o.prototype.update=function(t){this.updateEvent.fire(t)},Object.defineProperties(o.prototype,r);var i=function(t){function e(e,n,o){var r=this,i=e.data.slice().sort(n);t.call(this,i),this.comparator=n,e.listen(function(t){var e,n;switch(t.operationDetailed){case"removeLeft":r.removeLeft(t.count);break;case"removeRight":r.removeRight(t.count);break;case"remove":r.remove(t.items[0]);break;case"clear":r.data.length=0;break;case"prepend":(e=r).unshift.apply(e,t.items),r.data.sort(r.comparator);break;case"append":(n=r).push.apply(n,t.items),r.data.sort(r.comparator);break;case"swap":break;case"replace":r.set(t.index,t.items[0]),r.data.sort(r.comparator)}},o)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(o),a=function(t){function e(e,n,o){var r=this,i=e.data.filter(n);t.call(this,i),this.parent=e,this.viewFilter=n,e.listen(function(t){var e,n,o;switch(t.operationDetailed){case"removeLeft":case"removeRight":case"remove":case"clear":for(var i=0,a=t.items;i<a.length;i+=1)r.remove(a[i]);break;case"prepend":o=t.items.filter(r.viewFilter),(e=r).unshift.apply(e,o);break;case"append":o=t.items.filter(r.viewFilter),(n=r).push.apply(n,o);break;case"swap":var c=r.data.indexOf(t.items[0]),s=r.data.indexOf(t.items[1]);-1!==c&&-1!==s&&r.swap(c,s);break;case"replace":var p=r.data.indexOf(t.target);-1!==p&&(r.viewFilter(t.items[0])?r.set(p,t.items[0]):r.remove(t.target))}},o)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.updateFilter=function(t){this.viewFilter!==t&&(this.viewFilter=t,this.refresh())},e.prototype.refresh=function(){var t;this.clear();var e=this.parent.data.filter(this.viewFilter);(t=this).push.apply(t,e)},e}(o),c=function(t){this.data=t};c.prototype.deleteNext=function(){if(this.next){var t=this.next.next;this.next.next=void 0,this.next.previous=void 0,this.next=t,this.next&&(this.next.previous=this)}},c.prototype.deletePrevious=function(){if(this.previous){var t=this.previous.previous;this.previous.next=void 0,this.previous.previous=void 0,this.previous=t,this.previous&&(this.previous.next=this)}};var s=function(t){var e=this;void 0===t&&(t=[]),this.length=0,t.forEach(function(t){return e.append(t)})};s.prototype.find=function(t){for(var e=this.rootNode;e&&!t(e);)e=e.next;return e},s.prototype.append=function(t){return this.rootNode||this.lastNode?(this.lastNode.next=new c(t),this.lastNode.next.previous=this.lastNode,this.lastNode=this.lastNode.next):this.rootNode=this.lastNode=new c(t),this.length++,t},s.prototype.forEach=function(t){this.find(function(e){return t(e.data),!1})},s.prototype.prepend=function(t){return this.rootNode||this.lastNode?(this.rootNode.previous=new c(t),this.rootNode.previous.next=this.rootNode,this.rootNode=this.rootNode.previous):this.rootNode=this.lastNode=new c(t),this.length++,t},s.prototype.remove=function(t){if(t===this.rootNode.data)this.rootNode=this.rootNode===this.lastNode?this.lastNode=void 0:this.rootNode.next,this.length--;else{var e=this.find(function(e){return e.next&&e.next.data===t});e&&(e.next===this.lastNode&&(this.lastNode=e),e.deleteNext(),this.length--)}};var p=function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];this.cancelables=new s(t),this._isCancelled=!1},u={isCanceled:{configurable:!0}};u.isCanceled.get=function(){return this._isCancelled},p.prototype.addCancelable=function(t){return this.throwIfCancelled("attempting to add cancellable to token that is already cancelled"),this.cancelables.append(t),this.cancelables.length>200&&console.log("potential memory leak: cancellation token has over 200 clean up calls"),this},p.prototype.removeCancelable=function(t){return this.throwIfCancelled("attempting to remove cancellable from token that is already cancelled"),this.cancelables.remove(t),this},p.prototype.addDisposable=function(t){return this.addCancelable(function(){return t.dispose()}),this},p.prototype.callIfNotCancelled=function(t){this.isCanceled||t()},p.prototype.setTimeout=function(t,e){var n=this;void 0===e&&(e=0);var o=setTimeout(function(){n.removeCancelable(r),t()},e),r=function(){return clearTimeout(o)};this.addCancelable(r)},p.prototype.setInterval=function(t,e){var n=setInterval(t,e);this.addCancelable(function(){return clearInterval(n)})},p.prototype.requestAnimationFrame=function(t){var e=requestAnimationFrame(t);this.addCancelable(function(){return cancelAnimationFrame(e)})},p.prototype.animationLoop=function(t){var e=requestAnimationFrame(function n(o){t(o),e=requestAnimationFrame(n)});this.addCancelable(function(){return cancelAnimationFrame(e)})},p.prototype.throwIfCancelled=function(t){if(this.isCanceled)throw new Error(t||"cancellation token is cancelled")},p.prototype.chain=function(t,e){return void 0===e&&(e=!1),e&&t.chain(this,!1),this.addCancelable(function(){return t.cancel()}),this},p.prototype.registerDomEvent=function(t,e,n){return t.addEventListener(e,n),this.addCancelable(function(){return t.removeEventListener(e,n)}),this},p.prototype.cancel=function(){this.isCanceled||(this._isCancelled=!0,this.cancelables.forEach(function(t){return t()}),this.cancelables=void 0)},Object.defineProperties(p.prototype,u);var l=Symbol("owner"),h=function(t,e){var n,o;this.onDispose=t.onDispose,this.onAttach=t.onAttach,this.onDetach=t.onDetach,this.domNodeName=e,this.template=t.template,this.cancellationToken=new p,this.node=this.create(t),this.initialize(t),null===(o=(n=t).onCreate)||void 0===o||o.call(n,this)};h.prototype.initialize=function(t){this.node instanceof Text||(this.children=[]),this.createEventHandlers(["drag","name","dragstart","dragend","dragexit","dragover","dragenter","dragleave","blur","focus","click","dblclick","keydown","keyhit","keyup","mousedown","mouseup","mousemouse","mouseenter","mouseleave","mousewheel"],t);var e=Object.keys(t).filter(function(t){return t.includes("-")});this.bindProps(["id","draggable","tabindex","style","role","contentEditable"].concat(e),t),t.class&&this.handleClass(t.class),t.repeatModel&&this.handleRepeat(t.repeatModel)},h.prototype.bindProps=function(t,e){for(var n=0,o=t;n<o.length;n+=1){var r=o[n];e[r]&&this.assignStringSourceToAttribute(e[r],r)}},h.prototype.createEventHandlers=function(t,e){var o=this;if(!(this.node instanceof Text))for(var r=function(){var t=a[i],r="on"+t[0].toUpperCase()+t.slice(1),c=void 0;Object.defineProperty(o,r,{get:function(){return c||(c=new n),c},set:function(){throw new Error(r+" is read only")}}),e[r]&&(e[r]instanceof n?o[r].listen(e[r].update.bind(e.onClick),o.cancellationToken):"function"==typeof e[r]&&o[r].listen(e[r],o.cancellationToken),o.cancellationToken.registerDomEvent(o.node,t,function(t){return o[r].update(t)}))},i=0,a=t;i<a.length;i+=1)r()},h.prototype.handleRepeat=function(t){var e,n=this;this.repeatData=t instanceof o?t:new o(t),this.repeatData.length&&((e=this.children).push.apply(e,this.repeatData.toArray().map(function(t){return n.template.generate(t)})),this.render()),this.repeatData.listen(function(t){var e,o,r;switch(t.operationDetailed){case"swap":var i=n.children[t.index2];n.children[t.index2]=n.children[t.index],n.children[t.index]=i;break;case"append":(e=n.children).push.apply(e,t.items.map(function(t){return n.template.generate(t)}));break;case"prepend":(o=n.children).unshift.apply(o,t.items.map(function(t){return n.template.generate(t)}));break;case"remove":case"removeLeft":case"removeRight":case"clear":n.children.splice(t.index,t.count);break;default:n.children.length=0,(r=n.children).push.apply(r,n.repeatData.toArray().map(function(t){return n.template.generate(t)}))}n.render()})},h.prototype.render=function(){var t=this;this.rerenderPending||this.node instanceof Text||(this.cancellationToken.setTimeout(function(){for(var e=0;e<t.children.length;e++){if(t.node.childNodes.length<=e){t.addChildrenDom(t.children.slice(e,t.children.length));break}if(t.node.childNodes[e][l]!==t.children[e]){if(!t.children.includes(t.node.childNodes[e][l])){var n=t.node.childNodes[e];n.remove(),n[l].dispose(),e--;continue}var o=t.getChildIndex(t.children[e].node);-1!==o?t.swapChildrenDom(e,o):t.addDomNodeAt(t.children[e].node,e)}}for(;t.node.childNodes.length>t.children.length;){var r=t.node.childNodes[t.node.childNodes.length-1];t.node.removeChild(r),r[l].dispose()}t.rerenderPending=!1}),this.rerenderPending=!0)},h.prototype.assignStringSourceToAttribute=function(t,e){var n=this;this.node instanceof Text||("string"==typeof t?this.node.setAttribute(e,t):(t.value&&this.node.setAttribute(e,t.value),t.unique(this.cancellationToken).listen(function(t){return n.node.setAttribute(e,t)},this.cancellationToken)))},h.prototype.handleAttach=function(){var t;if(this.node.isConnected){null===(t=this.onAttach)||void 0===t||t.call(this,this);for(var e=0,n=this.node.childNodes;e<n.length;e+=1)n[e][l].handleAttach()}},h.prototype.handleDetach=function(){var t;if(!this.node.isConnected){null===(t=this.onDetach)||void 0===t||t.call(this,this);for(var e=0,n=this.node.childNodes;e<n.length;e+=1){var o=n[e];o[l]&&o[l].handleDetach()}}},h.prototype.handleClass=function(t){var e=this;if(!(this.node instanceof Text))if("string"==typeof t)this.node.className=t;else if(t instanceof n)t.value&&(Array.isArray(t.value)?(this.node.className=t.value.join(" "),t.unique(this.cancellationToken).listen(function(){e.node.className=t.value.join(" ")},this.cancellationToken)):(this.node.className=t.value,t.unique(this.cancellationToken).listen(function(){e.node.className=t.value},this.cancellationToken))),t.unique(this.cancellationToken).listen(function(t){return e.node.className=t},this.cancellationToken);else{var o=t.reduce(function(t,e){return"string"==typeof e?t+" "+e:e.value?t+" "+e.value:t},"");this.node.className=o;for(var r=0,i=t;r<i.length;r+=1){var a=i[r];a instanceof n&&a.unique(this.cancellationToken).listen(function(n){var o=t.reduce(function(t,e){return"string"==typeof e?t+" "+e:e.value?t+" "+e.value:t},"");e.node.className=o},this.cancellationToken)}}},h.prototype.resolveStringSource=function(t){return"string"==typeof t?t:t.value},h.prototype.create=function(t){var e=document.createElement(this.domNodeName);return e[l]=this,e},h.prototype.getChildIndex=function(t){for(var e=0,n=0,o=t.childNodes;n<o.length;n+=1){if(o[n]===t)return e;e++}return-1},h.prototype.hasChild=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");for(var e=0,n=t.children;e<n.length;e+=1)if(n[e]===t)return!0;return!1},h.prototype.addChildrenDom=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");for(var e=0,n=t;e<n.length;e+=1){var o=n[e];this.node.appendChild(o.node),o.handleAttach()}},h.prototype.swapChildrenDom=function(t,e){if(this.node instanceof Text)throw new Error("Text nodes don't have children");if(t!==e){var n=this.node.children[t],o=this.node.children[e];n.remove(),o.remove(),t<e?(this.addDomNodeAt(o,t),this.addDomNodeAt(n,e)):(this.addDomNodeAt(n,e),this.addDomNodeAt(o,t))}},h.prototype.addDomNodeAt=function(t,e){if(this.node instanceof Text)throw new Error("Text nodes don't have children");e>=this.node.childElementCount?(this.node.appendChild(t),t[l].handleAttach()):(this.node.insertBefore(t,this.node.children[e]),t[l].handleAttach())},h.prototype.remove=function(){this.hasParent()&&this.node.parentElement[l].removeChild(this.node)},h.prototype.hasParent=function(){return!!this.node.parentElement},h.prototype.isConnected=function(){return this.node.isConnected},h.prototype.removeChild=function(t){var e=this.children.indexOf(t);-1!==e&&this.children.splice(e,1),this.render()},h.prototype.removeChildAt=function(t){this.children.splice(t,1),this.render()},h.prototype.swapChildren=function(t,e){if(t!==e){var n=this.children[t];this.children[t]=this.children[e],this.children[e]=n,this.render()}},h.prototype.clearChildren=function(){if(this.node instanceof Text)throw new Error("Text nodes don't have children");this.children.length=0,this.render()},h.prototype.addChild=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");t instanceof d||(t=this.childNodeToAurum(t),this.children.push(t),this.render())},h.prototype.childNodeToAurum=function(t){return"string"==typeof t||t instanceof n?t=new f({text:t}):t instanceof h||(t=new f({text:t.toString()})),t},h.prototype.addChildAt=function(t,e){if(this.node instanceof Text)throw new Error("Text nodes don't have children");t instanceof d||(t=this.childNodeToAurum(t),this.children.splice(e,0,t),this.render())},h.prototype.addChildren=function(t){if(this.node instanceof Text)throw new Error("Text nodes don't have children");if(0!==t.length)for(var e=0,n=t;e<n.length;e+=1)this.addChild(n[e])},h.prototype.dispose=function(){this.internalDispose(!0)},h.prototype.internalDispose=function(t){var e;this.cancellationToken.cancel(),t&&this.remove();for(var n=0,o=this.node.childNodes;n<o.length;n+=1){var r=o[n];r[l]&&r[l].internalDispose(!1)}delete this.node[l],delete this.node,null===(e=this.onDispose)||void 0===e||e.call(this,this)};var d=function(t){function e(e){t.call(this,e,"template"),this.ref=e.ref,this.generate=e.generator}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),f=function(t){function e(e){var o=this;t.call(this,e,"textNode"),e.text instanceof n&&e.text.listen(function(t){return o.node.textContent=t},this.cancellationToken)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.create=function(t){var e=document.createTextNode(this.resolveStringSource(t.text));return e[l]=this,e},e}(h),y=function(t){function e(e){t.call(this,e,"a"),this.bindProps(["href","target"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),v=function(t){function e(e){t.call(this,e,"abbr")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),_=function(t){function e(e){t.call(this,e,"area")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),b=function(t){function e(e){t.call(this,e,"article")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),m=function(t){function e(e){t.call(this,e,"aside")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),g=function(t){function e(e){t.call(this,e,"audio"),this.bindProps(["controls","autoplay","loop","muted","preload","src"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),w=function(t){function e(e){t.call(this,e,"b")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),x=function(t){function e(e){t.call(this,e,"br")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),O=function(t){function e(e){t.call(this,e,"button"),this.bindProps(["disabled"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),j=function(t){function e(e){t.call(this,e,"canvas"),this.bindProps(["width","height"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),k=function(t){function e(e){t.call(this,e,"data"),this.bindProps(["datalue"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),C=function(t){function e(e){t.call(this,e,"details")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),N=function(t){function e(e){t.call(this,e,"div")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),T=function(t){function e(e){t.call(this,e,"em")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),E=function(t){function e(e){t.call(this,e,"footer")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),A=function(t){function e(e){t.call(this,e,"form")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),D=function(t){function e(e){t.call(this,e,"h1")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),S=function(t){function e(e){t.call(this,e,"h2")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),P=function(t){function e(e){t.call(this,e,"h3")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),F=function(t){function e(e){t.call(this,e,"h4")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),I=function(t){function e(e){t.call(this,e,"h5")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),V=function(t){function e(e){t.call(this,e,"h6")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),q=function(t){function e(e){t.call(this,e,"header")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),R=function(t){function e(e){t.call(this,e,"heading")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),L=function(t){function e(e){t.call(this,e,"i")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),K=function(t){function e(e){t.call(this,e,"iframe"),this.bindProps(["src","srcdoc","width","height","allow","allowFullscreen","allowPaymentRequest"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),M=function(t){function e(e){t.call(this,e,"img"),this.bindProps(["src","alt","width","height","referrerPolicy","sizes","srcset","useMap"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),H=function(t){function e(e){var n,o=this;t.call(this,e,"input"),e.inputValueSource?e.inputValueSource.unique().listenAndRepeat(function(t){return o.node.value=t},this.cancellationToken):this.node.value=null!=(n=e.initialValue)?n:"",this.bindProps(["placeholder","readonly","disabled","accept","alt","autocomplete","autofocus","checked","defaultChecked","formAction","formEnctype","formMethod","formNoValidate","formTarget","max","maxLength","min","minLength","pattern","multiple","required","type"],e),this.createEventHandlers(["input","change"],e),e.inputValueSource&&this.node.addEventListener("input",function(){e.inputValueSource.update(o.node.value)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),z=function(t){function e(e){t.call(this,e,"label"),this.bindProps(["for"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),U=function(t){function e(e){t.call(this,e,"li")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),B=function(t){function e(e){t.call(this,e,"link"),this.bindProps(["href","rel","media","as","disabled","type"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),G=function(t){function e(e){t.call(this,e,"nav")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),J=function(t){function e(e){t.call(this,e,"noscript")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),Q=function(t){function e(e){t.call(this,e,"ol")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),W=function(t){function e(e){t.call(this,e,"option")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),X=function(t){function e(e){t.call(this,e,"p")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),Y=function(t){function e(e){t.call(this,e,"pre")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),Z=function(t){function e(e){t.call(this,e,"progress"),this.bindProps(["max","value"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),$=function(t){function e(e){t.call(this,e,"q")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),tt=function(t){function e(e){t.call(this,e,"script"),this.bindProps(["src","async","defer","integrity","noModule","type"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),et=function(t){function e(e){var n,o=this;t.call(this,e,"select"),this.createEventHandlers(["change"],e),e.selectedIndexSource?(this.selectedIndexSource=e.selectedIndexSource,e.selectedIndexSource.unique().listenAndRepeat(function(t){return o.node.selectedIndex=t},this.cancellationToken)):this.node.selectedIndex=null!=(n=e.initialSelection)?n:-1,e.selectedIndexSource&&this.node.addEventListener("change",function(){e.selectedIndexSource.update(o.node.selectedIndex)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.handleAttach=function(){t.prototype.handleAttach.call(this),this.selectedIndexSource&&(this.node.selectedIndex=this.selectedIndexSource.value)},e}(h),nt=function(t){function e(e){t.call(this,e,"source"),this.bindProps(["src","srcSet","media","sizes","type"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),ot=function(t){function e(e){t.call(this,e,"span")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),rt=function(t){function e(e){var n=this;t.call(this,e,"switch"),this.firstRender=!0,this.templateMap=e.templateMap,this.renderSwitch(e.state.value),e.state.listen(function(t){n.renderSwitch(t)},this.cancellationToken)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.renderSwitch=function(t){var e;if(t!==this.lastValue||this.firstRender)if(this.lastValue=t,this.firstRender=!1,this.clearChildren(),null!=t){var n=null!=(e=this.templateMap[t.toString()])?e:this.template;if(n){var o=n.generate();this.addChild(o)}}else if(this.template){var r=this.template.generate();this.addChild(r)}},e}(h),it=function(t){function e(e){var o=new n(location.hash.substring(1));t.call(this,Object.assign(Object.assign({},e),{state:o})),window.addEventListener("hashchange",function(){var t=location.hash.substring(1);t.includes("?")?o.update(t.substring(0,t.indexOf("?"))):o.update(t)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(rt),at=function(t){function e(e){var n=this;t.call(this,e,"suspense"),e.loader().then(function(t){n.clearChildren(),n.addChild(t)})}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),ct=function(t){function e(e){t.call(this,e,"style"),this.bindProps(["media"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),st=function(t){function e(e){t.call(this,e,"sub")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),pt=function(t){function e(e){t.call(this,e,"summary")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),ut=function(t){function e(e){t.call(this,e,"sup")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),lt=function(t){function e(e){t.call(this,e,"svg"),this.bindProps(["width","height"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),ht=function(t){function e(e){t.call(this,e,"table")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),dt=function(t){function e(e){t.call(this,e,"tbody")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),ft=function(t){function e(e){t.call(this,e,"td")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),yt=function(t){function e(e){var n,o,r,i=this;t.call(this,e,"textArea"),e.inputValueSource?(this.node.value=null!=(o=null!=(n=e.initialValue)?n:e.inputValueSource.value)?o:"",e.inputValueSource.unique().listen(function(t){return i.node.value=t},this.cancellationToken)):this.node.value=null!=(r=e.initialValue)?r:"",this.bindProps(["placeholder","readonly","disabled","rows","wrap","autocomplete","autofocus","max","maxLength","min","minLength","required","type"],e),this.createEventHandlers(["input","change"],e),e.inputValueSource&&this.onInput.map(function(t){return i.node.value}).pipe(e.inputValueSource)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),vt=function(t){function e(e){t.call(this,e,"tfoot")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),_t=function(t){function e(e){t.call(this,e,"th")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),bt=function(t){function e(e){t.call(this,e,"thead")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),mt=function(t){function e(e){t.call(this,e,"time"),this.bindProps(["datetime"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),gt=function(t){function e(e){t.call(this,e,"title")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),wt=function(t){function e(e){t.call(this,e,"tr")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),xt=function(t){function e(e){t.call(this,e,"ul")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),Ot=function(t){function e(e){t.call(this,e,"video"),this.bindProps(["controls","autoplay","loop","muted","preload","src","poster","width","height"],e)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),jt=function(t){function e(e){t.call(this,e,"body")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),kt=function(t){function e(e){t.call(this,e,"head")}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(h),Ct=function(e){e&&(this.data=e),this.updateEvent=new t,this.updateEventOnKey=new Map};Ct.prototype.pick=function(t,e){var o,r=new n(null===(o=this.data)||void 0===o?void 0:o[t]);return this.listenOnKey(t,function(t){r.update(t.newValue)},e),r},Ct.prototype.listen=function(t,e){return this.updateEvent.subscribe(t,e).cancel},Ct.prototype.listenOnKeyAndRepeat=function(t,e,n){return e({key:t,newValue:this.data[t],oldValue:void 0}),this.listenOnKey(t,e,n)},Ct.prototype.listenOnKey=function(e,n,o){return this.updateEventOnKey.has(e)||this.updateEventOnKey.set(e,new t),this.updateEventOnKey.get(e).subscribe(n,o).cancel},Ct.prototype.get=function(t){return this.data[t]},Ct.prototype.set=function(t,e){if(this.data[t]!==e){var n=this.data[t];this.data[t]=e,this.updateEvent.fire({oldValue:n,key:t,newValue:this.data[t]}),this.updateEventOnKey.has(t)&&this.updateEventOnKey.get(t).fire({oldValue:n,key:t,newValue:this.data[t]})}},Ct.prototype.assign=function(t){for(var e=0,n=Object.keys(t);e<n.length;e+=1){var o=n[e];this.set(o,t[o])}},Ct.prototype.toObject=function(){return Object.assign({},this.data)},Ct.prototype.toDataSource=function(){var t=this,e=new n(this.data);return this.listen(function(n){e.update(t.data)}),e};var Nt={button:O,div:N,input:H,li:U,span:ot,style:ct,ul:xt,p:X,img:M,link:B,canvas:j,a:y,article:b,br:x,form:A,label:z,ol:Q,pre:Y,progress:Z,table:ht,td:ft,tr:wt,th:_t,textarea:yt,h1:D,h2:S,h3:P,h4:F,h5:I,h6:V,header:q,footer:E,nav:G,b:w,i:L,script:tt,abbr:v,area:_,aside:m,audio:g,em:T,heading:R,iframe:K,noscript:J,option:W,q:$,select:et,source:nt,title:gt,video:Ot,tbody:dt,tfoot:vt,thead:bt,summary:pt,details:C,sub:st,sup:ut,svg:lt,data:k,time:mt,template:d},Tt=function(){};Tt.attach=function(t,e){if(e[l])throw new Error("This node is already managed by aurum and cannot be used");e.appendChild(t.node),t.handleAttach(),e[l]=t},Tt.detach=function(t){t[l]&&(t[l].node.remove(),t[l].handleDetach(),t[l].dispose(),t[l]=void 0)},Tt.factory=function(t,e){for(var n,o=[],r=arguments.length-2;r-- >0;)o[r]=arguments[r+2];if("string"==typeof t){var i=t;if(void 0===(t=Nt[t]))throw new Error("Node "+i+" does not exist or is not supported")}for(var a,c,s=(n=[]).concat.apply(n,o).filter(function(t){return t}),p={},u=!1,l=0,h=s;l<h.length;l+=1){var f=h[l];"string"!=typeof f&&(f instanceof d&&(!f.ref||"default"===f.ref)&&(a=f),f.ref&&(p[f.ref]=f,u=!0))}return e=null!=e?e:{},a&&(e.template=a),u&&(e.templateMap=p),(c=t.prototype?new t(e||{}):t(e||{})).addChildren(s),c};export{y as A,v as Abbr,_ as Area,b as Article,m as Aside,g as Audio,h as AurumElement,d as Template,f as TextNode,w as B,x as Br,O as Button,j as Canvas,k as Data,C as Details,N as Div,T as Em,E as Footer,A as Form,D as H1,S as H2,P as H3,F as H4,I as H5,V as H6,q as Header,R as Heading,L as I,K as IFrame,M as Img,H as Input,z as Label,U as Li,B as Link,G as Nav,J as NoScript,Q as Ol,W as Option,X as P,Y as Pre,Z as Progress,$ as Q,tt as Script,et as Select,nt as Source,ot as Span,it as AurumRouter,at as Suspense,rt as Switch,ct as Style,st as Sub,pt as Summary,ut as Sup,lt as Svg,ht as Table,dt as Tbody,ft as Td,yt as TextArea,vt as Tfoot,_t as Th,bt as Thead,mt as Time,gt as Title,wt as Tr,xt as Ul,Ot as Video,jt as Body,kt as Head,n as DataSource,o as ArrayDataSource,i as SortedArrayView,a as FilteredArrayView,Ct as ObjectDataSource,Tt as Aurum,p as CancellationToken};
//# sourceMappingURL=aurumjs.mjs.map
