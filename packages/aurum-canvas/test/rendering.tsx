import { ArrayDataSource, DataSource, Aurum, CancellationToken } from 'aurumjs';
import { AurumCanvas, AurumGroup, AurumRectangle } from '../src/aurum-canvas';

describe('rendering', () => {
    let token: CancellationToken;
    afterEach(() => {
        token.cancel();
    });

    it('aurum canvas', () => {
        token = Aurum.attach(<AurumCanvas></AurumCanvas>, document.getElementById('target'));
    });

    it('group', () => {
        token = Aurum.attach(
            <AurumCanvas>
                <AurumGroup></AurumGroup>
            </AurumCanvas>,
            document.getElementById('target')
        );
    });

    it('rectangle', () => {
        token = Aurum.attach(
            <AurumCanvas>
                <AurumGroup>
                    <AurumRectangle x={2} y={3} width={4} height={5} fillColor="red"></AurumRectangle>
                </AurumGroup>
            </AurumCanvas>,
            document.getElementById('target')
        );
    });

    it('datasource', () => {
        const ds = new DataSource();
        token = Aurum.attach(
            <AurumCanvas>
                <AurumGroup>{ds}</AurumGroup>
            </AurumCanvas>,
            document.getElementById('target')
        );
        ds.update(<AurumRectangle x={2} y={3} width={4} height={5} fillColor="red"></AurumRectangle>);
        ds.update(<AurumRectangle x={20} y={30} width={4} height={5} fillColor="red"></AurumRectangle>);
        ds.update(undefined);
    });

    it('arraydatasource', () => {
        const ds = new ArrayDataSource();
        token = Aurum.attach(
            <AurumCanvas>
                <AurumGroup>{ds}</AurumGroup>
            </AurumCanvas>,
            document.getElementById('target')
        );
        ds.push(<AurumRectangle x={2} y={3} width={4} height={5} fillColor="red"></AurumRectangle>);
        ds.push(<AurumRectangle x={20} y={30} width={4} height={5} fillColor="red"></AurumRectangle>);
    });
});
