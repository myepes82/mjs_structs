
export class Stack<T> {
    private items: T[] = [];

    public push(item: T): void {
        this.items.push(item);
    }

    public pop(): T | undefined {
        return this.items.pop();
    }

    public peek(): T | undefined {
        return this.isEmpty() ? undefined : this.items[this.items.length - 1];
    }
    
    public size(): number {
        return this.items.length;
    }

    public isEmpty(): boolean {
        return this.size() === 0;
    }
    
    public async forEach(
        callback: (item: T, index: number) => Promise<void>,
        errorCallback?: (item: T, index: number, error: Error) => Promise<void>
    ): Promise<void> {
        for (let i = this.items.length - 1; i >= 0; i--) {
            try {
                await callback(this.items[i], i);
            } catch (error) {
                if (errorCallback) {
                    await errorCallback(this.items[i], i, error as Error);
                }
            }
        }
    }
}