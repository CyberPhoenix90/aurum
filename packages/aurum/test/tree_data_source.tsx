import { assert } from 'chai';
import { ArrayDataSource, CancellationToken, TreeDataSource } from '../src/aurumjs';

describe('TreeDatasource', () => {
    let attachToken: CancellationToken;

    const dynamicNode: ArrayDataSource<Tree> = new ArrayDataSource([
        {
            id: '4',
            children: []
        } as Tree
    ]);
    type Tree = { id: string; children: Tree[] | ArrayDataSource<Tree> };

    const tree: Tree[] = [
        {
            id: '1',
            children: [
                {
                    id: '1.1',
                    children: [
                        {
                            id: '3',
                            children: [
                                {
                                    id: '5',
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    id: '2',
                    children: dynamicNode
                }
            ]
        }
    ];

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('should list all nodes', () => {
        const a = new TreeDataSource('children', tree);
        assert.deepEqual(
            a
                .createArrayDataSourceOfNodes(attachToken)
                .toArray()
                .map((e) => e.id),
            ['1', '1.1', '3', '5', '2', '4']
        );
    });

    it('iterate nodes', () => {
        const a = new TreeDataSource('children', tree);
        assert.deepEqual(
            Array.from(a).map((e) => e.id),
            ['1', '1.1', '3', '5', '2', '4']
        );
    });

    it('map nodes', () => {
        const a = new TreeDataSource('children', tree);
        const mapped = a.map((i) => ({ n: i.id, children: i.children }));
        assert.deepEqual(
            Array.from(mapped).map((e) => e.n),
            ['1', '1.1', '3', '5', '2', '4']
        );

        dynamicNode.push({
            id: '6',
            children: []
        });

        assert.deepEqual(
            Array.from(mapped).map((e) => e.n),
            ['1', '1.1', '3', '5', '2', '4', '6']
        );
    });
});
