export class Queue<T> {
    private items: T[] = []
  
    constructor() {}
  
    public enqueue (item: T): void {
      this.items.push(item)
    }
  
    public dequeue (): T | undefined {
      return this.items.shift()
    }
  
    public peek(): T | undefined {
        return this.items[0];
    }
  
    public getItems (): T[] {
      return this.items
    }
  
    public clear (): void {
      this.items = []
    }
  
    public size (): number {
      return this.items.length
    }
  
    public isEmpty (): boolean {
      return this.items.length === 0
    }

    public consume(callback: (item: T) => void): void {
        while (!this.isEmpty()) {
            const item = this.dequeue();
            if (item) {
                callback(item);
            }
        }
    }
}
  