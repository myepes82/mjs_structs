type QueueResultError = 'maxConcurrent' | 'maxQueueSize' | 'error' | 'timeout';

export interface QueueElement<T> {
    item: T;
    error?: QueueElementError;
}

export interface QueueElementError {
    errorType: QueueResultError;
    errorMessage: string;
}

export interface AsyncQueueOptions {
    maxConcurrent?: number;
    maxQueueSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    autoStart?: boolean;
    timeout?: number;
}

export interface AsyncQueueStats {
    totalItems: number;
    processedItems: number;
    failedItems: number;
    successRate: number;
    errorRate: number;
}

export class AsyncQueue<T> {
    private items: QueueElement<T>[] = [];
    private readonly options: Required<AsyncQueueOptions>;
    private stats: AsyncQueueStats = {
        totalItems: 0,
        processedItems: 0,
        failedItems: 0,
        successRate: 0,
        errorRate: 0,
    };
    private consumer?: (item: T) => Promise<void>;
    private isRunning = false;

    private readonly handlers: {
        started: (item: T) => void;
        success: (item: T) => void;
        error: (element: QueueElement<T>) => void;
        end: () => void;
    } = {
            started: () => { },
            success: () => { },
            error: () => { },
            end: () => { },
        };

    constructor(options?: AsyncQueueOptions) {
        this.options = {
            maxConcurrent: options?.maxConcurrent ?? 1,
            maxQueueSize: options?.maxQueueSize ?? 1000,
            maxRetries: options?.maxRetries ?? 0,
            retryDelay: options?.retryDelay ?? 1000,
            autoStart: options?.autoStart ?? false,
            timeout: options?.timeout ?? 10000,
        };
    }

    public enqueue(item: T): void {
        if (this.isQueueFull()) {
            this.handlers.error({
                item,
                error: {
                    errorType: 'maxQueueSize',
                    errorMessage: 'Queue is full',
                },
            });
            return;
        }

        this.items.push({ item });
        this.stats.totalItems++;

        if (!this.isRunning && this.options.autoStart) {
            this.start();
        }
    }

    private isQueueFull(): boolean {
        return this.items.length >= this.options.maxQueueSize;
    }

    private dequeue(): QueueElement<T> | undefined {
        return this.items.shift();
    }

    public peek(): T | undefined {
        return this.items[0]?.item;
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

    public setStartedHandler(callback: (item: T) => void): void {
        this.handlers.started = callback;
    }

    public setSuccessHandler(callback: (item: T) => void): void {
        this.handlers.success = callback;
    }

    public setErrorHandler(callback: (element: QueueElement<T>) => void): void {
        this.handlers.error = callback;
    }

    public setEndHandler(callback: () => void): void {
        this.handlers.end = callback;
    }

    private markSuccess(): void {
        this.stats.processedItems++;
        this.updateSuccessRate();
    }

    private markFailure(): void {
        this.stats.failedItems++;
        this.updateSuccessRate();
    }

    private async processElement(element: QueueElement<T>): Promise<void> {
        this.handlers.started(element.item);

        try {
            if (this.options.maxRetries === 0) {
                await this.runWithTimeout(() => this.consumer!(element.item), this.options.timeout);
                this.handlers.success(element.item);
                this.markSuccess();
            } else {
                await this.processWithRetries(element, this.consumer!);
            }
        } catch (err) {
            this.handlers.error({
                ...element,
                error: {
                    errorType: 'error',
                    errorMessage: (err as Error)?.message || 'Unknown error',
                },
            });
            this.markFailure();
        }
    }

    private async processWithRetries(element: QueueElement<T>, processFn: (item: T) => Promise<void>): Promise<void> {
        let retriesLeft = this.options.maxRetries;

        while (retriesLeft >= 0) {
            try {
                await this.runWithTimeout(() => processFn(element.item), this.options.timeout);
                this.handlers.success(element.item);
                this.markSuccess();
                return;
            } catch (err) {
                if (retriesLeft === 0) {
                    this.handlers.error({
                        ...element,
                        error: {
                            errorType: 'error',
                            errorMessage: (err as Error)?.message || 'Unknown error',
                        },
                    });
                    this.markFailure();
                    return;
                } else {
                    retriesLeft--;
                    await new Promise(res => setTimeout(res, this.options.retryDelay));
                }
            }
        }
    }

    private async processSequential(): Promise<void> {
        while (!this.isEmpty()) {
            const element = this.dequeue();
            if (element) await this.processElement(element);
        }
    }

    private async processConcurrent(maxConcurrent: number): Promise<void> {
        const workers: Promise<void>[] = [];

        for (let i = 0; i < maxConcurrent; i++) {
            workers.push((async (): Promise<void> => {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const element = this.dequeue();
                    if (!element) break;
                    await this.processElement(element);
                }
            })());
        }

        await Promise.all(workers);
    }

    public setConsumer(processFn: (item: T) => Promise<void>): void {
        this.consumer = processFn;
    }

    public async start(): Promise<void> {
        if (!this.consumer) {
            throw new Error('Consumer not set');
        }

        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        const maxConcurrent = this.options.maxConcurrent;

        if (maxConcurrent <= 1) {
            await this.processSequential();
        } else {
            await this.processConcurrent(maxConcurrent);
        }

        this.isRunning = false;
        this.handlers.end();
    }

    public getStats(): AsyncQueueStats {
        return this.stats;
    }

    private updateSuccessRate(): void {
        const total = this.stats.processedItems + this.stats.failedItems;
        if (total > 0) {
            this.stats.successRate = (this.stats.processedItems / total) * 100;
            this.stats.errorRate = (this.stats.failedItems / total) * 100;
        }
    }

    private async runWithTimeout<R>(fn: () => Promise<R>, timeout: number): Promise<R> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
            fn()
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }
}
