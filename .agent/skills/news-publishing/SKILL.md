name: news-publishing
description: Audits and enhances the omnichannel social publishing microservices, ensuring robust, automated, and fault-tolerant content distribution across Telegram, WhatsApp, and Facebook.

skill_overview: >
  This tool evaluates the outbound distribution architecture of the Voice of Tihama platform. It focuses on maintaining high availability, precise message formatting, and resilient delivery mechanisms across disparate social media APIs.

target_platforms:
  - Telegram (Bot/Channel API)
  - WhatsApp (Business API / Cloud API)
  - Facebook (Graph API / Pages API)

publishing_optimization_focus:
  - API Reliability, Connection Stability & Webhook Management
  - Platform-Specific Message Formatting & Rich Media Handling
  - Rate Limiting Strategies, Quota Management & Throttling
  - Advanced Retry Logic, Exponential Backoff & Dead Letter Queues (DLQ)
  - Asynchronous Delivery & Publishing Status Tracking
  - Fault Tolerance & Graceful Degradation in Microservices

execution_directive: >
  Analyze the multi-channel publishing pipeline to identify vulnerabilities in third-party API integrations. Propose resilient architectural patterns and error-handling strategies to guarantee a stable, zero-drop social distribution system.