import { ArrayDataSource, Aurum } from 'aurumjs';
import { Toast, Toaster } from '../src/dialog/toaster.js';
import { Accordion, AccordionItem } from '../src/accordion/accordion.js';

const ads = new ArrayDataSource();

Aurum.attach(
    <div>
        <Toaster defaultToastActiveTime={1000}>{ads}</Toaster>
        <button
            onClick={() => {
                ads.push(<Toast type="info">Hello World!</Toast>);
            }}
        >
            DEFAULT
        </button>
        <button
            onClick={() => {
                ads.push(
                    <Toast activeTime={5000} type="info">
                        Hello World!
                    </Toast>
                );
            }}
        >
            LONG
        </button>
        <Accordion
            style="width:300px;"
            sizeMode={{
                type: 'fit-content'
            }}
        >
            <AccordionItem title="Item A">
                <div>Content A</div>
            </AccordionItem>
            <AccordionItem title="Item B">
                {' '}
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
            </AccordionItem>
            <AccordionItem title="Item C">
                <div>
                    Content C
                    <div>
                        Content C
                        <div>
                            Content C
                            <div>
                                Content C<div>Content C</div>
                            </div>
                        </div>
                        <div>Content C</div>
                    </div>
                    <div>Content C</div>
                </div>
            </AccordionItem>
        </Accordion>
        <div style="height:30px;"></div>
        <Accordion
            style="width:300px;"
            sizeMode={{
                type: 'even-share',
                height: 400
            }}
        >
            <AccordionItem title="Item A">
                <div>Content A</div>
            </AccordionItem>
            <AccordionItem title="Item B">
                {' '}
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
            </AccordionItem>
            <AccordionItem title="Item C">
                <div>
                    Content C
                    <div>
                        Content C
                        <div>
                            Content C
                            <div>
                                Content C<div>Content C</div>
                            </div>
                        </div>
                        <div>Content C</div>
                    </div>
                    <div>Content C</div>
                </div>
            </AccordionItem>
            <AccordionItem title="Item D">
                <div>
                    Content D
                    <div>
                        Content D
                        <div>
                            Content D
                            <div>
                                Content D<div>Content D</div>
                            </div>
                        </div>
                        <div>Content D</div>
                    </div>
                    <div>Content D</div>
                </div>
            </AccordionItem>
        </Accordion>{' '}
        <div style="height:30px;"></div>
        <Accordion
            style="width:300px;"
            singleOpen
            sizeMode={{
                type: 'even-share',
                height: 400
            }}
        >
            <AccordionItem title="Item A">
                <div>Content A</div>
            </AccordionItem>
            <AccordionItem title="Item B">
                {' '}
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
                <div>Content B</div>
            </AccordionItem>
            <AccordionItem title="Item C">
                <div>
                    Content C
                    <div>
                        Content C
                        <div>
                            Content C
                            <div>
                                Content C<div>Content C</div>
                            </div>
                        </div>
                        <div>Content C</div>
                    </div>
                    <div>Content C</div>
                </div>
            </AccordionItem>
            <AccordionItem title="Item D">
                <div>
                    Content D
                    <div>
                        Content D
                        <div>
                            Content D
                            <div>
                                Content D<div>Content D</div>
                            </div>
                        </div>
                        <div>Content D</div>
                    </div>
                    <div>Content D</div>
                </div>
            </AccordionItem>
        </Accordion>
    </div>,
    document.body
);
