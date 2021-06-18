const { assert } = chai;
import { Container, LinearLayout } from "aurum-game-engine";
import { ArrayDataSource, Aurum } from "aurumjs";
import { renderRoot } from "../main";

describe("layout", () => {
    afterEach(() => {
        renderRoot.update(undefined);
    });

    it("linear layout", () => {
        renderRoot.update(
            <Container
                layout={
                    new LinearLayout({
                        initialOffset: { x: 10, y: 10 },
                        nodeOffset: { x: 20, y: 0 },
                    })
                }
                onAttach={(c) => {
                    assert(c.children.length.value === 3);
                    assert.deepEqual(
                        c.processedChildren.get(0).getAbsolutePosition(),
                        { x: 10, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(1).getAbsolutePosition(),
                        { x: 30, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(2).getAbsolutePosition(),
                        { x: 50, y: 10 }
                    );
                }}
            >
                <Container></Container>
                <Container></Container>
                <Container></Container>
            </Container>
        );
    });

    it("recompute layout on add", () => {
        const children = new ArrayDataSource([
            <Container></Container>,
            <Container></Container>,
            <Container></Container>,
        ]);

        renderRoot.update(
            <Container
                layout={
                    new LinearLayout({
                        initialOffset: { x: 10, y: 10 },
                        nodeOffset: { x: 20, y: 0 },
                    })
                }
                onAttach={(c) => {
                    assert(
                        c.processedChildren.get(0).processedChildren.length
                            .value === 3
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(0)
                            .processedChildren.get(0)
                            .getAbsolutePosition(),
                        { x: 10, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(0)
                            .processedChildren.get(1)
                            .getAbsolutePosition(),
                        { x: 30, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(0)
                            .processedChildren.get(2)
                            .getAbsolutePosition(),
                        { x: 50, y: 10 }
                    );
                    children.push(<Container />);
                    assert.deepEqual(
                        c.processedChildren
                            .get(0)
                            .processedChildren.get(3)
                            .getAbsolutePosition(),
                        { x: 70, y: 10 }
                    );
                }}
            >
                {children}
            </Container>
        );
    });

    it("recompute layout on remove", () => {
        const children = new ArrayDataSource([
            <Container></Container>,
            <Container></Container>,
            <Container></Container>,
        ]);

        renderRoot.update(
            <Container
                layout={
                    new LinearLayout({
                        initialOffset: { x: 10, y: 10 },
                        nodeOffset: { x: 20, y: 0 },
                    })
                }
                onAttach={(c) => {
                    assert(
                        c.processedChildren.get(0).processedChildren.length
                            .value === 3
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(0)
                            .processedChildren.get(0)
                            .getAbsolutePosition(),
                        { x: 10, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(0)
                            .processedChildren.get(1)
                            .getAbsolutePosition(),
                        { x: 30, y: 10 }
                    );
                    const c2 = c.processedChildren
                        .get(0)
                        .processedChildren.get(2);
                    assert.deepEqual(c2.getAbsolutePosition(), {
                        x: 50,
                        y: 10,
                    });
                    children.removeAt(1);
                    assert.deepEqual(c2.getAbsolutePosition(), {
                        x: 30,
                        y: 10,
                    });
                }}
            >
                {children}
            </Container>
        );
    });

    it("linear layout ignore", () => {
        renderRoot.update(
            <Container
                layout={
                    new LinearLayout({
                        initialOffset: { x: 10, y: 10 },
                        nodeOffset: { x: 20, y: 0 },
                    })
                }
                onAttach={(c) => {
                    assert(c.children.length.value === 3);
                    assert.deepEqual(
                        c.processedChildren.get(0).getAbsolutePosition(),
                        { x: 10, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(1).getAbsolutePosition(),
                        { x: 0, y: 0 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(2).getAbsolutePosition(),
                        { x: 30, y: 10 }
                    );
                }}
            >
                <Container></Container>
                <Container ignoreLayout={true}></Container>
                <Container></Container>
            </Container>
        );
    });

    it("linear layout spread", () => {
        renderRoot.update(
            <Container
                layout={
                    new LinearLayout({
                        initialOffset: { x: 10, y: 10 },
                        nodeOffset: { x: 20, y: 0 },
                    })
                }
                onAttach={(c) => {
                    assert(c.children.length.value === 4);
                    assert.deepEqual(
                        c.processedChildren.get(0).getAbsolutePosition(),
                        { x: 10, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(1).getAbsolutePosition(),
                        { x: 0, y: 0 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(2).getAbsolutePosition(),
                        { x: 0, y: 0 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(2)
                            .processedChildren.get(0)
                            .getAbsolutePosition(),
                        { x: 30, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(2)
                            .processedChildren.get(1)
                            .getAbsolutePosition(),
                        { x: 50, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(3).getAbsolutePosition(),
                        { x: 70, y: 10 }
                    );
                }}
            >
                <Container></Container>
                <Container ignoreLayout={true}></Container>
                <Container spreadLayout={true}>
                    <Container></Container>
                    <Container></Container>
                </Container>
                <Container></Container>
            </Container>
        );
    });

    it("recursive layout spread", () => {
        renderRoot.update(
            <Container
                layout={
                    new LinearLayout({
                        initialOffset: { x: 10, y: 10 },
                        nodeOffset: { x: 20, y: 0 },
                    })
                }
                onAttach={(c) => {
                    assert(c.children.length.value === 4);
                    assert.deepEqual(
                        c.processedChildren.get(0).getAbsolutePosition(),
                        { x: 10, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(1).getAbsolutePosition(),
                        { x: 0, y: 0 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(2).getAbsolutePosition(),
                        { x: 0, y: 0 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(2)
                            .processedChildren.get(0)
                            .getAbsolutePosition(),
                        { x: 0, y: 0 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(2)
                            .processedChildren.get(1)
                            .processedChildren.get(0)
                            .getAbsolutePosition(),
                        { x: 30, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(2)
                            .processedChildren.get(1)
                            .processedChildren.get(1)
                            .getAbsolutePosition(),
                        { x: 50, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren
                            .get(2)
                            .processedChildren.get(2)
                            .getAbsolutePosition(),
                        { x: 70, y: 10 }
                    );
                    assert.deepEqual(
                        c.processedChildren.get(3).getAbsolutePosition(),
                        { x: 90, y: 10 }
                    );
                }}
            >
                <Container></Container>
                <Container ignoreLayout={true}></Container>
                <Container spreadLayout={true}>
                    <Container ignoreLayout={true}></Container>
                    <Container spreadLayout={true}>
                        <Container></Container>
                        <Container></Container>
                    </Container>
                    <Container></Container>
                </Container>
                <Container></Container>
            </Container>
        );
    });
});
