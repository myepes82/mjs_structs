import { Queue } from '../queue/queue';

describe('Queue', () => {
    let queue: Queue<number>;

    beforeEach(() => {
        queue = new Queue<number>();
    });

    test('should create empty queue', () => {
        expect(queue.isEmpty()).toBe(true);
        expect(queue.size()).toBe(0);
    });

    test('should enqueue items', () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.size()).toBe(3);
        expect(queue.isEmpty()).toBe(false);
    });

    test('should dequeue items in FIFO order', () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.dequeue()).toBe(1);
        expect(queue.dequeue()).toBe(2);
        expect(queue.dequeue()).toBe(3);
        expect(queue.dequeue()).toBeUndefined();
    });

    test('should peek at front item without removing it', () => {
        queue.enqueue(1);
        queue.enqueue(2);

        expect(queue.peek()).toBe(1);
        expect(queue.size()).toBe(2);
    });

    test('should clear queue', () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        queue.clear();
        expect(queue.isEmpty()).toBe(true);
        expect(queue.size()).toBe(0);
    });

    test('should handle empty queue operations', () => {
        expect(queue.dequeue()).toBeUndefined();
        expect(queue.peek()).toBeUndefined();
    });
}); 