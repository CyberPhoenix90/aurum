import { CancellationToken } from 'aurumjs';
import { CommonEntity } from '../../models/entities.js';
import { SceneGraphNode } from '../../models/scene_graph.js';

export abstract class AbstractComponent {
    private token: CancellationToken;

    protected onAttach(entity: SceneGraphNode<CommonEntity>) {}

    protected onDetach() {}

    protected get cancellationToken(): CancellationToken {
        if (!this.token) {
            throw new Error(`Trying to use cancellation token before on attach was called`);
        }
        if (this.token.isCanceled) {
            console.warn(`Using cancellation token that was already cancelled`);
        }
        return this.token;
    }

    protected set cancellationToken(token: CancellationToken) {
        if (this.token) {
            throw new Error(`Cancellation token was already set`);
        }

        this.token = token;
    }

    public triggerOnAttach(entity: SceneGraphNode<CommonEntity>) {
        this.cancellationToken = new CancellationToken();
        this.onAttach(entity);
    }

    public triggerOnDetach() {
        this.cancellationToken.cancel();
        this.onDetach();
    }
}
