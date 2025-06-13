type QueueEvent = 'started' | 'success' | 'error' | 'end'
type QueueResultError = 'maxConcurrent' | 'maxQueueSize' | 'error';

export interface QueueElement<T> {
    item: T;
    error?: QueueElementError;
}

export interface QueueElementError {
    errorType: QueueResultError;
    errorMessage: string;
}

export interface AsyncQueueOptions {
    maxConcurrent: number;
    maxQueueSize: number;
    maxRetries: number;
    retryDelay: number;
}

export class AsyncQueue<T> {

    private items: QueueElement<T>[] = [];

    private readonly options: AsyncQueueOptions;

    private readonly handlers: Record<QueueEvent, (item: QueueElement<T> ) => void> = {
        started: () => {},
        success: () => {},
        error: () => {},
        end: () => {},
    };

    constructor(options?: AsyncQueueOptions) {
        this.options = options ?? {
            maxConcurrent: 1,
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
        const maxConcurrent = this.options.maxConcurrent ?? 1;

        if (maxConcurrent <= 1) {
            while (!this.isEmpty()) {
                const element = this.dequeue();
                if (!element) continue;
    
                this.handlers.started({ item: element.item });
    
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
                } else {
                    await this.processWithRetries(element, processFn);
                }
            }
        } else {
            const workers: Promise<void>[] = [];
    
            const worker = async (): Promise<void> => {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const element = this.dequeue();
                    if (!element) break;
    
                    this.handlers.started({ item: element.item });
    
                    try {
                        if (this.options.maxRetries === 0) {
                            await processFn(element.item);
                            this.handlers.success(element);
                        } else {
                            await this.processWithRetries(element, processFn);
                        }
                    } catch (err) {
                        this.handlers.error({
                            ...element,
                            error: {
                                errorType: 'error',
                                errorMessage: (err as Error)?.message || 'Unknown error',
                            },
                        });
                    }
                }
            };

            for (let i = 0; i < maxConcurrent; i++) {
                workers.push(worker());
            }

            await Promise.all(workers);
        }

        this.handlers.end({ item: null as unknown as T });
    }
}