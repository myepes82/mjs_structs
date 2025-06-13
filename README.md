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
