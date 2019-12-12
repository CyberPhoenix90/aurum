import { AurumElement } from './aurum_element';
export class Switch extends AurumElement {
    constructor(props, children) {
        super(props, children, 'switch');
        this.firstRender = true;
        this.templateMap = props.templateMap;
        this.renderSwitch(props.state.value);
        props.state.listen((data) => {
            this.renderSwitch(data);
        }, this.cancellationToken);
    }
    selectTemplate(ref) {
        var _a;
        if (ref === undefined || ref === null) {
            return this.template;
        }
        else {
            return _a = this.templateMap[ref], (_a !== null && _a !== void 0 ? _a : this.template);
        }
    }
    renderSwitch(data) {
        var _a;
        if (data !== this.lastValue || this.firstRender) {
            this.lastValue = data;
            this.firstRender = false;
            const template = this.selectTemplate((_a = data) === null || _a === void 0 ? void 0 : _a.toString());
            if (template !== this.lastTemplate) {
                this.lastTemplate = template;
                this.clearChildren();
                if (template) {
                    const result = template.generate();
                    this.addChild(result);
                }
            }
        }
    }
}
//# sourceMappingURL=switch.js.map