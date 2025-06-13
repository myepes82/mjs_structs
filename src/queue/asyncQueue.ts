

type QueueEvent = 'success' | 'error' | 'end'
type QueueResultError = 'maxConcurrent' | 'maxQueueSize' | 'error';

export interface QueueElement<T> {
    item: T;
    error?: QueueElementError<T>;
}

export interface QueueElementError<T> {
    errorType: QueueResultError;
    errorMessage: string;
}

export interface AsyncQueueOptions {
    maxQueueSize: number;
    maxRetries: number;
    retryDelay: number;
}

export class AsyncQueue<T> {

    private items: QueueElement<T>[] = [];

    private readonly options: AsyncQueueOptions;

    private readonly handlers: Record<QueueEvent, (item: QueueElement<T>) => void> = {
        success: () => {},
        error: () => {},
        end: () => {},
    };

    constructor(options?: AsyncQueueOptions) {
        this.options = options ?? {
            maxQueueSize: 1000,
            maxRetries: 0,
            retryDelay: 1000,
        };
    }

    public enqueue(item: T): void {
        const currentSize = this.items.length;

        if ((currentSize + 1) > this.options.maxQueueSize) {
            this.handlers.error({
                item,
                error: {
                    errorType: 'maxQueueSize',
                    errorMessage: 'Queue is full',
                },
            });
            return;
        }

        this.items.push({
            item,
            error: undefined,
        });
    }

    private dequeue(): QueueElement<T> | undefined {
        return this.items.shift();
    }

    public peek(): T | undefined {
        return this.items[0].item;
    }

    public getItems(): T[] {
        return this.items.map(item => item.item);
    }

    public clear(): void {
        this.items = [];
    }

    public isEmpty(): boolean {
        return this.items.length === 0;
    }

    public setEventHandler(event: QueueEvent, callback: (item: QueueElement<T>) => void): void {
        this.handlers[event] = callback;
    }

    private async processWithRetries(element: QueueElement<T>, processFn: (item: T) => Promise<void>): Promise<void> {
        let retriesLeft = this.options.maxRetries;
        while (retriesLeft > 0) {
            try {
                await processFn(element.item);
                this.handlers.success(element);
                return;
            } catch (err) {
                retriesLeft--;
                if (retriesLeft === 0) {
                    this.handlers.error({
                        ...element,
                        error: {
                            errorType: 'error',
                            errorMessage: (err as Error)?.message || 'Unknown error',
                        },
                    });
                } else {
                    await new Promise(res => setTimeout(res, this.options.retryDelay));
                }
            }
        }
    }

    public async consume(processFn: (item: T) => Promise<void>): Promise<void> {
        while (!this.isEmpty()) {

            const element = this.dequeue();

            if (!element) continue;

            if (this.options.maxRetries === 0) {
                try {
                    await processFn(element.item);
                    this.handlers.success(element);
                } catch (err) {
                    this.handlers.error({
                        ...element,
                        error: {
                            errorType: 'error',
                            errorMessage: (err as Error)?.message || 'Unknown error',
                        },
                    });
                }
                continue;
            }

            await this.processWithRetries(element, processFn);
        }
    
        this.handlers.end({ item: null as any });
    }
    
}