# mjs_structs

A Node.js library that provides easy-to-use implementations of common data structures.

## Installation

```bash
npm install mjs_structs
```

## Usage

### Queue
```typescript
import { Queue } from 'mjs_structs';

const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);

console.log(queue.dequeue()); // 1
console.log(queue.peek()); // 2
```

**Complexity:**
- Enqueue: O(1)
- Dequeue: O(1)
- Peek: O(1)

**Use Case:** Task scheduling in event-driven systems.

### AsyncQueue
```typescript
import { AsyncQueue } from 'mjs_structs';

const asyncQueue = new AsyncQueue<number>({
    maxQueueSize: 1000,
    maxRetries: 3,
    retryDelay: 1000
});

asyncQueue.enqueue(1);
await asyncQueue.consume(async (item) => {
    // Process item
});
```

**Complexity:**
- Enqueue: O(1)
- Consume: O(n) where n is the number of items

**Use Case:** Asynchronous task processing with retry mechanism.

### LinkedList
```typescript
import { LinkedList } from 'mjs_structs';

const list = new LinkedList<number>();
list.append(1);
list.append(2);
list.append(3);

await list.forEach(async (node) => {
    console.log(node.value);
});
```

**Complexity:**
- Append: O(1)
- ForEach: O(n) where n is the number of nodes

**Use Case:** Dynamic data storage with efficient insertions and deletions.

## 📊 Benchmark: Processing Strategies Comparison

A benchmark was conducted to compare three different approaches for handling 100 HTTP requests (`axios.get`) using various concurrency strategies.

| Method                        | Time (ms) | RSS (MB) | Heap Total (MB) | Heap Used (MB) |
|------------------------------|-----------|----------|------------------|----------------|
| `AsyncQueue` (sequential)    | 13,593.81 | 63.77    | 13.37            | 8.97           |
| `AsyncQueueConcurrent (x5)`  | 6,182.20  | 72.10    | 18.87            | 8.49           |
| `for` loop (sequential)      | 8,260.19  | 73.00    | 26.87            | 11.85          |

> 📌 Note: RSS = total memory used by the process (resident set size)

---

### ✅ Conclusions

- **`AsyncQueueConcurrent` with `maxConcurrent: 5` was the fastest**, maintaining a reasonable memory profile. It is ideal for asynchronous I/O-bound tasks such as HTTP requests.
- The **sequential `for` loop** was slower and used more memory, likely due to accumulation of data between iterations.
- **Plain `AsyncQueue`** had the slowest execution time but the lowest overall memory usage, making it suitable for environments with tight memory constraints.

---

### 🧠 Recommended Use Cases

| Scenario                                         | Recommended Method                  |
|--------------------------------------------------|-------------------------------------|
| High control over error handling and events      | `AsyncQueue`                        |
| Parallel processing with load limiting           | `AsyncQueueConcurrent (maxConcurrent > 1)` |
| Simple flows with minimal complexity             | `for` loop (sequential)             |

---

### ⚙️ Enabling Concurrency in `AsyncQueue`

```ts
const queue = new AsyncQueue({
  maxConcurrent: 5, // Number of concurrent tasks
  maxQueueSize: 1000,
  maxRetries: 0,
  retryDelay: 1000,
});
```

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
