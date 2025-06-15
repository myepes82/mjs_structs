# mjs_structs

A Node.js library that provides easy-to-use implementations of common data structures with TypeScript support.

## Installation

```bash
npm install mjs_structs
```

## Data Structures

### Queue
A simple FIFO (First In, First Out) queue implementation.

```typescript
import { Queue } from 'mjs_structs';

const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);

console.log(queue.dequeue()); // 1
console.log(queue.peek()); // 2
```

**Features:**
- Generic type support
- FIFO ordering
- Simple and efficient operations
- Synchronous processing

**Methods:**
- `enqueue(item: T): void` - Add item to queue
- `dequeue(): T | undefined` - Remove and return first item
- `peek(): T | undefined` - View first item without removing
- `size(): number` - Get queue length
- `isEmpty(): boolean` - Check if queue is empty
- `clear(): void` - Remove all items
- `consume(callback: (item: T) => void): void` - Process all items with callback

**Complexity:**
- Enqueue: O(1)
- Dequeue: O(1)
- Peek: O(1)
- Size: O(1)
- Clear: O(1)

**Use Case:** Task scheduling in event-driven systems.

### AsyncQueue
An advanced queue implementation for asynchronous operations with retry mechanism and concurrency control.

```typescript
import { AsyncQueue } from 'mjs_structs';

const asyncQueue = new AsyncQueue<number>({
    maxQueueSize: 1000,
    maxRetries: 3,
    retryDelay: 1000,
    maxConcurrent: 5,
    autoStart: true,
    timeout: 10000
});

// Set up handlers
asyncQueue.setStartedHandler((item) => console.log(`Processing ${item}`));
asyncQueue.setSuccessHandler((item) => console.log(`Success ${item}`));
asyncQueue.setErrorHandler((element) => console.log(`Error ${element.error?.errorMessage}`));
asyncQueue.setEndHandler(() => console.log('Queue processing complete'));

// Set consumer and start processing
asyncQueue.setConsumer(async (item) => {
    // Process item
    await processItem(item);
});

asyncQueue.enqueue(1);
await asyncQueue.start();
```

**Features:**
- Concurrent processing
- Retry mechanism
- Error handling
- Event handlers
- Queue statistics
- Timeout support
- Auto-start option

**Configuration Options:**
- `maxQueueSize`: Maximum number of items in queue (default: 1000)
- `maxRetries`: Number of retry attempts (default: 0)
- `retryDelay`: Delay between retries in ms (default: 1000)
- `maxConcurrent`: Number of concurrent processors (default: 1)
- `autoStart`: Start processing automatically (default: false)
- `timeout`: Operation timeout in ms (default: 10000)

**Methods:**
- `enqueue(item: T): void` - Add item to queue
- `start(): Promise<void>` - Start processing queue
- `setConsumer(processFn: (item: T) => Promise<void>): void` - Set processing function
- `getStats(): AsyncQueueStats` - Get queue statistics
- Event handlers: `setStartedHandler`, `setSuccessHandler`, `setErrorHandler`, `setEndHandler`

**Complexity:**
- Enqueue: O(1)
- Process: O(n) where n is number of items
- Concurrent processing: O(n/m) where m is maxConcurrent

**Use Case:** Asynchronous task processing with retry mechanism and concurrency control.

### Stack
A LIFO (Last In, First Out) stack implementation with async iteration support.

```typescript
import { Stack } from 'mjs_structs';

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.push(3);

console.log(stack.pop()); // 3
console.log(stack.peek()); // 2

// Async iteration with error handling
await stack.forEach(
    async (item) => {
        console.log(item);
    },
    async (item, index, error) => {
        console.error(`Error processing item ${item} at index ${index}: ${error.message}`);
    }
);
```

**Features:**
- Generic type support
- LIFO ordering
- Async iteration
- Error handling in iteration
- Simple and efficient operations

**Methods:**
- `push(item: T): void` - Add item to stack
- `pop(): T | undefined` - Remove and return top item
- `peek(): T | undefined` - View top item without removing
- `size(): number` - Get stack length
- `isEmpty(): boolean` - Check if stack is empty
- `forEach(callback: (item: T, index: number) => Promise<void>, errorCallback?: (item: T, index: number, error: Error) => Promise<void>): Promise<void>` - Async iteration

**Complexity:**
- Push: O(1)
- Pop: O(1)
- Peek: O(1)
- Size: O(1)
- ForEach: O(n) where n is number of items

**Use Case:** Function call stack, undo operations, expression evaluation.

### LinkedList
A singly linked list implementation with async iteration support.

```typescript
import { LinkedList } from 'mjs_structs';

const list = new LinkedList<number>();
list.append(1);
list.append(2);
list.append(3);

// Async iteration with error handling
await list.forEach(
    async (node) => {
        console.log(node.value);
    },
    async (node) => {
        console.error(`Error processing node ${node.value}`);
    }
);
```

**Features:**
- Generic type support
- Async iteration
- Error handling in iteration
- Efficient append operations
- Memory efficient

**Methods:**
- `append(value: T): void` - Add value to end of list
- `forEach(callback: (node: LinkedListNode<T>, index: number) => Promise<void>, errorCallback?: (node: LinkedListNode<T>, index: number) => Promise<void>): Promise<void>` - Async iteration
- `size(): number` - Get list length
- `isEmpty(): boolean` - Check if list is empty
- `clear(): void` - Remove all nodes
- `toArray(): T[]` - Convert list to array (not recommended for large lists)

**Complexity:**
- Append: O(1)
- ForEach: O(n) where n is number of nodes
- Size: O(1)
- Clear: O(1)
- ToArray: O(n)

**Use Case:** Dynamic data storage with efficient insertions and deletions.

## 📊 Benchmark: Processing Strategies Comparison

A benchmark was conducted to compare three different approaches for handling 100 HTTP requests (`axios.get`) using various concurrency strategies.

| Method                        | Time (ms) | RSS (MB) | Heap Total (MB) | Heap Used (MB) |
|------------------------------|-----------|----------|------------------|----------------|
| `AsyncQueue` (sequential)    | 13,593.81 | 63.77    | 13.37            | 8.97           |
| `AsyncQueueConcurrent (x5)`  | 6,182.20  | 72.10    | 18.87            | 8.49           |
| `for` loop (sequential)      | 8,260.19  | 73.00    | 26.87            | 11.85          |

> 📌 Note: RSS = total memory used by the process (resident set size)

### ✅ Conclusions

- **`AsyncQueueConcurrent` with `maxConcurrent: 5` was the fastest**, maintaining a reasonable memory profile. It is ideal for asynchronous I/O-bound tasks such as HTTP requests.
- The **sequential `for` loop** was slower and used more memory, likely due to accumulation of data between iterations.
- **Plain `AsyncQueue`** had the slowest execution time but the lowest overall memory usage, making it suitable for environments with tight memory constraints.

### 🧠 Recommended Use Cases

| Scenario                                         | Recommended Method                  |
|--------------------------------------------------|-------------------------------------|
| High control over error handling and events      | `AsyncQueue`                        |
| Parallel processing with load limiting           | `AsyncQueueConcurrent (maxConcurrent > 1)` |
| Simple flows with minimal complexity             | `for` loop (sequential)             |

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## License

MIT
