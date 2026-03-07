name: performance-optimization
description: Diagnoses systemic performance bottlenecks across the Voice of Tihama platform and prescribes advanced optimization strategies to ensure high availability and sub-second latency.

skill_overview: >
  This tool conducts a holistic performance audit spanning the entire full-stack architecture. It is designed to identify resource-heavy operations—from complex database transactions to client-side rendering—and implement scalable solutions to handle high-volume traffic and intensive background tasks efficiently.

performance_audit_focus:
  - Database Query Execution & Prisma ORM Efficiency
  - RSS Ingestion Throughput & I/O Latency
  - AI Rewriting Pipeline Execution & External API Overhead
  - Frontend Rendering Metrics (Core Web Vitals, TTFB, LCP, CLS)
  - Server-Side Resource Utilization (Node.js Event Loop, Memory Leaks)

recommended_optimization_strategies:
  - Advanced Redis Caching Architectures (Query caching, Session stores, TTL management)
  - Asynchronous Background Processing & Task Queues (e.g., leveraging Redis/BullMQ)
  - Database Indexing, Normalization & Query Refinement
  - Frontend Asset Optimization, Lazy Loading, & Route-based Code Splitting
  - Connection Pooling Optimization & Efficient Resource Allocation

execution_directive: >
  Conduct a comprehensive profiling of the application stack to pinpoint latency spikes and processing bottlenecks. Deliver actionable, code-level optimization plans utilizing caching, asynchronous background jobs, and query refinement to maximize overall system throughput and ensure a seamless user experience.