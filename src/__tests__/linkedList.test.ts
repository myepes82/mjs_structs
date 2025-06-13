import { LinkedList } from '../lists/linkedList';

describe('LinkedList', () => {
    let list: LinkedList<number>;

    beforeEach(() => {
        list = new LinkedList<number>();
    });

    test('should create empty list', () => {
        expect(list).toBeDefined();
    });

    test('should append items to list', async () => {
        list.append(1);
        list.append(2);
        list.append(3);

        const items: number[] = [];
        await list.forEach(async (node) => {
            items.push(node.value);
        });

        expect(items).toEqual([1, 2, 3]);
    });

    test('should handle empty list in forEach', async () => {
        const items: number[] = [];
        await list.forEach(async (node) => {
            items.push(node.value);
        });
        expect(items).toEqual([]);
    });

    test('should handle errors in forEach with errorCallback', async () => {
        list.append(1);
        list.append(2);
        list.append(3);

        const errors: number[] = [];
        await list.forEach(
            async (node) => {
                if (node.value === 2) {
                    throw new Error('Test error');
                }
            },
            async (node) => {
                errors.push(node.value);
            }
        );

        expect(errors).toEqual([2]);
    });
}); 