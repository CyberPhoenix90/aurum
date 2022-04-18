import { ArrayDataSource, Aurum } from 'aurumjs';
import { Toast, Toaster } from '../src/dialog/toaster';

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
    </div>,
    document.body
);
