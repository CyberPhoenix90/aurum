import { AurumElement } from './aurum_element';
import { EventEmitter } from '../../utilities/event_emitter';
import { DataSource } from '../../stream/data_source';
import { AurumTextElement } from './aurum_text';
export class AurumFragment {
    constructor(props, children) {
        this.onChange = new EventEmitter();
        this.children = [];
        if (props.repeatModel) {
            this.handleRepeat(props.repeatModel);
        }
        else if (children) {
            this.addChildren(children);
        }
    }
    addChildren(children) {
        for (const child of children) {
            if (child instanceof AurumElement) {
                this.children.push(child);
            }
            else if (child instanceof DataSource) {
                let sourceChild = undefined;
                child.unique(this.cancellationToken).listenAndRepeat((newValue) => {
                    if ((newValue === undefined || newValue === null) && sourceChild) {
                        this.children.splice(this.children.indexOf(sourceChild), 1);
                        sourceChild = undefined;
                        this.onChange.fire();
                    }
                    else if (typeof newValue === 'string') {
                        if (!sourceChild) {
                            const textNode = new AurumTextElement(child);
                            this.children.push(textNode);
                            sourceChild = textNode;
                            this.onChange.fire();
                        }
                        else if (sourceChild instanceof AurumElement) {
                            const textNode = new AurumTextElement(child);
                            this.children.splice(this.children.indexOf(sourceChild), 1, textNode);
                            sourceChild = textNode;
                            this.onChange.fire();
                        }
                    }
                    else if (newValue instanceof AurumElement) {
                        if (!sourceChild) {
                            this.children.push(newValue);
                            sourceChild = newValue;
                            this.onChange.fire();
                        }
                        else if (sourceChild instanceof AurumTextElement || sourceChild !== newValue) {
                            this.children.splice(this.children.indexOf(sourceChild), 1, newValue);
                            sourceChild = newValue;
                            this.onChange.fire();
                        }
                    }
                });
            }
            else {
                throw new Error('case not yet implemented');
            }
        }
    }
    handleRepeat(dataSource) {
        dataSource.listenAndRepeat((change) => {
            switch (change.operationDetailed) {
                case 'replace':
                    this.children[change.index] = change.items[0];
                    break;
                case 'swap':
                    const itemA = this.children[change.index];
                    const itemB = this.children[change.index2];
                    this.children[change.index2] = itemA;
                    this.children[change.index] = itemB;
                    break;
                case 'append':
                    this.children = this.children.concat(change.items);
                    break;
                case 'prepend':
                    this.children.unshift(...change.items);
                    break;
                case 'remove':
                case 'removeLeft':
                case 'removeRight':
                    this.children.splice(change.index, change.count);
                    break;
                case 'clear':
                    this.children = [];
                    break;
                default:
                    throw new Error('unhandled operation');
            }
            this.onChange.fire();
        });
    }
    dispose() {
        if (this.cancellationToken.isCanceled) {
            return;
        }
        this.cancellationToken.cancel();
    }
}
//# sourceMappingURL=aurum_fragment.js.map