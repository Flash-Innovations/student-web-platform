/**
 * Dev Arena Multi-Language Engine Support
 * Enables students to solve any production engineering task in their preferred language:
 * JavaScript (Node.js ES6+), Python 3 (FastAPI / 3.11+), or Java (Spring Boot 3 / 17+).
 */

export const DEV_LANGUAGES = [
  {
    id: "javascript",
    label: "JavaScript (Node.js)",
    shortLabel: "JS",
    filename: "solution.js",
    runtime: "Node.js ES6+ Environment",
    monacoLang: "javascript",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "python",
    label: "Python 3 (FastAPI / 3.11)",
    shortLabel: "Python",
    filename: "solution.py",
    runtime: "Python 3.11+ / FastAPI",
    monacoLang: "python",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200"
  },
  {
    id: "java",
    label: "Java (Spring Boot / 17)",
    shortLabel: "Java",
    filename: "Solution.java",
    runtime: "Spring Boot 3 / Java 17+",
    monacoLang: "java",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  }
];

export const DEV_LANGUAGE_MAP = DEV_LANGUAGES.reduce((acc, lang) => {
  acc[lang.id] = lang;
  return acc;
}, {});

export const DEFAULT_DEV_LANGUAGE = "javascript";

/**
 * Curated starter templates for cross-language dev engineering challenges.
 */
const CROSS_LANG_STARTERS = {
  "dev-1": {
    python: `import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate_per_second: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_second
        self.tokens = float(capacity)
        self.last_refill = time.time()

    def refill(self) -> None:
        # TODO: Calculate elapsed seconds and replenish tokens up to capacity
        pass

    def take(self, tokens: int = 1) -> bool:
        # TODO: Replenish and check if requested tokens can be consumed
        return False
`,
    java: `package com.practice.ratelimit;

import java.time.Instant;

public class TokenBucket {
    private final int capacity;
    private final double refillRatePerSecond;
    private double tokens;
    private Instant lastRefill;

    public TokenBucket(int capacity, double refillRatePerSecond) {
        this.capacity = capacity;
        this.refillRatePerSecond = refillRatePerSecond;
        this.tokens = capacity;
        this.lastRefill = Instant.now();
    }

    public void refill() {
        // TODO: Calculate elapsed time and replenish tokens up to capacity
    }

    public boolean take(int tokens) {
        // TODO: Replenish and check if requested tokens can be consumed
        return false;
    }
}
`
  },
  "dev-2": {
    python: `import asyncio
from typing import List, Callable, Any

async def promise_pool(tasks: List[Callable[[], Any]], limit: int) -> List[Any]:
    """
    Execute asynchronous tasks with at most 'limit' concurrent workers,
    returning results in original task index order.
    """
    results = [None] * len(tasks)
    # TODO: Implement worker pool with limited concurrency
    return results
`,
    java: `package com.practice.asyncpool;

import java.util.List;
import java.util.concurrent.*;

public class PromisePool {
    public static <T> List<T> executePool(List<Callable<T>> tasks, int limit) throws Exception {
        // TODO: Execute tasks with bounded concurrency and preserve original result order
        return null;
    }
}
`
  },
  "dev-3": {
    python: `from typing import Any, List

def mask_sensitive_data(payload: Any, sensitive_keys: List[str] = None) -> Any:
    if sensitive_keys is None:
        sensitive_keys = ['password', 'token', 'cvv', 'secret']
    
    # TODO: Recursively traverse dict/list and mask matching keys with '***REDACTED***'
    return payload
`,
    java: `package com.practice.masking;

import java.util.*;

public class SensitiveDataMasker {
    public static Object maskSensitiveData(Object payload, Set<String> sensitiveKeys) {
        // TODO: Recursively sanitize and mask sensitive keys with '***REDACTED***'
        return payload;
    }
}
`
  },
  "dev-4": {
    python: `from collections import OrderedDict
from typing import Any

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        # TODO: Initialize internal hash map or double linked list
        self.cache = OrderedDict()

    def get(self, key: Any) -> Any:
        # TODO: Retrieve key and update access order
        return -1

    def put(self, key: Any, value: Any) -> None:
        # TODO: Insert or update key, evicting oldest entry if over capacity
        pass
`,
    java: `package com.practice.cache;

import java.util.*;

public class LRUCache<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        // TODO: Initialize data structures (e.g. LinkedHashMap)
    }

    public V get(K key) {
        // TODO: Retrieve key and refresh access freshness
        return null;
    }

    public void put(K key, V value) {
        // TODO: Insert/update and evict least recently used entry
    }
}
`
  },
  "dev-7": {
    python: `from collections import defaultdict
from typing import Callable, Any

class EventEmitter:
    def __init__(self):
        self._events = defaultdict(list)

    def on(self, event_name: str, listener: Callable[..., Any]) -> Callable[[], None]:
        # TODO: Register listener and return unsubscribe callback
        pass

    def emit(self, event_name: str, *args, **kwargs) -> bool:
        # TODO: Invoke all registered listeners for event
        return False

    def off(self, event_name: str, listener: Callable[..., Any]) -> None:
        # TODO: Unregister listener
        pass

    def once(self, event_name: str, listener: Callable[..., Any]) -> None:
        # TODO: Execute listener once and auto-unregister
        pass
`,
    java: `package com.practice.events;

import java.util.*;
import java.util.function.Consumer;

public class EventEmitter {
    public Runnable on(String eventName, Consumer<Object> listener) {
        // TODO: Register listener and return unsubscribe Runnable
        return () -> {};
    }

    public boolean emit(String eventName, Object data) {
        // TODO: Trigger listeners
        return false;
    }
}
`
  },
  "dev-8": {
    python: `import time
import random
import asyncio
from typing import Callable, Any

async def retry_with_backoff(
    fn: Callable[[], Any],
    max_retries: int = 3,
    base_delay_ms: float = 100.0,
    max_delay_ms: float = 2000.0,
    jitter: bool = True
) -> Any:
    # TODO: Retry fn with exponential backoff and randomized jitter
    return await fn()
`,
    java: `package com.practice.resilience;

import java.util.concurrent.Callable;

public class RetryExecutor {
    public static <T> T executeWithBackoff(Callable<T> task, int maxRetries, long baseDelayMs) throws Exception {
        // TODO: Implement exponential backoff retry loop
        return task.call();
    }
}
`
  },
  "dev-9": {
    python: `import time

class CircuitBreaker:
    def __init__(self, fn, failure_threshold: int = 3, cooldown_sec: float = 1.0):
        self.fn = fn
        self.failure_threshold = failure_threshold
        self.cooldown_sec = cooldown_sec
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.failures = 0
        self.next_attempt = 0.0

    async def fire(self, *args, **kwargs):
        # TODO: Manage CLOSED -> OPEN -> HALF_OPEN state transitions
        return await self.fn(*args, **kwargs)
`,
    java: `package com.practice.circuit;

import java.util.function.Supplier;

public class CircuitBreaker<T> {
    private String state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN

    public T execute(Supplier<T> supplier) {
        // TODO: Execute supplier or fast-fail if circuit is OPEN
        return supplier.get();
    }
}
`
  },
  "dev-21": {
    javascript: `// Resilience4j Circuit Breaker in Node.js
class CircuitBreakerService {
  constructor({ failureRateThreshold = 50, waitDurationInOpenStateMs = 5000 } = {}) {
    this.failureRateThreshold = failureRateThreshold;
    this.waitDurationMs = waitDurationInOpenStateMs;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  }

  async executePayment(paymentRequest) {
    // TODO: Protect external payment gateway with circuit breaker state machine
    return { status: "SUCCESS" };
  }
}

module.exports = { CircuitBreakerService };
`,
    python: `class CircuitBreakerService:
    def __init__(self, failure_rate_threshold: int = 50, wait_duration_sec: float = 5.0):
        self.failure_rate_threshold = failure_rate_threshold
        self.wait_duration_sec = wait_duration_sec
        self.state = "CLOSED"

    async def execute_payment(self, payment_request: dict) -> dict:
        # TODO: Fast-fail if OPEN, otherwise execute with fallback
        return {"status": "SUCCESS"}
`
  },
  "dev-26": {
    javascript: `// FastAPI Webhook Receiver in Node.js / Express
const crypto = require('crypto');

class WebhookDispatcher {
  constructor(secret = 'super_secret_webhook_key') {
    this.secret = secret;
  }

  verifySignature(payloadBytes, headerSignature) {
    const computed = crypto.createHmac('sha256', this.secret).update(payloadBytes).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(headerSignature));
  }

  async handleWebhook(req) {
    // TODO: Verify HMAC-SHA256 signature and queue background task
    return { status: "QUEUED" };
  }
}

module.exports = { WebhookDispatcher };
`,
    java: `package com.example.webhook;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;

public class WebhookDispatcher {
    private final String secretKey = "super_secret_webhook_key";

    public boolean verifySignature(byte[] payload, String headerSig) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretKey.getBytes(), "HmacSHA256"));
        byte[] computed = mac.doFinal(payload);
        // TODO: Timing-safe equality check
        return MessageDigest.isEqual(computed, headerSig.getBytes());
    }
}
`
  }
};

/**
 * Generate a clean idiomatic starter template for any dev question in any supported language.
 */
function generateFallbackStarter(question, lang) {
  const title = question?.title || "Dev Practice Task";
  const scenario = question?.scenario || "";
  const reqs = (question?.requirements || []).map(r => ` * - ${r}`).join("\n");

  if (lang === "python") {
    return `"""
Task: ${title}
Scenario: ${scenario}

Requirements:
${(question?.requirements || []).map(r => `# - ${r}`).join("\n")}
"""

class Solution:
    def __init__(self):
        # TODO: Initialize solution state
        pass

    def solve(self, *args, **kwargs):
        # TODO: Implement engineering task requirements
        pass
`;
  }

  if (lang === "java") {
    return `package com.practice.solution;

/**
 * Task: ${title}
 * Scenario: ${scenario}
 *
 * Requirements:
${reqs}
 */
public class Solution {
    public Solution() {
        // TODO: Initialize solution components
    }

    public Object execute(Object... args) {
        // TODO: Implement engineering task requirements
        return null;
    }
}
`;
  }

  // Default: JavaScript
  return `/**
 * Task: ${title}
 * Scenario: ${scenario}
 *
 * Requirements:
${reqs}
 */
class Solution {
  constructor() {
    // TODO: Initialize solution state
  }

  execute(...args) {
    // TODO: Implement engineering task requirements
    return null;
  }
}

module.exports = { Solution };
`;
}

/**
 * Returns the starter code for a dev question in the requested language.
 * Checks:
 * 1. Question's starterCodeByLang[lang]
 * 2. Predefined cross-language dictionary
 * 3. Question's native starterCode if it matches the language
 * 4. Generates an idiomatic starter template
 */
export function getDevStarterCode(question, lang) {
  if (!question) return "";
  const langKey = (lang || DEFAULT_DEV_LANGUAGE).toLowerCase();

  // 1. Explicit multi-lang starter in question definition
  if (question.starterCodeByLang && typeof question.starterCodeByLang[langKey] === "string") {
    return question.starterCodeByLang[langKey];
  }

  // 2. Curated cross-language dictionary
  if (question.id && CROSS_LANG_STARTERS[question.id]?.[langKey]) {
    return CROSS_LANG_STARTERS[question.id][langKey];
  }

  // 3. Question native starterCode if stack matches
  const nativeStack = (question.stack || "").toLowerCase();
  const isNative =
    (langKey === "javascript" && (nativeStack.includes("js") || nativeStack.includes("node") || !question.stack)) ||
    (langKey === "python" && (nativeStack.includes("fastapi") || nativeStack.includes("python"))) ||
    (langKey === "java" && (nativeStack.includes("spring") || nativeStack.includes("java")));

  if (isNative && typeof question.starterCode === "string" && question.starterCode.trim()) {
    return question.starterCode;
  }

  // 4. Generate clean fallback template in target language
  return generateFallbackStarter(question, langKey);
}
