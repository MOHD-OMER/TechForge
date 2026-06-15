/**
 * TechForge — canonical topic registry for search, hubs, and progress tracking.
 * Single source of truth for section expansion (Phase 2).
 */
window.TF_TOPICS = {
  devops: {
    label: 'DevOps',
    hub: 'devops/index.html',
    accent: '#f97316',
    categories: [
      {
        id: 'vcs',
        label: 'Version Control',
        topics: [
          { id: 'devops/git', file: 'git.html', title: 'Git & Version Control', icon: '⎇', desc: '20 essential commands, branching, merging, team workflows.', depth: 'full' },
          { id: 'devops/github', file: 'github.html', title: 'GitHub', icon: '🐙', desc: 'Repos, PRs, Actions integration, collaboration patterns.', depth: 'guide' }
        ]
      },
      {
        id: 'containers',
        label: 'Containers',
        topics: [
          { id: 'devops/docker', file: 'docker.html', title: 'Docker', icon: '🐳', desc: 'Images, containers, Dockerfile, volumes, networking.', depth: 'guide' },
          { id: 'devops/docker-compose', file: 'docker-compose.html', title: 'Docker Compose', icon: '📦', desc: 'Multi-container apps, services, networks, local dev stacks.', depth: 'guide' }
        ]
      },
      {
        id: 'cicd',
        label: 'CI/CD',
        topics: [
          { id: 'devops/cicd', file: 'cicd.html', title: 'CI/CD Overview', icon: '🔄', desc: 'Pipeline stages, deployment strategies, rollback patterns.', depth: 'guide' },
          { id: 'devops/jenkins', file: 'jenkins.html', title: 'Jenkins', icon: '🏗️', desc: 'Jobs, pipelines, agents, and enterprise automation.', depth: 'guide' },
          { id: 'devops/github-actions', file: 'github-actions.html', title: 'GitHub Actions', icon: '⚡', desc: 'Workflows, matrices, secrets, reusable actions.', depth: 'guide' }
        ]
      },
      {
        id: 'orchestration',
        label: 'Orchestration',
        topics: [
          { id: 'devops/kubernetes', file: 'kubernetes.html', title: 'Kubernetes', icon: '☸️', desc: 'Pods, services, deployments, ingress, scaling.', depth: 'guide' },
          { id: 'devops/helm', file: 'helm.html', title: 'Helm', icon: '⎈', desc: 'Charts, releases, values, K8s package management.', depth: 'guide' }
        ]
      },
      {
        id: 'web',
        label: 'Web & Proxy',
        topics: [
          { id: 'devops/nginx', file: 'nginx.html', title: 'Nginx', icon: '🌐', desc: 'Reverse proxy, load balancing, SSL termination, caching.', depth: 'guide' },
          { id: 'devops/reverse-proxy', file: 'reverse-proxy.html', title: 'Reverse Proxy', icon: '🔀', desc: 'Proxy patterns, headers, TLS, upstream health checks.', depth: 'guide' }
        ]
      },
      {
        id: 'linux',
        label: 'Linux & Shell',
        topics: [
          { id: 'devops/linux-basics', file: 'linux-basics.html', title: 'Linux Basics', icon: '🐧', desc: 'Filesystem, permissions, processes, systemd, networking.', depth: 'guide' },
          { id: 'devops/bash-scripting', file: 'bash-scripting.html', title: 'Bash Scripting', icon: '💻', desc: 'Variables, loops, functions, error handling, automation.', depth: 'guide' }
        ]
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        topics: [
          { id: 'devops/monitoring', file: 'monitoring.html', title: 'Monitoring & Alerts', icon: '📡', desc: 'Metrics, logs, traces, SLIs/SLOs, on-call hygiene.', depth: 'guide' },
          { id: 'devops/prometheus', file: 'prometheus.html', title: 'Prometheus', icon: '🔥', desc: 'Pull metrics, PromQL, alerting rules, exporters.', depth: 'guide' },
          { id: 'devops/grafana', file: 'grafana.html', title: 'Grafana', icon: '📊', desc: 'Dashboards, panels, alerts, observability visualization.', depth: 'guide' }
        ]
      },
      {
        id: 'cloud',
        label: 'Cloud & Infrastructure',
        topics: [
          { id: 'devops/infrastructure', file: 'infrastructure.html', title: 'Infrastructure Basics', icon: '🏗️', desc: 'Compute, storage, networking, IAM fundamentals.', depth: 'guide' },
          { id: 'devops/cloud-fundamentals', file: 'cloud-fundamentals.html', title: 'Cloud Fundamentals', icon: '☁️', desc: 'IaaS/PaaS/SaaS, regions, shared responsibility model.', depth: 'guide' },
          { id: 'devops/aws-basics', file: 'aws-basics.html', title: 'AWS Basics', icon: '🟠', desc: 'EC2, S3, RDS, Lambda, IAM — core AWS building blocks.', depth: 'guide' },
          { id: 'devops/azure-basics', file: 'azure-basics.html', title: 'Azure Basics', icon: '🔷', desc: 'VMs, Blob Storage, App Service, Entra ID overview.', depth: 'guide' },
          { id: 'devops/gcp-basics', file: 'gcp-basics.html', title: 'GCP Basics', icon: '🔴', desc: 'Compute Engine, Cloud Storage, GKE, IAM roles.', depth: 'guide' },
          { id: 'devops/terraform', file: 'terraform.html', title: 'Terraform', icon: '🌍', desc: 'IaC, state, modules, plan/apply workflow.', depth: 'guide' },
          { id: 'devops/ansible', file: 'ansible.html', title: 'Ansible', icon: '📋', desc: 'Playbooks, inventory, idempotent configuration management.', depth: 'guide' }
        ]
      }
    ]
  },
  'system-design': {
    label: 'System Design',
    hub: 'system-design/index.html',
    accent: '#22c55e',
    categories: [
      {
        id: 'fundamentals',
        label: 'Fundamentals',
        topics: [
          { id: 'sd/fundamentals', file: 'fundamentals.html', title: 'System Design Fundamentals', icon: '📐', desc: 'Requirements, CAP, building blocks, design process.', depth: 'guide' },
          { id: 'sd/scalability', file: 'scalability.html', title: 'Scalability', icon: '📈', desc: 'Vertical vs horizontal scale, bottlenecks, capacity planning.', depth: 'guide' },
          { id: 'sd/cap-theorem', file: 'cap-theorem.html', title: 'CAP Theorem', icon: '⚖️', desc: 'Consistency, availability, partition tolerance trade-offs.', depth: 'guide' }
        ]
      },
      {
        id: 'traffic',
        label: 'Traffic & Performance',
        topics: [
          { id: 'sd/load-balancing', file: 'load-balancing.html', title: 'Load Balancing', icon: '⚡', desc: 'L4/L7 balancers, algorithms, health checks, sticky sessions.', depth: 'guide' },
          { id: 'sd/reverse-proxy', file: 'reverse-proxy.html', title: 'Reverse Proxy', icon: '🔀', desc: 'Edge routing, TLS, caching, request forwarding.', depth: 'guide' },
          { id: 'sd/caching', file: 'caching.html', title: 'Caching Strategies', icon: '💾', desc: 'Cache-aside, CDN, eviction, stampede prevention.', depth: 'guide' },
          { id: 'sd/cdn', file: 'cdn.html', title: 'CDN', icon: '🌍', desc: 'Edge caching, origin shielding, static asset delivery.', depth: 'guide' },
          { id: 'sd/rate-limiting', file: 'rate-limiting.html', title: 'Rate Limiting', icon: '🚦', desc: 'Token bucket, sliding window, API protection.', depth: 'guide' },
          { id: 'sd/api-gateway', file: 'api-gateway.html', title: 'API Gateway', icon: '🚪', desc: 'Routing, auth, aggregation, throttling at the edge.', depth: 'guide' }
        ]
      },
      {
        id: 'messaging',
        label: 'Messaging & Events',
        topics: [
          { id: 'sd/queues', file: 'queues.html', title: 'Message Queues', icon: '📬', desc: 'Async decoupling, delivery guarantees, idempotency.', depth: 'guide' },
          { id: 'sd/kafka', file: 'kafka.html', title: 'Apache Kafka', icon: '📨', desc: 'Topics, partitions, consumer groups, event streaming.', depth: 'guide' },
          { id: 'sd/rabbitmq', file: 'rabbitmq.html', title: 'RabbitMQ', icon: '🐰', desc: 'Exchanges, queues, routing keys, AMQP patterns.', depth: 'guide' },
          { id: 'sd/event-driven', file: 'event-driven.html', title: 'Event-Driven Systems', icon: '⚡', desc: 'Events vs commands, pub/sub, event sourcing intro.', depth: 'guide' }
        ]
      },
      {
        id: 'architecture',
        label: 'Architecture Patterns',
        topics: [
          { id: 'sd/microservices', file: 'microservices.html', title: 'Microservices', icon: '🧩', desc: 'Service boundaries, API contracts, operational complexity.', depth: 'guide' },
          { id: 'sd/monolith', file: 'monolith.html', title: 'Monolith', icon: '🏛️', desc: 'Modular monolith, when to stay monolithic, migration paths.', depth: 'guide' },
          { id: 'sd/distributed-systems', file: 'distributed-systems.html', title: 'Distributed Systems', icon: '🌐', desc: 'Replication, consensus, failure domains, CAP in practice.', depth: 'guide' }
        ]
      },
      {
        id: 'data',
        label: 'Data at Scale',
        topics: [
          { id: 'sd/consistency-models', file: 'consistency-models.html', title: 'Consistency Models', icon: '🔗', desc: 'Strong, eventual, causal consistency explained.', depth: 'guide' },
          { id: 'sd/database-sharding', file: 'database-sharding.html', title: 'Database Sharding', icon: '🗂️', desc: 'Shard keys, rebalancing, cross-shard queries.', depth: 'guide' },
          { id: 'sd/replication', file: 'replication.html', title: 'Replication', icon: '📋', desc: 'Leader-follower, multi-leader, sync vs async.', depth: 'guide' },
          { id: 'sd/partitioning', file: 'partitioning.html', title: 'Partitioning', icon: '✂️', desc: 'Range vs hash partitioning, hot partitions.', depth: 'guide' }
        ]
      },
      {
        id: 'reliability',
        label: 'Reliability',
        topics: [
          { id: 'sd/service-discovery', file: 'service-discovery.html', title: 'Service Discovery', icon: '🔍', desc: 'DNS, Consul, K8s services, client-side discovery.', depth: 'guide' },
          { id: 'sd/high-availability', file: 'high-availability.html', title: 'High Availability', icon: '🛡️', desc: 'Redundancy, failover, multi-AZ, RTO/RPO.', depth: 'guide' },
          { id: 'sd/fault-tolerance', file: 'fault-tolerance.html', title: 'Fault Tolerance', icon: '🔧', desc: 'Circuit breakers, retries, bulkheads, graceful degradation.', depth: 'guide' }
        ]
      },
      {
        id: 'frameworks',
        label: 'Backend Frameworks',
        topics: [
          { id: 'sd/django', file: 'django.html', title: 'Django', icon: '🎸', desc: 'ORM, admin, auth, REST — batteries-included Python web.', depth: 'full' },
          { id: 'sd/flask', file: 'flask.html', title: 'Flask', icon: '🌶️', desc: 'Microframework, blueprints, extensions, lightweight APIs.', depth: 'full' },
          { id: 'sd/fastapi', file: 'fastapi.html', title: 'FastAPI', icon: '⚡', desc: 'Async APIs, Pydantic, OpenAPI, high-performance Python.', depth: 'full' }
        ]
      }
    ]
  },
  databases: {
    label: 'Database Systems',
    hub: 'databases/index.html',
    accent: '#4d9ef7',
    categories: [
      {
        id: 'relational',
        label: 'Relational (RDBMS)',
        topics: [
          { id: 'db/sql', file: 'sql.html', title: 'SQL Complete Guide', icon: '📘', desc: 'Queries, joins, indexes, window functions, normalization.', depth: 'full' },
          { id: 'db/postgres', file: 'postgres.html', title: 'PostgreSQL', icon: '🐘', desc: 'Advanced indexing, JSONB, extensions, production tuning.', depth: 'guide' },
          { id: 'db/mysql', file: 'mysql.html', title: 'MySQL', icon: '🐬', desc: 'InnoDB, replication, query optimization, common patterns.', depth: 'guide' },
          { id: 'db/mariadb', file: 'mariadb.html', title: 'MariaDB', icon: '🦭', desc: 'MySQL fork, compatibility, Galera cluster basics.', depth: 'guide' },
          { id: 'db/sqlite', file: 'sqlite.html', title: 'SQLite', icon: '📁', desc: 'Embedded DB, single-file, mobile and edge use cases.', depth: 'guide' }
        ]
      },
      {
        id: 'nosql',
        label: 'NoSQL',
        topics: [
          { id: 'db/mongodb', file: 'mongodb.html', title: 'MongoDB', icon: '🍃', desc: 'Documents, aggregation, indexing, schema design.', depth: 'full' },
          { id: 'db/redis', file: 'redis.html', title: 'Redis', icon: '⚡', desc: 'Key-value, data structures, caching, pub/sub.', depth: 'guide' },
          { id: 'db/cassandra', file: 'cassandra.html', title: 'Cassandra', icon: '👁️', desc: 'Wide-column, partition keys, eventual consistency at scale.', depth: 'guide' },
          { id: 'db/dynamodb', file: 'dynamodb.html', title: 'DynamoDB', icon: '⚡', desc: 'Single-table design, GSIs, on-demand vs provisioned.', depth: 'guide' },
          { id: 'db/couchdb', file: 'couchdb.html', title: 'CouchDB', icon: '🛋️', desc: 'Document store, MVCC, CouchDB replication model.', depth: 'guide' }
        ]
      },
      {
        id: 'specialized',
        label: 'Specialized Stores',
        topics: [
          { id: 'db/neo4j', file: 'neo4j.html', title: 'Neo4j (Graph)', icon: '🕸️', desc: 'Nodes, relationships, Cypher, graph traversals.', depth: 'guide' },
          { id: 'db/graph-databases', file: 'graph-databases.html', title: 'Graph Databases', icon: '🔗', desc: 'When graphs win, model patterns, use cases.', depth: 'guide' },
          { id: 'db/influxdb', file: 'influxdb.html', title: 'InfluxDB (Time Series)', icon: '📈', desc: 'Metrics, timestamps, retention, downsampling.', depth: 'guide' },
          { id: 'db/elasticsearch', file: 'elasticsearch.html', title: 'Elasticsearch (Search)', icon: '🔎', desc: 'Inverted indexes, full-text search, aggregations.', depth: 'guide' }
        ]
      }
    ]
  }
};

/** Flat index for search */
window.TF_TOPIC_INDEX = (function () {
  const list = [];
  Object.keys(window.TF_TOPICS).forEach(function (sectionKey) {
    const section = window.TF_TOPICS[sectionKey];
    section.categories.forEach(function (cat) {
      cat.topics.forEach(function (t) {
        list.push({
          id: t.id,
          title: t.title,
          desc: t.desc,
          icon: t.icon,
          section: section.label,
          sectionKey: sectionKey,
          href: sectionKey + '/' + t.file,
          depth: t.depth || 'guide'
        });
      });
    });
  });
  return list;
})();
