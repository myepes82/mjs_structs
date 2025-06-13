export interface LinkedListNode<T> {
    value: T;
    next: LinkedListNode<T> | null;
}

export class LinkedList<T> {
    private head: LinkedListNode<T> | null = null;
    private tail: LinkedListNode<T> | null = null;
    private length: number = 0;

    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    public append(value: T): void {
        const newNode: LinkedListNode<T> = {
            value,
            next: null,
        };

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            if (this.tail) {
                this.tail.next = newNode;
            }
            this.tail = newNode;
        }
        this.length++;
    }

    public size(): number {
        return this.length;
    }

    public isEmpty(): boolean {
        return this.length === 0;
    }

    public async forEach(
        callback: (node: LinkedListNode<T>, index: number) => Promise<void>,
        errorCallback?: (node: LinkedListNode<T>, index: number) => Promise<void>
    ): Promise<void> {
        let current = this.head;
        let index = 0;
    
        while (current) {
            try {
                await callback(current, index);
            } catch (error) {
                if (errorCallback) {
                    await errorCallback(current, index);
                }
            }
            current = current.next;
            index++;
        }
    }
    
    // Please prevent using this method, it's not efficient and it's not a good practice. >:) 
    public toArray(): T[] {
        const result: T[] = [];
        let current = this.head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }

    public clear(): void {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }
    
}