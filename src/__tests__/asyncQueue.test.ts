import { AsyncQueue } from '../queue/asyncQueue';

describe('AsyncQueue', () => {
    let queue: AsyncQueue<number>;

    beforeEach(() => {
        queue = new AsyncQueue<number>();
    });

    describe('Basic Queue Operations', () => {
        test('should create empty queue with default options', () => {
            expect(queue.isEmpty()).toBe(true);
            expect(queue.getItems()).toEqual([]);
        });

        test('should create queue with custom options', () => {
            const customQueue = new AsyncQueue<number>({
                maxConcurrent: 3,
                maxQueueSize: 5,
                maxRetries: 3,
                retryDelay: 500
            });
            expect(customQueue.isEmpty()).toBe(true);
        });

        test('should enqueue and peek items', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            expect(queue.peek()).toBe(1);
            expect(queue.getItems()).toEqual([1, 2]);
        });

        test('should clear queue', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.clear();
            expect(queue.isEmpty()).toBe(true);
            expect(queue.getItems()).toEqual([]);
        });
    });

    describe('Queue Size Limits', () => {
        test('should respect maxQueueSize limit', () => {
            const smallQueue = new AsyncQueue<number>({ 
                maxConcurrent: 1,
                maxQueueSize: 2, 
                maxRetries: 0, 
                retryDelay: 1000 
            });
            let errorCalled = false;

            smallQueue.setEventHandler('error', (element) => {
                if (element.error?.errorType === 'maxQueueSize') {
                    errorCalled = true;
                }
            });

            smallQueue.enqueue(1);
            smallQueue.enqueue(2);
            smallQueue.enqueue(3);

            expect(errorCalled).toBe(true);
            expect(smallQueue.getItems()).toEqual([1, 2]);
        });
    });

    describe('Event Handlers', () => {
        test('should call started handler for each item', async () => {
            const startedItems: number[] = [];
            queue.setEventHandler('started', (element) => {
                startedItems.push(element.item);
            });

            queue.enqueue(1);
            queue.enqueue(2);
            await queue.consume(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(startedItems).toEqual([1, 2]);
        });

        test('should call success handler when item is processed successfully', async () => {
            const successItems: number[] = [];
            queue.setEventHandler('success', (element) => {
                successItems.push(element.item);
            });

            queue.enqueue(1);
            queue.enqueue(2);
            await queue.consume(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(successItems).toEqual([1, 2]);
        });

        test('should call error handler when processing fails', async () => {
            const errorItems: number[] = [];
            queue.setEventHandler('error', (element) => {
                if (element.error?.errorType === 'error') {
                    errorItems.push(element.item);
                }
            });

            queue.enqueue(1);
            await queue.consume(async () => {
                throw new Error('Processing failed');
            });

            expect(errorItems).toEqual([1]);
        });

        test('should call end handler when queue is empty', async () => {
            let endCalled = false;
            queue.setEventHandler('end', () => {
                endCalled = true;
            });

            queue.enqueue(1);
            await queue.consume(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(endCalled).toBe(true);
        });
    });

    describe('Concurrent Processing', () => {
        test('should process items concurrently when maxConcurrent > 1', async () => {
            const concurrentQueue = new AsyncQueue<number>({
                maxConcurrent: 3,
                maxQueueSize: 1000,
                maxRetries: 0,
                retryDelay: 100
            });

            const processingOrder: number[] = [];
            const processingTimes: number[] = [];

            for (let i = 0; i < 6; i++) {
                concurrentQueue.enqueue(i);
            }

            await concurrentQueue.consume(async (item) => {
                const startTime = Date.now();
                await new Promise(resolve => setTimeout(resolve, 200));
                processingOrder.push(item);
                processingTimes.push(Date.now() - startTime);
            });

            expect(processingOrder.length).toBe(6);
            const totalTime = Math.max(...processingTimes);
            expect(totalTime).toBeLessThan(1200);
        });

        test('should handle errors in concurrent processing', async () => {
            const concurrentQueue = new AsyncQueue<number>({
                maxConcurrent: 3,
                maxQueueSize: 1000,
                maxRetries: 0,
                retryDelay: 100
            });

            const errorItems: number[] = [];
            concurrentQueue.setEventHandler('error', (element) => {
                if (element.error?.errorType === 'error') {
                    errorItems.push(element.item);
                }
            });

            for (let i = 0; i < 6; i++) {
                concurrentQueue.enqueue(i);
            }

            await concurrentQueue.consume(async (item) => {
                if (item % 2 === 0) {
                    throw new Error('Processing failed');
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(errorItems).toEqual([0, 2, 4]);
        });
    });

    describe('Retry Mechanism', () => {
        test('should retry failed operations when maxRetries > 0', async () => {
            const retryQueue = new AsyncQueue<number>({
                maxConcurrent: 1,
                maxQueueSize: 1000,
                maxRetries: 2,
                retryDelay: 100
            });

            let attempts = 0;
            let successCalled = false;

            retryQueue.setEventHandler('success', () => {
                successCalled = true;
            });

            retryQueue.enqueue(1);
            await retryQueue.consume(async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Temporary failure');
                }
            });

            expect(attempts).toBe(2);
            expect(successCalled).toBe(true);
        });

        test('should fail after max retries exceeded', async () => {
            const retryQueue = new AsyncQueue<number>({
                maxConcurrent: 1,
                maxQueueSize: 1000,
                maxRetries: 2,
                retryDelay: 100
            });

            let errorCalled = false;
            retryQueue.setEventHandler('error', (element) => {
                if (element.error?.errorType === 'error') {
                    errorCalled = true;
                }
            });

            retryQueue.enqueue(1);
            await retryQueue.consume(async () => {
                throw new Error('Persistent failure');
            });

            expect(errorCalled).toBe(true);
        });
    });
}); 