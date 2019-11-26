import { AurumElement } from '../aurum_element';
export class Switch extends AurumElement {
    constructor(props) {
        super(props, 'switch');
        this.firstRender = true;
        this.templateMap = props.templateMap;
        this.renderSwitch(props.state.value);
        props.state.listen((data) => {
            this.renderSwitch(data);
        }, this.cancellationToken);
    }
    renderSwitch(data) {
        var _a;
        if (data !== this.lastValue || this.firstRender) {
            this.lastValue = data;
            this.firstRender = false;
            this.clearChildren();
            if (data !== undefined && data !== null) {
                const template = (_a = this.templateMap[data.toString()], (_a !== null && _a !== void 0 ? _a : this.template));
                if (template) {
                    const result = template.generate();
                    this.addChild(result);
                }
            }
            else if (this.template) {
                const result = this.template.generate();
                this.addChild(result);
            }
        }
    }
}
//# sourceMappingURL=switch.js.map