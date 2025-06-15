import { AsyncQueue, QueueElement } from '../queue/asyncQueue';

describe('AsyncQueue', () => {
    let queue: AsyncQueue<number>;
    let processedItems: number[];
    let startedItems: number[];
    let errorItems: QueueElement<number>[];
    let endCalled: boolean;

    beforeEach(() => {
        processedItems = [];
        startedItems = [];
        errorItems = [];
        endCalled = false;

        queue = new AsyncQueue<number>({
            maxConcurrent: 2,
            maxQueueSize: 5,
            maxRetries: 2,
            retryDelay: 100,
            timeout: 1000,
            autoStart: false
        });

        queue.setConsumer(async (item) => {
            await new Promise(resolve => setTimeout(resolve, 50));
            processedItems.push(item);
        });

        queue.setStartedHandler((item) => {
            startedItems.push(item);
        });

        queue.setSuccessHandler((item) => {
            processedItems.push(item);
        });

        queue.setErrorHandler((element) => {
            errorItems.push(element);
        });

        queue.setEndHandler(() => {
            endCalled = true;
        });
    });

    it('should process items sequentially when maxConcurrent is 1', async () => {
        const sequentialQueue = new AsyncQueue<number>({ maxConcurrent: 1 });
        const items: number[] = [];

        sequentialQueue.setConsumer(async (item) => {
            await new Promise(resolve => setTimeout(resolve, 50));
            items.push(item);
        });

        sequentialQueue.enqueue(1);
        sequentialQueue.enqueue(2);
        sequentialQueue.enqueue(3);

        await sequentialQueue.start();

        expect(items).toEqual([1, 2, 3]);
    });

    it('should process items concurrently when maxConcurrent > 1', async () => {
        const items: number[] = [];
        const concurrentQueue = new AsyncQueue<number>({ maxConcurrent: 2 });

        concurrentQueue.setConsumer(async (item) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            items.push(item);
        });

        concurrentQueue.enqueue(1);
        concurrentQueue.enqueue(2);
        concurrentQueue.enqueue(3);
        concurrentQueue.enqueue(4);

        await concurrentQueue.start();

        expect(items.length).toBe(4);
        expect(items).toContain(1);
        expect(items).toContain(2);
        expect(items).toContain(3);
        expect(items).toContain(4);
    });

    it('should respect maxQueueSize limit', () => {
        for (let i = 0; i < 6; i++) {
            queue.enqueue(i);
        }

        expect(queue.getItems().length).toBe(5);
        expect(errorItems.length).toBe(1);
        expect(errorItems[0].error?.errorType).toBe('maxQueueSize');
    });

    it('should handle timeouts correctly', async () => {
        const timeoutQueue = new AsyncQueue<number>({ timeout: 100 });

        timeoutQueue.setConsumer(async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        timeoutQueue.setErrorHandler((element) => {
            errorItems.push(element);
        });

        timeoutQueue.enqueue(1);
        await timeoutQueue.start();

        expect(errorItems.length).toBe(1);
        expect(errorItems[0].error?.errorType).toBe('error');
        expect(errorItems[0].error?.errorMessage).toBe('Timeout');
    });

    it('should retry failed items', async () => {
        let attempts = 0;
        const retryQueue = new AsyncQueue<number>({ maxRetries: 2, retryDelay: 100 });

        retryQueue.setConsumer(async (item) => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Temporary error');
            }
            processedItems.push(item);
        });

        retryQueue.enqueue(1);
        await retryQueue.start();

        expect(attempts).toBe(3);
        expect(processedItems).toContain(1);
    });

    it('should track statistics correctly', async () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        await queue.start();

        const stats = queue.getStats();
        expect(stats.totalItems).toBe(3);
        expect(stats.processedItems).toBe(3);
        expect(stats.failedItems).toBe(0);
        expect(stats.successRate).toBe(100);
        expect(stats.errorRate).toBe(0);
    });

    it('should call event handlers in correct order', async () => {
        queue.setConsumer(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        queue.setSuccessHandler((item) => {
            processedItems.push(item);
        });

        queue.enqueue(1);
        queue.enqueue(2);

        await queue.start();

        expect(startedItems).toEqual([1, 2]);
        expect(processedItems).toEqual([1, 2]);
        expect(errorItems).toEqual([]);
        expect(endCalled).toBe(true);
    });

    it('should handle errors and update statistics', async () => {
        queue.setConsumer(async () => {
            throw new Error('Test error');
        });

        queue.enqueue(1);
        queue.enqueue(2);

        await queue.start();

        expect(errorItems.length).toBe(2);
        expect(errorItems[0].error?.errorType).toBe('error');
        expect(errorItems[0].error?.errorMessage).toBe('Test error');

        const stats = queue.getStats();
        expect(stats.totalItems).toBe(2);
        expect(stats.processedItems).toBe(0);
        expect(stats.failedItems).toBe(2);
        expect(stats.successRate).toBe(0);
        expect(stats.errorRate).toBe(100);
    });

    it('should clear queue correctly', () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.getItems().length).toBe(3);
        queue.clear();
        expect(queue.getItems().length).toBe(0);
        expect(queue.isEmpty()).toBe(true);
    });

    it('should peek at next item without removing it', () => {
        queue.enqueue(1);
        queue.enqueue(2);

        expect(queue.peek()).toBe(1);
        expect(queue.getItems().length).toBe(2);
    });
}); 