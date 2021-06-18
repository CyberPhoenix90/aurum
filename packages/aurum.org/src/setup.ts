import { EventEmitter } from 'aurumjs';

// enableDebugMode();
EventEmitter.setSubscriptionLeakWarningThreshold(300);
import('./main');
