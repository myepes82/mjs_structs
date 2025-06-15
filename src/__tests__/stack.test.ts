import { Stack } from '../stack/stack';

describe('Stack', () => {
    let stack: Stack<number>;

    beforeEach(() => {
        stack = new Stack<number>();
    });

    test('should create empty stack', () => {
        expect(stack.isEmpty()).toBe(true);
        expect(stack.size()).toBe(0);
    });

    test('should push items to stack', () => {
        stack.push(1);
        stack.push(2);
        stack.push(3);

        expect(stack.size()).toBe(3);
        expect(stack.isEmpty()).toBe(false);
    });

    test('should pop items in LIFO order', () => {
        stack.push(1);
        stack.push(2);
        stack.push(3);

        expect(stack.pop()).toBe(3);
        expect(stack.pop()).toBe(2);
        expect(stack.pop()).toBe(1);
        expect(stack.pop()).toBeUndefined();
    });

    test('should peek at top item without removing it', () => {
        stack.push(1);
        stack.push(2);

        expect(stack.peek()).toBe(2);
        expect(stack.size()).toBe(2);
    });

    test('should handle empty stack operations', () => {
        expect(stack.pop()).toBeUndefined();
        expect(stack.peek()).toBeUndefined();
    });

    test('should iterate over items in LIFO order', async () => {
        stack.push(1);
        stack.push(2);
        stack.push(3);

        const items: number[] = [];
        await stack.forEach(async (item) => {
            items.push(item);
        });

        expect(items).toEqual([3, 2, 1]);
    });

    test('should handle errors in forEach with errorCallback', async () => {
        stack.push(1);
        stack.push(2);
        stack.push(3);

        const errors: { item: number; index: number; error: Error }[] = [];
        await stack.forEach(
            async (item) => {
                if (item === 2) {
                    throw new Error('Test error');
                }
            },
            async (item, index, error) => {
                errors.push({ item, index, error });
            }
        );

        expect(errors).toHaveLength(1);
        expect(errors[0].item).toBe(2);
        expect(errors[0].index).toBe(1);
        expect(errors[0].error.message).toBe('Test error');
    });

    test('should maintain correct size after operations', () => {
        expect(stack.size()).toBe(0);
        
        stack.push(1);
        expect(stack.size()).toBe(1);
        
        stack.push(2);
        expect(stack.size()).toBe(2);
        
        stack.pop();
        expect(stack.size()).toBe(1);
        
        stack.pop();
        expect(stack.size()).toBe(0);
        
        stack.pop();
        expect(stack.size()).toBe(0);
    });
}); 