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
          { id: 'devops/git', file: 'git.html', title: 'Git & Version Control', icon: '<i class="ti ti-server-2"></i>', desc: '20 essential commands, branching, merging, team workflows.', depth: 'full' },
          { id: 'devops/github', file: 'github.html', title: 'GitHub', icon: '<i class="ti ti-brand-github"></i>', desc: 'Repos, PRs, Actions integration, collaboration patterns.', depth: 'guide' }
        ]
      },
      {
        id: 'containers',
        label: 'Containers',
        topics: [
          { id: 'devops/docker', file: 'docker.html', title: 'Docker', icon: '<i class="ti ti-brand-docker"></i>', desc: 'Images, containers, Dockerfile, volumes, networking.', depth: 'guide' },
          { id: 'devops/docker-compose', file: 'docker-compose.html', title: 'Docker Compose', icon: '<i class="ti ti-package"></i>', desc: 'Multi-container apps, services, networks, local dev stacks.', depth: 'guide' }
        ]
      },
      {
        id: 'cicd',
        label: 'CI/CD',
        topics: [
          { id: 'devops/cicd', file: 'cicd.html', title: 'CI/CD Overview', icon: '<i class="ti ti-refresh"></i>', desc: 'Pipeline stages, deployment strategies, rollback patterns.', depth: 'guide' },
          { id: 'devops/jenkins', file: 'jenkins.html', title: 'Jenkins', icon: '<i class="ti ti-building"></i>', desc: 'Jobs, pipelines, agents, and enterprise automation.', depth: 'guide' },
          { id: 'devops/github-actions', file: 'github-actions.html', title: 'GitHub Actions', icon: '<i class="ti ti-bolt"></i>', desc: 'Workflows, matrices, secrets, reusable actions.', depth: 'guide' }
        ]
      },
      {
        id: 'orchestration',
        label: 'Orchestration',
        topics: [
          { id: 'devops/kubernetes', file: 'kubernetes.html', title: 'Kubernetes', icon: '<i class="ti ti-brand-kubernetes"></i>', desc: 'Pods, services, deployments, ingress, scaling.', depth: 'guide' },
          { id: 'devops/helm', file: 'helm.html', title: 'Helm', icon: '⎈', desc: 'Charts, releases, values, K8s package management.', depth: 'guide' }
        ]
      },
      {
        id: 'web',
        label: 'Web & Proxy',
        topics: [
          { id: 'devops/nginx', file: 'nginx.html', title: 'Nginx', icon: '<i class="ti ti-world"></i>', desc: 'Reverse proxy, load balancing, SSL termination, caching.', depth: 'guide' },
          { id: 'devops/reverse-proxy', file: 'reverse-proxy.html', title: 'Reverse Proxy', icon: '<i class="ti ti-arrows-shuffle"></i>', desc: 'Proxy patterns, headers, TLS, upstream health checks.', depth: 'guide' }
        ]
      },
      {
        id: 'linux',
        label: 'Linux & Shell',
        topics: [
          { id: 'devops/linux-basics', file: 'linux-basics.html', title: 'Linux Basics', icon: '<i class="ti ti-brand-ubuntu"></i>', desc: 'Filesystem, permissions, processes, systemd, networking.', depth: 'guide' },
          { id: 'devops/bash-scripting', file: 'bash-scripting.html', title: 'Bash Scripting', icon: '<i class="ti ti-code"></i>', desc: 'Variables, loops, functions, error handling, automation.', depth: 'guide' }
        ]
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        topics: [
          { id: 'devops/monitoring', file: 'monitoring.html', title: 'Monitoring & Alerts', icon: '<i class="ti ti-antenna"></i>', desc: 'Metrics, logs, traces, SLIs/SLOs, on-call hygiene.', depth: 'guide' },
          { id: 'devops/prometheus', file: 'prometheus.html', title: 'Prometheus', icon: '<i class="ti ti-flame"></i>', desc: 'Pull metrics, PromQL, alerting rules, exporters.', depth: 'guide' },
          { id: 'devops/grafana', file: 'grafana.html', title: 'Grafana', icon: '<i class="ti ti-chart-bar"></i>', desc: 'Dashboards, panels, alerts, observability visualization.', depth: 'guide' }
        ]
      },
      {
        id: 'cloud',
        label: 'Cloud & Infrastructure',
        topics: [
          { id: 'devops/infrastructure', file: 'infrastructure.html', title: 'Infrastructure Basics', icon: '<i class="ti ti-building"></i>', desc: 'Compute, storage, networking, IAM fundamentals.', depth: 'guide' },
          { id: 'devops/cloud-fundamentals', file: 'cloud-fundamentals.html', title: 'Cloud Fundamentals', icon: '<i class="ti ti-cloud"></i>', desc: 'IaaS/PaaS/SaaS, regions, shared responsibility model.', depth: 'guide' },
          { id: 'devops/aws-basics', file: 'aws-basics.html', title: 'AWS Basics', icon: '<i class="ti ti-brand-aws"></i>', desc: 'EC2, S3, RDS, Lambda, IAM — core AWS building blocks.', depth: 'guide' },
          { id: 'devops/azure-basics', file: 'azure-basics.html', title: 'Azure Basics', icon: '<i class="ti ti-brand-azure"></i>', desc: 'VMs, Blob Storage, App Service, Entra ID overview.', depth: 'guide' },
          { id: 'devops/gcp-basics', file: 'gcp-basics.html', title: 'GCP Basics', icon: '<i class="ti ti-brand-google"></i>', desc: 'Compute Engine, Cloud Storage, GKE, IAM roles.', depth: 'guide' },
          { id: 'devops/terraform', file: 'terraform.html', title: 'Terraform', icon: '<i class="ti ti-world"></i>', desc: 'IaC, state, modules, plan/apply workflow.', depth: 'guide' },
          { id: 'devops/ansible', file: 'ansible.html', title: 'Ansible', icon: '<i class="ti ti-checklist"></i>', desc: 'Playbooks, inventory, idempotent configuration management.', depth: 'guide' }
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
          { id: 'sd/fundamentals', file: 'fundamentals.html', title: 'System Design Fundamentals', icon: '<i class="ti ti-ruler-2"></i>', desc: 'Requirements, CAP, building blocks, design process.', depth: 'guide' },
          { id: 'sd/scalability', file: 'scalability.html', title: 'Scalability', icon: '<i class="ti ti-trending-up"></i>', desc: 'Vertical vs horizontal scale, bottlenecks, capacity planning.', depth: 'guide' },
          { id: 'sd/cap-theorem', file: 'cap-theorem.html', title: 'CAP Theorem', icon: '<i class="ti ti-scale"></i>', desc: 'Consistency, availability, partition tolerance trade-offs.', depth: 'guide' }
        ]
      },
      {
        id: 'traffic',
        label: 'Traffic & Performance',
        topics: [
          { id: 'sd/load-balancing', file: 'load-balancing.html', title: 'Load Balancing', icon: '<i class="ti ti-bolt"></i>', desc: 'L4/L7 balancers, algorithms, health checks, sticky sessions.', depth: 'guide' },
          { id: 'sd/reverse-proxy', file: 'reverse-proxy.html', title: 'Reverse Proxy', icon: '<i class="ti ti-arrows-shuffle"></i>', desc: 'Edge routing, TLS, caching, request forwarding.', depth: 'guide' },
          { id: 'sd/caching', file: 'caching.html', title: 'Caching Strategies', icon: '<i class="ti ti-device-floppy"></i>', desc: 'Cache-aside, CDN, eviction, stampede prevention.', depth: 'guide' },
          { id: 'sd/cdn', file: 'cdn.html', title: 'CDN', icon: '<i class="ti ti-world"></i>', desc: 'Edge caching, origin shielding, static asset delivery.', depth: 'guide' },
          { id: 'sd/rate-limiting', file: 'rate-limiting.html', title: 'Rate Limiting', icon: '<i class="ti ti-traffic-lights"></i>', desc: 'Token bucket, sliding window, API protection.', depth: 'guide' },
          { id: 'sd/api-gateway', file: 'api-gateway.html', title: 'API Gateway', icon: '<i class="ti ti-door"></i>', desc: 'Routing, auth, aggregation, throttling at the edge.', depth: 'guide' }
        ]
      },
      {
        id: 'messaging',
        label: 'Messaging & Events',
        topics: [
          { id: 'sd/queues', file: 'queues.html', title: 'Message Queues', icon: '<i class="ti ti-mailbox"></i>', desc: 'Async decoupling, delivery guarantees, idempotency.', depth: 'guide' },
          { id: 'sd/kafka', file: 'kafka.html', title: 'Apache Kafka', icon: '<i class="ti ti-mail-fast"></i>', desc: 'Topics, partitions, consumer groups, event streaming.', depth: 'guide' },
          { id: 'sd/rabbitmq', file: 'rabbitmq.html', title: 'RabbitMQ', icon: '<i class="ti ti-carrot"></i>', desc: 'Exchanges, queues, routing keys, AMQP patterns.', depth: 'guide' },
          { id: 'sd/event-driven', file: 'event-driven.html', title: 'Event-Driven Systems', icon: '<i class="ti ti-bolt"></i>', desc: 'Events vs commands, pub/sub, event sourcing intro.', depth: 'guide' }
        ]
      },
      {
        id: 'architecture',
        label: 'Architecture Patterns',
        topics: [
          { id: 'sd/microservices', file: 'microservices.html', title: 'Microservices', icon: '<i class="ti ti-puzzle"></i>', desc: 'Service boundaries, API contracts, operational complexity.', depth: 'guide' },
          { id: 'sd/monolith', file: 'monolith.html', title: 'Monolith', icon: '<i class="ti ti-building-bank"></i>', desc: 'Modular monolith, when to stay monolithic, migration paths.', depth: 'guide' },
          { id: 'sd/distributed-systems', file: 'distributed-systems.html', title: 'Distributed Systems', icon: '<i class="ti ti-world"></i>', desc: 'Replication, consensus, failure domains, CAP in practice.', depth: 'guide' }
        ]
      },
      {
        id: 'data',
        label: 'Data at Scale',
        topics: [
          { id: 'sd/consistency-models', file: 'consistency-models.html', title: 'Consistency Models', icon: '<i class="ti ti-link"></i>', desc: 'Strong, eventual, causal consistency explained.', depth: 'guide' },
          { id: 'sd/database-sharding', file: 'database-sharding.html', title: 'Database Sharding', icon: '<i class="ti ti-folders"></i>', desc: 'Shard keys, rebalancing, cross-shard queries.', depth: 'guide' },
          { id: 'sd/replication', file: 'replication.html', title: 'Replication', icon: '<i class="ti ti-checklist"></i>', desc: 'Leader-follower, multi-leader, sync vs async.', depth: 'guide' },
          { id: 'sd/partitioning', file: 'partitioning.html', title: 'Partitioning', icon: '<i class="ti ti-cut"></i>', desc: 'Range vs hash partitioning, hot partitions.', depth: 'guide' }
        ]
      },
      {
        id: 'reliability',
        label: 'Reliability',
        topics: [
          { id: 'sd/service-discovery', file: 'service-discovery.html', title: 'Service Discovery', icon: '<i class="ti ti-search"></i>', desc: 'DNS, Consul, K8s services, client-side discovery.', depth: 'guide' },
          { id: 'sd/high-availability', file: 'high-availability.html', title: 'High Availability', icon: '<i class="ti ti-shield"></i>', desc: 'Redundancy, failover, multi-AZ, RTO/RPO.', depth: 'guide' },
          { id: 'sd/fault-tolerance', file: 'fault-tolerance.html', title: 'Fault Tolerance', icon: '<i class="ti ti-tool"></i>', desc: 'Circuit breakers, retries, bulkheads, graceful degradation.', depth: 'guide' }
        ]
      },
      {
        id: 'frameworks',
        label: 'Backend Frameworks',
        topics: [
          { id: 'sd/django', file: 'django.html', title: 'Django', icon: '<i class="ti ti-brand-django"></i>', desc: 'ORM, admin, auth, REST — batteries-included Python web.', depth: 'full' },
          { id: 'sd/flask', file: 'flask.html', title: 'Flask', icon: '<i class="ti ti-flame"></i>', desc: 'Microframework, blueprints, extensions, lightweight APIs.', depth: 'full' },
          { id: 'sd/fastapi', file: 'fastapi.html', title: 'FastAPI', icon: '<i class="ti ti-bolt"></i>', desc: 'Async APIs, Pydantic, OpenAPI, high-performance Python.', depth: 'full' }
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
          { id: 'db/sql', file: 'sql.html', title: 'SQL Complete Guide', icon: '<i class="ti ti-book-2"></i>', desc: 'Queries, joins, indexes, window functions, normalization.', depth: 'full' },
          { id: 'db/postgres', file: 'postgres.html', title: 'PostgreSQL', icon: '<i class="ti ti-database"></i>', desc: 'Advanced indexing, JSONB, extensions, production tuning.', depth: 'guide' },
          { id: 'db/mysql', file: 'mysql.html', title: 'MySQL', icon: '<i class="ti ti-database"></i>', desc: 'InnoDB, replication, query optimization, common patterns.', depth: 'guide' },
          { id: 'db/mariadb', file: 'mariadb.html', title: 'MariaDB', icon: '<i class="ti ti-database"></i>', desc: 'MySQL fork, compatibility, Galera cluster basics.', depth: 'guide' },
          { id: 'db/sqlite', file: 'sqlite.html', title: 'SQLite', icon: '<i class="ti ti-folder"></i>', desc: 'Embedded DB, single-file, mobile and edge use cases.', depth: 'guide' }
        ]
      },
      {
        id: 'nosql',
        label: 'NoSQL',
        topics: [
          { id: 'db/mongodb', file: 'mongodb.html', title: 'MongoDB', icon: '<i class="ti ti-leaf"></i>', desc: 'Documents, aggregation, indexing, schema design.', depth: 'full' },
          { id: 'db/redis', file: 'redis.html', title: 'Redis', icon: '<i class="ti ti-bolt"></i>', desc: 'Key-value, data structures, caching, pub/sub.', depth: 'guide' },
          { id: 'db/cassandra', file: 'cassandra.html', title: 'Cassandra', icon: '<i class="ti ti-eye"></i>', desc: 'Wide-column, partition keys, eventual consistency at scale.', depth: 'guide' },
          { id: 'db/dynamodb', file: 'dynamodb.html', title: 'DynamoDB', icon: '<i class="ti ti-bolt"></i>', desc: 'Single-table design, GSIs, on-demand vs provisioned.', depth: 'guide' },
          { id: 'db/couchdb', file: 'couchdb.html', title: 'CouchDB', icon: '<i class="ti ti-armchair"></i>', desc: 'Document store, MVCC, CouchDB replication model.', depth: 'guide' }
        ]
      },
      {
        id: 'specialized',
        label: 'Specialized Stores',
        topics: [
          { id: 'db/neo4j', file: 'neo4j.html', title: 'Neo4j (Graph)', icon: '<i class="ti ti-topology-star-3"></i>', desc: 'Nodes, relationships, Cypher, graph traversals.', depth: 'guide' },
          { id: 'db/graph-databases', file: 'graph-databases.html', title: 'Graph Databases', icon: '<i class="ti ti-link"></i>', desc: 'When graphs win, model patterns, use cases.', depth: 'guide' },
          { id: 'db/influxdb', file: 'influxdb.html', title: 'InfluxDB (Time Series)', icon: '<i class="ti ti-trending-up"></i>', desc: 'Metrics, timestamps, retention, downsampling.', depth: 'guide' },
          { id: 'db/elasticsearch', file: 'elasticsearch.html', title: 'Elasticsearch (Search)', icon: '<i class="ti ti-search"></i>', desc: 'Inverted indexes, full-text search, aggregations.', depth: 'guide' }
        ]
      }
    ]
  },

  python: {
    label: 'Python',
    hub: 'programming/python/index.html',
    accent: '#f7cc45',
    categories: [
      {
        id: 'py-core',
        label: 'Core Language',
        topics: [
          { id: 'py/basics', file: 'basics.html', title: 'Python Basics', icon: '<i class="ti ti-brand-python"></i>', desc: 'Syntax, variables, data types, operators, and I/O.', depth: 'guide' },
          { id: 'py/collections', file: 'collections.html', title: 'Collections', icon: '<i class="ti ti-books"></i>', desc: 'Lists, tuples, sets, dicts, and comprehensions.', depth: 'guide' },
          { id: 'py/control', file: 'control.html', title: 'Control Flow', icon: '<i class="ti ti-arrows-shuffle"></i>', desc: 'if/else, loops, match statements, and comprehensions.', depth: 'guide' },
          { id: 'py/functions', file: 'functions.html', title: 'Functions & I/O', icon: '<i class="ti ti-puzzle"></i>', desc: 'Args, *args/**kwargs, lambdas, decorators, files.', depth: 'guide' }
        ]
      },
      {
        id: 'py-advanced',
        label: 'Advanced',
        topics: [
          { id: 'py/oop', file: 'oop.html', title: 'OOP', icon: '<i class="ti ti-building-bank"></i>', desc: 'Classes, inheritance, polymorphism, magic methods.', depth: 'full' },
          { id: 'py/async', file: 'async.html', title: 'Async / Await', icon: '<i class="ti ti-bolt"></i>', desc: 'Event loop, coroutines, asyncio, gather, aiohttp, patterns.', depth: 'full' }
        ]
      },
      {
        id: 'py-applied',
        label: 'Applied',
        topics: [
          { id: 'py/libraries', file: 'libraries.html', title: 'Libraries', icon: '<i class="ti ti-package"></i>', desc: 'Standard library essentials and popular packages.', depth: 'guide' },
          { id: 'py/programs', file: 'programs.html', title: 'Practice Programs', icon: '<i class="ti ti-code"></i>', desc: '50+ annotated programs from beginner to advanced.', depth: 'guide' }
        ]
      }
    ]
  },

  interview: {
    label: 'Interview Prep',
    hub: 'interview/index.html',
    accent: '#f97316',
    categories: [
      {
        id: 'interview-banks',
        label: 'Question Banks',
        topics: [
          { id: 'interview/dsa',           file: 'dsa-interview.html',           title: 'DSA Interview',           icon: '<i class="ti ti-chart-bar"></i>', desc: '60+ problems — arrays, trees, graphs, DP, sorting, and complexity.', depth: 'full' },
          { id: 'interview/python',        file: 'python-interview.html',        title: 'Python Interview',        icon: '<i class="ti ti-brand-python"></i>', desc: 'Python-specific questions — OOP, builtins, decorators, async.', depth: 'guide' },
          { id: 'interview/oop',           file: 'oop-interview.html',           title: 'OOP Interview',           icon: '<i class="ti ti-wall"></i>', desc: 'Classes, inheritance, SOLID principles, design patterns.', depth: 'guide' },
          { id: 'interview/sql',           file: 'sql-interview.html',           title: 'SQL Interview',           icon: '<i class="ti ti-database"></i>', desc: 'Queries, joins, window functions, normalization, indexing.', depth: 'guide' },
          { id: 'interview/aiml',          file: 'aiml-interview.html',          title: 'AI/ML Interview',         icon: '<i class="ti ti-robot"></i>', desc: 'ML concepts, model evaluation, bias-variance, system design for AI.', depth: 'guide' },
          { id: 'interview/devops',        file: 'devops-interview.html',        title: 'DevOps Interview',        icon: '<i class="ti ti-server-2"></i>',  desc: 'CI/CD, Docker, Kubernetes, infrastructure, SRE questions.', depth: 'guide' },
          { id: 'interview/system-design', file: 'system-design-interview.html', title: 'System Design Interview', icon: '<i class="ti ti-building"></i>', desc: 'Scale, availability, caching, databases, distributed systems.', depth: 'guide' }
        ]
      }
    ]
  },

  aiml: {
    label: 'AI / ML',
    hub: 'aiml/index.html',
    accent: '#a78bfa',
    categories: [
      {
        id: 'foundations',
        label: 'Foundations',
        topics: [
          { id: 'aiml/aiml-explained', file: 'aiml-explained.html', title: 'AI / ML Explained', icon: '<i class="ti ti-brain"></i>', desc: 'The full map — what AI, ML, DL, NLP, CV, and RL are and how they relate.', depth: 'full' },
          { id: 'aiml/ml', file: 'ml.html', title: 'Machine Learning', icon: '<i class="ti ti-trending-up"></i>', desc: 'Supervised, unsupervised, core algorithms, bias-variance, evaluation metrics.', depth: 'guide' },
          { id: 'aiml/dl', file: 'dl.html', title: 'Deep Learning', icon: '<i class="ti ti-microscope"></i>', desc: 'Neural nets, backprop, CNNs, RNNs, attention, and transformers.', depth: 'guide' }
        ]
      },
      {
        id: 'specializations',
        label: 'Specializations',
        topics: [
          { id: 'aiml/nlp', file: 'nlp.html', title: 'NLP & LLMs', icon: '<i class="ti ti-message-circle"></i>', desc: 'Text processing, embeddings, attention, BERT, GPT, RAG pipelines.', depth: 'guide' },
          { id: 'aiml/cv', file: 'cv.html', title: 'Computer Vision', icon: '<i class="ti ti-eye"></i>', desc: 'Image classification, object detection, CNNs, YOLO, transfer learning.', depth: 'guide' },
          { id: 'aiml/rl', file: 'rl.html', title: 'Reinforcement Learning', icon: '<i class="ti ti-device-gamepad-2"></i>', desc: 'Agents, environments, rewards, Q-learning, policy gradients.', depth: 'guide' },
          { id: 'aiml/genai', file: 'genai.html', title: 'Generative AI', icon: '<i class="ti ti-sparkles"></i>', desc: 'LLMs, diffusion models, RAG, prompt engineering, production patterns.', depth: 'guide' }
        ]
      },
      {
        id: 'reference',
        label: 'Reference',
        topics: [
          { id: 'aiml/ds-cheatsheet', file: 'ds-cheatsheet.html', title: 'DS & AI Cheat Sheet', icon: '<i class="ti ti-checklist"></i>', desc: 'Stats, pandas, sklearn, NumPy, and model evaluation quick reference.', depth: 'guide' }
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